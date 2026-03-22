package email

import (
	"campusconnect/internal/config"
	"fmt"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
	client    *sendgrid.Client
	fromEmail string
	fromName  string
}

func NewEmailService(cfg *config.EmailConfig) *EmailService {
	client := sendgrid.NewSendClient(cfg.SendGridAPIKey)
	return &EmailService{
		client:    client,
		fromEmail: cfg.FromEmail,
		fromName:  cfg.FromName,
	}
}

func (e *EmailService) SendOTPEmail(toEmail, otp string) error {
	from := mail.NewEmail(e.fromName, e.fromEmail)
	to := mail.NewEmail("", toEmail)
	subject := "Your CampusConnect Verification Code"

	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
			.container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; }
			.logo { text-align: center; margin-bottom: 30px; }
			.otp-code { font-size: 32px; font-weight: bold; color: #f97316; text-align: center; letter-spacing: 8px; margin: 30px 0; }
			.message { color: #666; line-height: 1.6; }
			.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="logo">
				<h1 style="color: #f97316;">CampusConnect</h1>
			</div>
			<h2>Verify Your Email</h2>
			<p class="message">Hello,</p>
			<p class="message">Your verification code for CampusConnect is:</p>
			<div class="otp-code">%s</div>
			<p class="message">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
			<div class="footer">
				<p>This is an automated message from CampusConnect. Please do not reply to this email.</p>
			</div>
		</div>
	</body>
	</html>
	`, otp)

	message := mail.NewSingleEmail(from, subject, to, "", htmlContent)
	response, err := e.client.Send(message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	if response.StatusCode >= 400 {
		return fmt.Errorf("email API error: %s", response.Body)
	}

	return nil
}

func (e *EmailService) SendNotificationEmail(toEmail, title, content string) error {
	from := mail.NewEmail(e.fromName, e.fromEmail)
	to := mail.NewEmail("", toEmail)

	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
			.container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; }
			.title { color: #f97316; }
			.content { color: #666; line-height: 1.6; }
		</style>
	</head>
	<body>
		<div class="container">
			<h1 class="title">%s</h1>
			<p class="content">%s</p>
		</div>
	</body>
	</html>
	`, title, content)

	message := mail.NewSingleEmail(from, title, to, "", htmlContent)
	response, err := e.client.Send(message)
	if err != nil {
		return err
	}

	if response.StatusCode >= 400 {
		return fmt.Errorf("email API error: %s", response.Body)
	}

	return nil
}
