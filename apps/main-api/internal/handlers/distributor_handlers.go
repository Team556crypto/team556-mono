package handlers

import (
    "encoding/json"
    "errors"
    "net/http"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/team556-mono/server/internal/config"
    "github.com/team556-mono/server/internal/crypto"
    "github.com/team556-mono/server/internal/distributors"
    "github.com/team556-mono/server/internal/models"
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

type DistributorHandler struct {
    db  *gorm.DB
    cfg *config.Config
}

// PricingSettings represent per-distributor pricing behavior for a merchant
// These are non-sensitive and stored in DistributorConnection.Meta
// Fields are optional; defaults applied on read
// rounding: "none" | "nearest" | "up"
type PricingSettings struct {
    MarginPercent      *float64 `json:"margin_percent,omitempty"`
    MinMarginPercent   *float64 `json:"min_margin_percent,omitempty"`
    Rounding           *string  `json:"rounding,omitempty"`
    PriceFloorCents    *int64   `json:"price_floor_cents,omitempty"`
    MapEnforced        *bool    `json:"map_enforced,omitempty"`
    ShippingHandlingCents *int64 `json:"shipping_handling_cents,omitempty"`
}

type DistributorSettings struct {
    Pricing PricingSettings `json:"pricing"`
}

func NewDistributorHandler(db *gorm.DB, cfg *config.Config) *DistributorHandler {
    return &DistributorHandler{db: db, cfg: cfg}
}

// GET /api/distributors
func (h *DistributorHandler) ListSupported(c *fiber.Ctx) error {
    return c.Status(http.StatusOK).JSON(fiber.Map{
        "distributors": distributors.GetSupported(),
    })
}

// GET /api/distributor-connections
func (h *DistributorHandler) ListConnections(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok { return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }

    var conns []models.DistributorConnection
    if err := h.db.Where("user_id = ?", userID).Find(&conns).Error; err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to list connections"})
    }
    // Strip sensitive data
    type connOut struct {
        ID              uint   `json:"id"`
        DistributorCode string `json:"distributor_code"`
        Status          string `json:"status"`
        LastSyncAt      *string `json:"last_sync_at,omitempty"`
        UpdatedAt       string `json:"updated_at"`
        CreatedAt       string `json:"created_at"`
    }
    outs := make([]connOut, 0, len(conns))
    for _, cc := range conns {
        var last *string
        if cc.LastSyncAt != nil { s := cc.LastSyncAt.UTC().Format(time.RFC3339); last = &s }
        outs = append(outs, connOut{
            ID: cc.ID, DistributorCode: cc.DistributorCode, Status: cc.Status,
            LastSyncAt: last, UpdatedAt: cc.UpdatedAt.UTC().Format(time.RFC3339), CreatedAt: cc.CreatedAt.UTC().Format(time.RFC3339),
        })
    }
    return c.Status(http.StatusOK).JSON(fiber.Map{"connections": outs})
}

// POST /api/distributor-connections
// Body: { distributor_code: string, credentials: { ... } }
func (h *DistributorHandler) UpsertConnection(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok { return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }

    var body struct {
        DistributorCode string                 `json:"distributor_code"`
        Credentials     map[string]string      `json:"credentials"`
    }
    if err := c.BodyParser(&body); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
    }
    if body.DistributorCode == "" || len(body.Credentials) == 0 {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing distributor_code or credentials"})
    }

    // Ensure supported
    client, err := distributors.GetClient(body.DistributorCode)
    if err != nil { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "unsupported distributor"}) }

    // Serialize and encrypt credentials
    raw, err := json.Marshal(body.Credentials)
    if err != nil { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid credentials"}) }

    secret := h.cfg.ArmorySecret
    if secret == "" { return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "server not configured for credential encryption"}) }

    enc, err := crypto.EncryptAESGCM(string(raw), secret)
    if err != nil { return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to encrypt credentials"}) }

    var existing models.DistributorConnection
    tx := h.db.Where("user_id = ? AND distributor_code = ?", userID, body.DistributorCode).First(&existing)
    if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
        // create
        rec := models.DistributorConnection{UserID: userID, DistributorCode: body.DistributorCode, EncryptedCredentials: enc, Status: "connected"}
        if err := h.db.Create(&rec).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save connection"})
        }
    } else if tx.Error == nil {
        existing.EncryptedCredentials = enc
        if existing.Status == "" { existing.Status = "connected" }
        if err := h.db.Save(&existing).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update connection"})
        }
    } else {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
    }

    // Optionally validate immediately
    if err := client.Validate(body.Credentials); err != nil {
        return c.Status(http.StatusOK).JSON(fiber.Map{"message": "saved, but validation failed", "valid": false, "error": err.Error()})
    }

    return c.Status(http.StatusOK).JSON(fiber.Map{"message": "connection saved", "valid": true})
}

