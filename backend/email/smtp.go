package email

import (
	"os"

	"gopkg.in/gomail.v2"
)

func SendOTP(to, otp string) error {

	sender := os.Getenv("GMAIL_EMAIL")
	password := os.Getenv("GMAIL_APP_PASSWORD")

	m := gomail.NewMessage()

	m.SetHeader("From", sender)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Reset Password WartegKita")

	m.SetBody(
		"text/plain",
		"Kode OTP Anda: "+otp+"\n\nOTP berlaku selama 10 menit.",
	)

	d := gomail.NewDialer(
		"smtp.gmail.com",
		587,
		sender,
		password,
	)

	return d.DialAndSend(m)
}
