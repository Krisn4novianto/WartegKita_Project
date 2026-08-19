package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
	"github.com/krisn4novianto/wartegkita/backend/services"
)

// =====================================================
// DB HELPER
// =====================================================

func getLoyaltyDB(c *gin.Context) *gorm.DB {
	// Prefer DB injected into the request context when available.
	if value, exists := c.Get("db"); exists {
		if db, ok := value.(*gorm.DB); ok && db != nil {
			return db
		}
	}

	// The auth middleware only stores user_id. The application database
	// itself is initialized in database.Connect(), so use the shared DB
	// as the reliable fallback for loyalty endpoints.
	return database.DB
}

// =====================================================
// USER ID
// =====================================================

func getCustomerUserID(c *gin.Context) string {

	// -------------------------------------------------
	// PRIORITY 1
	// AUTH MIDDLEWARE
	// -------------------------------------------------

	if value, exists := c.Get("user_id"); exists {

		if id, ok := value.(string); ok && id != "" {
			return id
		}
	}

	// -------------------------------------------------
	// PRIORITY 2
	// QUERY PARAM
	// -------------------------------------------------

	if userID := c.Query("user_id"); userID != "" {
		return userID
	}

	// -------------------------------------------------
	// PRIORITY 3
	// HEADER
	// -------------------------------------------------

	if userID := c.GetHeader("X-User-ID"); userID != "" {
		return userID
	}

	return ""
}

// =====================================================
// GET POINTS
// =====================================================

func GetCustomerPoints(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	userID := getCustomerUserID(c)

	if userID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "user_id diperlukan",
			},
		)

		return
	}

	points, err := services.GetOrCreatePointAccount(
		db,
		userID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil poin",
				"error":   err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": points,
		},
	)
}

// =====================================================
// POINT HISTORY
// =====================================================

func GetPointHistory(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	userID := getCustomerUserID(c)

	if userID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "user_id diperlukan",
			},
		)

		return
	}

	var transactions []models.PointTransaction

	err := db.
		Where(
			"user_id = ?",
			userID,
		).
		Order(
			"created_at DESC",
		).
		Find(
			&transactions,
		).
		Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil riwayat poin",
				"error":   err.Error(),
			},
		)

		return
	}

	if transactions == nil {
		transactions = make(
			[]models.PointTransaction,
			0,
		)
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": transactions,
		},
	)
}

// =====================================================
// GET REWARDS
// =====================================================

func GetRewards(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	var rewards []models.Reward

	err := db.
		Where(
			"is_active = ?",
			true,
		).
		Order(
			"point_cost ASC",
		).
		Find(
			&rewards,
		).
		Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil reward",
				"error":   err.Error(),
			},
		)

		return
	}

	if rewards == nil {
		rewards = make(
			[]models.Reward,
			0,
		)
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": rewards,
		},
	)
}

// =====================================================
// REDEEM REWARD
// =====================================================

func RedeemReward(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	userID := getCustomerUserID(c)

	if userID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "user_id diperlukan",
			},
		)

		return
	}

	rewardID := c.Param("reward_id")

	if rewardID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "reward_id diperlukan",
			},
		)

		return
	}

	var reward models.Reward

	err := db.
		Where(
			"id = ?",
			rewardID,
		).
		First(
			&reward,
		).
		Error

	if err != nil {

		if err == gorm.ErrRecordNotFound {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"message": "Reward tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil reward",
				"error":   err.Error(),
			},
		)

		return
	}

	redemption, err := services.RedeemPoints(
		db,
		userID,
		&reward,
	)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "Reward berhasil ditukarkan",
			"data":    redemption,
		},
	)
}

// =====================================================
// USER REWARDS
// =====================================================

func GetUserRewards(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	userID := getCustomerUserID(c)

	if userID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "user_id diperlukan",
			},
		)

		return
	}

	var rewards []models.RewardRedemption

	err := db.
		Preload(
			"Reward",
		).
		Where(
			"user_id = ?",
			userID,
		).
		Order(
			"created_at DESC",
		).
		Find(
			&rewards,
		).
		Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil voucher",
				"error":   err.Error(),
			},
		)

		return
	}

	if rewards == nil {
		rewards = make(
			[]models.RewardRedemption,
			0,
		)
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": rewards,
		},
	)
}

// =====================================================
// USER MISSIONS
// =====================================================
//
// GET:
//
// /api/v1/users/missions
//
// =====================================================

func GetUserMissions(c *gin.Context) {

	db := getLoyaltyDB(c)

	if db == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Database tidak tersedia",
			},
		)

		return
	}

	userID := getCustomerUserID(c)

	if userID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "user_id diperlukan",
			},
		)

		return
	}

	missions, err := services.GetUserMissions(
		db,
		userID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": "Gagal mengambil misi",
				"error":   err.Error(),
			},
		)

		return
	}

	if missions == nil {

		missions = make(
			[]models.UserMission,
			0,
		)
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": missions,
		},
	)
}