// POST /api/distributor-connections/:code/validate
func (h *DistributorHandler) ValidateConnection(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok { return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }

    code := c.Params("code")
    if code == "" { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing code"}) }

    client, err := distributors.GetClient(code)
    if err != nil { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "unsupported distributor"}) }

    var conn models.DistributorConnection
    if err := h.db.Where("user_id = ? AND distributor_code = ?", userID, code).First(&conn).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "connection not found"})
        }
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
    }

    secret := h.cfg.ArmorySecret
    if secret == "" { return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "server not configured for credential encryption"}) }

    raw, err := crypto.DecryptAESGCM(conn.EncryptedCredentials, secret)
    if err != nil { return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to decrypt credentials"}) }

    creds := map[string]string{}
    if err := json.Unmarshal([]byte(raw), &creds); err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "invalid stored credentials"})
    }

    if err := client.Validate(creds); err != nil {
        conn.Status = "error"
        _ = h.db.Save(&conn).Error
        return c.Status(http.StatusOK).JSON(fiber.Map{"valid": false, "error": err.Error()})
    }

    conn.Status = "connected"
    _ = h.db.Save(&conn).Error
    return c.Status(http.StatusOK).JSON(fiber.Map{"valid": true})
}

// GET /api/distributor-connections/:code/settings
func (h *DistributorHandler) GetSettings(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok { return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }

    code := c.Params("code")
    if code == "" { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing code"}) }

    var conn models.DistributorConnection
    if err := h.db.Where("user_id = ? AND distributor_code = ?", userID, code).First(&conn).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "connection not found"})
        }
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
    }

    // If no meta, return defaults
    if len(conn.Meta) == 0 || string(conn.Meta) == "null" {
        return c.Status(http.StatusOK).JSON(DistributorSettings{ Pricing: PricingSettings{} })
    }

    var settings DistributorSettings
    if err := json.Unmarshal(conn.Meta, &settings); err != nil {
        // If parsing fails, return empty default rather than erroring hard
        return c.Status(http.StatusOK).JSON(DistributorSettings{ Pricing: PricingSettings{} })
    }

    return c.Status(http.StatusOK).JSON(settings)
}

// PATCH /api/distributor-connections/:code/settings
func (h *DistributorHandler) UpdateSettings(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok { return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }

    code := c.Params("code")
    if code == "" { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing code"}) }

    var conn models.DistributorConnection
    if err := h.db.Where("user_id = ? AND distributor_code = ?", userID, code).First(&conn).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "connection not found"})
        }
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
    }

    var incoming DistributorSettings
    if err := c.BodyParser(&incoming); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
    }

    b, err := json.Marshal(incoming)
    if err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid settings"})
    }

    conn.Meta = datatypes.JSON(b)
    if err := h.db.Save(&conn).Error; err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save settings"})
    }

    return c.Status(http.StatusOK).JSON(fiber.Map{"message": "settings updated"})
}
