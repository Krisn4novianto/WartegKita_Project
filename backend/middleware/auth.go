package middleware

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// =====================================================
// JWT SECRET
// =====================================================

func getJWTSecret() []byte {

	secret := strings.TrimSpace(
		os.Getenv("JWT_SECRET"),
	)

	if secret == "" {
		secret = "warteg-kita-secret-key-2026"
	}

	return []byte(secret)
}

// =====================================================
// GENERATE TOKEN
// =====================================================

// GenerateToken creates a signed JWT token containing the user_id.
func GenerateToken(userID string) (string, error) {

	userID = strings.TrimSpace(userID)

	if userID == "" {
		return "", errors.New("user_id kosong")
	}

	now := time.Now()

	claims := jwt.MapClaims{

		"user_id": userID,

		"iat": now.Unix(),

		"exp": now.
			Add(7 * 24 * time.Hour).
			Unix(),
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString(
		getJWTSecret(),
	)
}

// =====================================================
// PARSE TOKEN
// =====================================================

func ValidateToken(
	tokenString string,
) (jwt.MapClaims, error) {

	tokenString = strings.TrimSpace(
		tokenString,
	)

	if tokenString == "" {
		return nil, errors.New(
			"token kosong",
		)
	}

	token, err := jwt.Parse(
		tokenString,

		func(token *jwt.Token) (interface{}, error) {

			// =============================================
			// ONLY HS256
			// =============================================

			if token.Method != jwt.SigningMethodHS256 {

				return nil, errors.New(
					"metode signing JWT tidak valid",
				)
			}

			return getJWTSecret(), nil
		},

		jwt.WithValidMethods(
			[]string{
				jwt.SigningMethodHS256.Alg(),
			},
		),
	)

	if err != nil {

		return nil, err
	}

	if !token.Valid {

		return nil, errors.New(
			"token tidak valid",
		)
	}

	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok {

		return nil, errors.New(
			"claims JWT tidak valid",
		)
	}

	return claims, nil
}

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

func AuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		// =================================================
		// GET AUTHORIZATION HEADER
		// =================================================

		authHeader := strings.TrimSpace(
			c.GetHeader("Authorization"),
		)

		if authHeader == "" {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Header otorisasi diperlukan",
				},
			)

			c.Abort()

			return
		}

		// =================================================
		// PARSE BEARER TOKEN
		// =================================================

		parts := strings.Fields(
			authHeader,
		)

		if len(parts) != 2 ||
			!strings.EqualFold(
				parts[0],
				"Bearer",
			) {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Format Authorization harus Bearer <token>",
				},
			)

			c.Abort()

			return
		}

		tokenString := strings.TrimSpace(
			parts[1],
		)

		if tokenString == "" {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Token kosong",
				},
			)

			c.Abort()

			return
		}

		// =================================================
		// VALIDATE TOKEN
		// =================================================

		claims, err := ValidateToken(
			tokenString,
		)

		if err != nil {

			// Debug backend
			// Tidak mengembalikan detail token ke frontend.

			println(
				"❌ JWT VALIDATION ERROR:",
				err.Error(),
			)

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Token otorisasi tidak valid atau kadaluarsa",
				},
			)

			c.Abort()

			return
		}

		// =================================================
		// GET USER ID
		// =================================================

		userIDValue, exists :=
			claims["user_id"]

		if !exists {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Data user tidak ditemukan dalam token",
				},
			)

			c.Abort()

			return
		}

		userID, ok :=
			userIDValue.(string)

		if !ok {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Format user_id dalam token tidak valid",
				},
			)

			c.Abort()

			return
		}

		userID = strings.TrimSpace(
			userID,
		)

		if userID == "" {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "user_id dalam token kosong",
				},
			)

			c.Abort()

			return
		}

		// =================================================
		// SET USER ID
		// =================================================

		c.Set(
			"user_id",
			userID,
		)

		// =================================================
		// CONTINUE
		// =================================================

		c.Next()
	}
}

// =====================================================
// OPTIONAL AUTH MIDDLEWARE
// =====================================================

func OptionalAuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		authHeader := strings.TrimSpace(
			c.GetHeader("Authorization"),
		)

		if authHeader == "" {

			c.Next()

			return
		}

		parts := strings.Fields(
			authHeader,
		)

		if len(parts) != 2 ||
			!strings.EqualFold(
				parts[0],
				"Bearer",
			) {

			c.Next()

			return
		}

		tokenString := strings.TrimSpace(
			parts[1],
		)

		claims, err := ValidateToken(
			tokenString,
		)

		if err == nil {

			if userID, ok :=
				claims["user_id"].(string); ok {

				userID = strings.TrimSpace(
					userID,
				)

				if userID != "" {

					c.Set(
						"user_id",
						userID,
					)
				}
			}
		}

		c.Next()
	}
}
