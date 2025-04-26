package email

import (
	"errors"
	"fmt"

	"github.com/resend/resend-go/v2"
)

const senderAddress = "support@support.openworth.io" // Replace with your verified Resend sender

type Client struct {
	resendClient *resend.Client
}

// NewClient creates a new email client instance.
func NewClient(apiKey string) (*Client, error) {
	if apiKey == "" {
		return nil, errors.New("Resend API key is required")
	}
	client := resend.NewClient(apiKey)
	return &Client{resendClient: client}, nil
}

// SendVerificationEmail sends the email verification code to the user.
func (c *Client) SendVerificationEmail(toEmail, verificationCode string) error {
	subject := "Verify Your Email for Team556 Wallet"
	body := fmt.Sprintf(`
        <p>Welcome to Team556 Wallet!</p>
        <p>Your email verification code is: <strong>%s</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
    `, verificationCode)

	params := &resend.SendEmailRequest{
		From:    senderAddress,
		To:      []string{toEmail},
		Subject: subject,
		Html:    body, // Using HTML body
	}

	sent, err := c.resendClient.Emails.Send(params)
	if err != nil {
		fmt.Printf("Error sending verification email to %s: %v\n", toEmail, err)
		return err
	}

	fmt.Printf("Verification email sent successfully to %s (ID: %s)\n", toEmail, sent.Id)
	return nil
}
