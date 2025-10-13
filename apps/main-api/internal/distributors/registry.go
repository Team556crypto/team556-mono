package distributors

import "errors"

// DistributorInfo describes a supported distributor and the required credential fields
type DistributorInfo struct {
    Code        string   `json:"code"`
    Name        string   `json:"name"`
    DocsURL     string   `json:"docs_url"`
    AuthType    string   `json:"auth_type"`
    Fields      []string `json:"fields"` // list of required credential field keys (e.g., ["sid","token"]) 
}

// Client defines the minimal interface a distributor client should implement
// so we can validate credentials and later fetch feeds.
type Client interface {
    Validate(creds map[string]string) error
}

var supported = []DistributorInfo{
    {
        Code:     "chattanooga",
        Name:     "Chattanooga Shooting Supplies",
        DocsURL:  "https://developers.chattanoogashooting.com/api/rest/v5/documentation",
        AuthType: "basic+md5-token",
        Fields:   []string{"sid", "token"},
    },
}

// GetSupported returns the list of supported distributors
func GetSupported() []DistributorInfo { return supported }

// GetClient returns a typed client implementation for the given distributor code
func GetClient(code string) (Client, error) {
    switch code {
    case "chattanooga":
        return &ChattanoogaClient{}, nil
    default:
        return nil, errors.New("unsupported distributor code")
    }
}