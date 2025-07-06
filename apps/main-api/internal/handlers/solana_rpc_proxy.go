package handlers

import (
    "bytes"
    "io"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/gofiber/fiber/v2"
)

// SolanaRpcProxy proxies arbitrary JSON-RPC requests from the wallet/webapp to a
// private RPC provider. This keeps the API key server-side so it is never
// exposed in client bundles.
//
// Environment variables expected:
//   SOLANA_MAINNET_RPC_URL  – full HTTPS URL with API key, e.g.
//                             https://rpc.helius.xyz/?api-key=xxxxx
//   (optional) SOLANA_FALLBACK_RPC_URL – secondary endpoint if the first fails.
func SolanaRpcProxy(c *fiber.Ctx) error {
    upstreamPrimary := os.Getenv("SOLANA_MAINNET_RPC_URL")
    if upstreamPrimary == "" {
        // Fallback: construct Alchemy endpoint from existing global key to avoid extra secrets
        if key := os.Getenv("GLOBAL__ALCHEMY_API_KEY"); key != "" {
            upstreamPrimary = "https://solana-mainnet.g.alchemy.com/v2/" + key
            log.Println("Using Alchemy RPC endpoint derived from GLOBAL__ALCHEMY_API_KEY")
        }
    }
    if upstreamPrimary == "" {
        log.Println("No upstream RPC URL configured (SOLANA_MAINNET_RPC_URL or GLOBAL__ALCHEMY_API_KEY)")
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "RPC proxy not configured"})
    }
    upstreams := []string{upstreamPrimary}
    if fb := os.Getenv("SOLANA_FALLBACK_RPC_URL"); fb != "" {
        upstreams = append(upstreams, fb)
    }

    // Capture raw JSON-RPC body
    body := c.Body()
    if len(body) == 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "empty body"})
    }

    // Forward to first responsive upstream
    for idx, url := range upstreams {
        respBody, status, err := forwardRpc(url, body)
        if err != nil {
            log.Printf("RPC proxy attempt %d to %s failed: %v", idx+1, url, err)
            continue
        }
        // Mirror status and body back to caller
        c.Status(status)
        c.Set("Content-Type", "application/json")
        return c.Send(respBody)
    }

    return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "all RPC upstreams failed"})
}

func forwardRpc(url string, body []byte) ([]byte, int, error) {
    req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
    if err != nil {
        return nil, 0, err
    }
    req.Header.Set("Content-Type", "application/json")
    client := &http.Client{Timeout: 15 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, 0, err
    }
    defer resp.Body.Close()
    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, resp.StatusCode, err
    }
    return respBody, resp.StatusCode, nil
}
