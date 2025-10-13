package distributors

import (
    "crypto/md5"
    "encoding/hex"
    "errors"
    "fmt"
    "net/http"
    "time"
)

// ChattanoogaClient implements credential validation and feed retrieval for CSSI
// Docs indicate Authorization header format: "Basic [SID]:[MD5(token)]"
// Endpoint base: https://api.chattanoogashooting.com/rest/v5/

type ChattanoogaClient struct{}

func (c *ChattanoogaClient) Validate(creds map[string]string) error {
    sid := creds["sid"]
    token := creds["token"]
    if sid == "" || token == "" {
        return errors.New("missing sid or token")
    }

    // Build Authorization header per docs
    h := md5.Sum([]byte(token))
    tokenMD5 := hex.EncodeToString(h[:])
    authHeader := fmt.Sprintf("Basic %s:%s", sid, tokenMD5)

    req, err := http.NewRequest("GET", "https://api.chattanoogashooting.com/rest/v5/items/product-feed?per_page=1", nil)
    if err != nil { return err }
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Accept", "application/json")

    httpClient := &http.Client{ Timeout: 20 * time.Second }
    resp, err := httpClient.Do(req)
    if err != nil { return err }
    defer resp.Body.Close()

    if resp.StatusCode == http.StatusOK { return nil }
    if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
        return errors.New("invalid credentials")
    }
    return fmt.Errorf("unexpected response status: %d", resp.StatusCode)
}