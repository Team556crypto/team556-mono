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

// Basic helper to send a simple HTML email.
func (c *Client) sendSimple(toEmail, subject, html string) error {
	params := &resend.SendEmailRequest{From: senderAddress, To: []string{toEmail}, Subject: subject, Html: html}
	_, err := c.resendClient.Emails.Send(params)
	return err
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
        max-width: 400px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .header img {
        width: 100%;
        display: block;
				margin-top: -50px;
				margin-bottom: -50px;
      }
      .content {
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
        <img src="https://mj79u8lfav.ufs.sh/f/8MBjWI2gDtAygGoCewu1Xnd154OlVWfFohxpCLmE0vzDGkNT" alt="Team556 Banner" />
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

// SendPasswordChangedEmail notifies a user when their password has changed.
func (c *Client) SendPasswordChangedEmail(toEmail string) error {
	subject := "Your Team556 password was changed"
	html := `<p>Hello,</p><p>This is a confirmation that your Team556 account password was changed. If you did not perform this action, please reset your password immediately and contact support.</p>`
	return c.sendSimple(toEmail, subject, html)
}

// SendMFAEnabledEmail notifies a user when MFA is enabled.
func (c *Client) SendMFAEnabledEmail(toEmail string) error {
	subject := "Two-Factor Authentication enabled"
	html := `<p>Hello,</p><p>Two-Factor Authentication (TOTP) was enabled on your Team556 account. If this wasn’t you, please disable it and reset your password.</p>`
	return c.sendSimple(toEmail, subject, html)
}

// SendMFADisabledEmail notifies a user when MFA is disabled.
func (c *Client) SendMFADisabledEmail(toEmail string) error {
	subject := "Two-Factor Authentication disabled"
	html := `<p>Hello,</p><p>Two-Factor Authentication (TOTP) was disabled on your Team556 account. If this wasn’t you, please re-enable it and reset your password.</p>`
	return c.sendSimple(toEmail, subject, html)
}

// SendNewLoginEmail notifies a user of a new login from a new device or location.
func (c *Client) SendNewLoginEmail(toEmail, ip, ua, location string) error {
	subject := "New login to your Team556 account"
	html := `<p>Hello,</p><p>Your account was just accessed.</p>` +
		fmt.Sprintf(`<ul><li>IP: %s</li><li>Device: %s</li><li>Location: %s</li></ul>`, ip, ua, location) +
		`<p>If this was not you, please change your password and enable 2FA.</p>`
	return c.sendSimple(toEmail, subject, html)
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
