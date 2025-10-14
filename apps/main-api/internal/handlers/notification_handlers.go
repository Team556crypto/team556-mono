package handlers

import (
    "encoding/json"
    "net/http"
    "net/mail"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/team556-mono/server/internal/config"
    "github.com/team556-mono/server/internal/models"
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

type NotificationHandler struct {
    db  *gorm.DB
    cfg *config.Config
}

func NewNotificationHandler(db *gorm.DB, cfg *config.Config) *NotificationHandler {
    return &NotificationHandler{db: db, cfg: cfg}
}

var allowedTypes = map[string]bool{
    "transaction": true,
    "alerts":      true,
    "security":    true,
    "marketing":   true,
}

// GET /api/notifications/settings
func (h *NotificationHandler) GetSettings(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }

    // Fetch user for email and verification flag
    var user models.User
    if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load user"})
    }

    var settings models.NotificationSettings
    if err := h.db.Where("user_id = ?", userID).First(&settings).Error; err != nil {
        if err != gorm.ErrRecordNotFound {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load settings"})
        }
        // No row yet; return defaults
        return c.Status(http.StatusOK).JSON(fiber.Map{
            "email_enabled":              true,
            "push_enabled":               false,
            "types":                      []string{},
            "contact_email":              user.Email,
            "daily_summary_enabled":      false,
            "transaction_alerts_enabled": false,
            "marketing_opt_in":           false,
            "email_verified":             user.EmailVerified,
        })
    }

    // Decode types
    var types []string
    if len(settings.Types) > 0 {
        _ = json.Unmarshal(settings.Types, &types)
    }

    return c.Status(http.StatusOK).JSON(fiber.Map{
        "email_enabled":              settings.EmailEnabled,
        "push_enabled":               settings.PushEnabled,
        "types":                      types,
        "contact_email":              settings.ContactEmail,
        "daily_summary_enabled":      settings.DailySummaryEnabled,
        "transaction_alerts_enabled": settings.TransactionAlertsEnabled,
        "marketing_opt_in":           settings.MarketingOptIn,
        "email_verified":             user.EmailVerified,
    })
}

// PATCH /api/notifications/settings
func (h *NotificationHandler) UpdateSettings(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }

    var body struct {
        EmailEnabled             *bool     `json:"email_enabled"`
        PushEnabled              *bool     `json:"push_enabled"`
        Types                    []string  `json:"types"`
        ContactEmail             *string   `json:"contact_email"`
        DailySummaryEnabled      *bool     `json:"daily_summary_enabled"`
        TransactionAlertsEnabled *bool     `json:"transaction_alerts_enabled"`
        MarketingOptIn           *bool     `json:"marketing_opt_in"`
    }
    if err := c.BodyParser(&body); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
    }

    // Validate types
    unique := map[string]bool{}
    cleaned := make([]string, 0, len(body.Types))
    for _, t := range body.Types {
        if !allowedTypes[t] { return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid notification type: " + t}) }
        if !unique[t] { unique[t] = true; cleaned = append(cleaned, t) }
    }

    // Validate email if provided
    if body.ContactEmail != nil && *body.ContactEmail != "" {
        if _, err := mail.ParseAddress(*body.ContactEmail); err != nil {
            return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid contact_email"})
        }
    }

    // Upsert
    var settings models.NotificationSettings
    tx := h.db.Where("user_id = ?", userID).First(&settings)
    if tx.Error != nil && tx.Error != gorm.ErrRecordNotFound && tx.Error != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to query settings"})
    }

    // Apply fields
    if body.EmailEnabled != nil { settings.EmailEnabled = *body.EmailEnabled }
    if body.PushEnabled != nil { settings.PushEnabled = *body.PushEnabled }
    if body.ContactEmail != nil { settings.ContactEmail = body.ContactEmail }
    if body.DailySummaryEnabled != nil { settings.DailySummaryEnabled = *body.DailySummaryEnabled }
    if body.TransactionAlertsEnabled != nil { settings.TransactionAlertsEnabled = *body.TransactionAlertsEnabled }
    if body.MarketingOptIn != nil { settings.MarketingOptIn = *body.MarketingOptIn }

    if body.Types != nil {
        b, _ := json.Marshal(cleaned)
        settings.Types = datatypes.JSON(b)
    }

    settings.UserID = userID

    if tx.Error == gorm.ErrRecordNotFound {
        if err := h.db.Create(&settings).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create settings"})
        }
    } else {
        if err := h.db.Save(&settings).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update settings"})
        }
    }

return c.Status(http.StatusOK).JSON(fiber.Map{"message": "settings updated"})
}

// POST /api/notifications/push/devices
// Registers or updates a device token for push notifications
func (h *NotificationHandler) RegisterPushDevice(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }

    var body struct {
        Token    string `json:"token"`
        Platform string `json:"platform"` // ios | android | web
    }
    if err := c.BodyParser(&body); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
    }
    if body.Token == "" {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "token is required"})
    }
    switch body.Platform {
    case "ios", "android", "web":
    default:
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid platform"})
    }

    // Upsert by (user_id, token)
    var dev models.PushDevice
    tx := h.db.Where("user_id = ? AND token = ?", userID, body.Token).First(&dev)
    now := time.Now().UTC()
    if tx.Error == gorm.ErrRecordNotFound {
        dev = models.PushDevice{UserID: userID, Token: body.Token, Platform: body.Platform, LastSeenAt: now, Active: true}
        if err := h.db.Create(&dev).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to register device"})
        }
    } else if tx.Error != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to lookup device"})
    } else {
        dev.Platform = body.Platform
        dev.LastSeenAt = now
        dev.Active = true
        if err := h.db.Save(&dev).Error; err != nil {
            return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update device"})
        }
    }

    return c.Status(http.StatusOK).JSON(fiber.Map{"message": "device registered"})
}

// DELETE /api/notifications/push/devices
// Deactivates a device token for the authenticated user
func (h *NotificationHandler) UnregisterPushDevice(c *fiber.Ctx) error {
    userIDVal := c.Locals("userID")
    userID, ok := userIDVal.(uint)
    if !ok {
        return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }

    // Accept token from body or query string
    var body struct { Token string `json:"token"` }
    _ = c.BodyParser(&body)
    token := body.Token
    if token == "" {
        token = c.Query("token", "")
    }
    if token == "" {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "token is required"})
    }

    var dev models.PushDevice
    if err := h.db.Where("user_id = ? AND token = ?", userID, token).First(&dev).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "device not found"})
        }
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to lookup device"})
    }

    dev.Active = false
    dev.LastSeenAt = time.Now().UTC()
    if err := h.db.Save(&dev).Error; err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to deactivate device"})
    }

    return c.Status(http.StatusNoContent).Send(nil)
}
