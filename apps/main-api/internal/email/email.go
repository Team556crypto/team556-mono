package email

import (
	"errors"
	"fmt"
	"strings"

	"github.com/resend/resend-go/v2"
)

const senderAddress = "support@team556.com" // Replace with your verified Resend sender

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
	htmlTemplate := `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .header img {
        width: 100%;
        display: block;
      }
      .content {
				padding: 10px 30px;
        text-align: center;
      }
      .content h1 {
        font-size: 24px;
        margin-bottom: 10px;
        color: #222;
      }
      .content p {
        font-size: 16px;
        color: #555;
        margin-bottom: 20px;
      }
      .code-box {
        display: inline-block;
        background-color: #f0f0f0;
        padding: 14px 28px;
        font-size: 22px;
        font-weight: bold;
        letter-spacing: 2px;
        border-radius: 6px;
        color: #333;
        margin-bottom: 30px;
      }
      .footer {
        font-size: 13px;
        color: #999;
        padding: 20px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://mj79u8lfav.ufs.sh/f/8MBjWI2gDtAyzVewADhovVu30Ry4FeXrHTwtcbZQsgEkzSJm" alt="Team556 Banner" />
      </div>
      <div class="content">
        <h1>Verify Your Email</h1>
        <p>Welcome to Team556. To finish setting up your wallet, please enter the code below:</p>
        <div class="code-box">{{VERIFICATION_CODE}}</div>
        <p>This code will expire in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
      <div class="footer">
        Powered by OpenWorth Technologies, LLC<br />
        Do not reply to this email. For help, contact support@team556.com
      </div>
    </div>
  </body>
</html>
`

	body := strings.Replace(htmlTemplate, "{{VERIFICATION_CODE}}", verificationCode, 1)

	params := &resend.SendEmailRequest{
		From:    senderAddress,
		To:      []string{toEmail},
		Subject: subject,
		Html:    body,
	}

	_, err := c.resendClient.Emails.Send(params)
	return err
}

// SendPasswordResetEmail sends the password reset code to the user.
func (c *Client) SendPasswordResetEmail(toEmail, resetCode string) error {
	subject := "Your Password Reset Code for Team556 Wallet"
	body := fmt.Sprintf(`
        <p>Hello,</p>
        <p>You requested to reset your password for Team556 Wallet.</p>
        <p>Your password reset code is: <strong>%s</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    `, resetCode)

	params := &resend.SendEmailRequest{
		From:    senderAddress,
		To:      []string{toEmail},
		Subject: subject,
		Html:    body,
	}

	sent, err := c.resendClient.Emails.Send(params)
	if err != nil {
		fmt.Printf("Error sending password reset email to %s: %v\n", toEmail, err)
		return err
	}

	fmt.Printf("Password reset email sent successfully to %s (ID: %s)\n", toEmail, sent.Id)
	return nil
}
