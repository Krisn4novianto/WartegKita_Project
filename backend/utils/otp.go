package utils

import (
	"fmt"
	"math/rand"
	"time"
)

func GenerateOTP() string {

	r := rand.New(
		rand.NewSource(
			time.Now().UnixNano(),
		),
	)

	code := r.Intn(900000) + 100000

	return fmt.Sprintf("%06d", code)
}
