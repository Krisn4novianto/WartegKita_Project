package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET / CREATE POINT ACCOUNT
// =====================================================

func GetOrCreatePointAccount(
	db *gorm.DB,
	userID string,
) (*models.UserLoyaltyPoint, error) {

	if db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}

	if userID == "" {
		return nil, fmt.Errorf("user_id kosong")
	}

	var points models.UserLoyaltyPoint

	err := db.
		Where("user_id = ?", userID).
		First(&points).
		Error

	if err == nil {
		return &points, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	points = models.UserLoyaltyPoint{
		ID:             uuid.NewString(),
		UserID:         userID,
		Balance:        0,
		LifetimeEarned: 0,
		LifetimeSpent:  0,
	}

	if err := db.Create(&points).Error; err != nil {
		return nil, err
	}

	return &points, nil
}

// =====================================================
// EARN POINTS
// =====================================================

func EarnPoints(
	db *gorm.DB,
	userID string,
	amount int,
	source string,
	referenceID string,
	description string,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if userID == "" {
		return fmt.Errorf("user_id kosong")
	}

	if amount <= 0 {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {

		points, err := GetOrCreatePointAccount(
			tx,
			userID,
		)

		if err != nil {
			return err
		}

		// -------------------------------------------------
		// PREVENT DUPLICATE POINT
		// -------------------------------------------------

		if referenceID != "" {

			var existing models.PointTransaction

			err := tx.
				Where(
					"user_id = ? AND reference_id = ? AND type = ?",
					userID,
					referenceID,
					models.PointTransactionEarn,
				).
				First(&existing).
				Error

			if err == nil {
				return nil
			}

			if err != gorm.ErrRecordNotFound {
				return err
			}
		}

		// -------------------------------------------------
		// UPDATE BALANCE
		// -------------------------------------------------

		points.Balance += amount
		points.LifetimeEarned += amount

		if err := tx.Save(points).Error; err != nil {
			return err
		}

		// -------------------------------------------------
		// CREATE TRANSACTION
		// -------------------------------------------------

		transaction := models.PointTransaction{
			ID:          uuid.NewString(),
			UserID:      userID,
			Type:        models.PointTransactionEarn,
			Amount:      amount,
			Source:      source,
			ReferenceID: referenceID,
			Description: description,
		}

		return tx.Create(&transaction).Error
	})
}

// =====================================================
// PROCESS COMPLETED ORDER
// =====================================================
//
// Rp1.000 = 1 point
//
// Hanya order COMPLETED.
// Satu order hanya memberikan poin satu kali.
// =====================================================

func ProcessCompletedOrderLoyalty(
	db *gorm.DB,
	order *models.Order,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if order == nil {
		return fmt.Errorf("order tidak ditemukan")
	}

	if order.Status != models.OrderStatusCompleted {
		return nil
	}

	if order.UserID == "" {
		return fmt.Errorf("order tidak memiliki user_id")
	}

	orderReference := order.ID

	// =================================================
	// POINT
	// =================================================

	pointsToEarn := int(
		order.TotalAmount / 1000,
	)

	if pointsToEarn > 0 {

		if err := EarnPoints(
			db,
			order.UserID,
			pointsToEarn,
			"ORDER_COMPLETED",
			orderReference,
			fmt.Sprintf(
				"Poin dari order %s",
				order.OrderNumber,
			),
		); err != nil {
			return err
		}
	}

	// =================================================
	// MISSIONS
	// =================================================

	return UpdateOrderMissions(
		db,
		order.UserID,
		order,
	)
}

// =====================================================
// UPDATE ORDER MISSIONS
// =====================================================

func UpdateOrderMissions(
	db *gorm.DB,
	userID string,
	order *models.Order,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if userID == "" {
		return fmt.Errorf("user_id kosong")
	}

	if order == nil {
		return fmt.Errorf("order tidak ditemukan")
	}

	if order.Status != models.OrderStatusCompleted {
		return nil
	}

	// =================================================
	// CURRENT TIME
	// =================================================

	now := time.Now()

	// =================================================
	// GET ACTIVE MISSIONS
	// =================================================

	var missions []models.Mission

	err := db.
		Where("is_active = ?", true).
		Where(
			"(start_at IS NULL OR start_at <= ?)",
			now,
		).
		Where(
			"(end_at IS NULL OR end_at >= ?)",
			now,
		).
		Order("created_at ASC").
		Find(&missions).
		Error

	if err != nil {
		return fmt.Errorf(
			"gagal mengambil missions: %w",
			err,
		)
	}

	// =================================================
	// UPDATE EACH MISSION
	// =================================================

	for i := range missions {

		mission := &missions[i]

		switch mission.Type {

		case models.MissionOrderCount:

			if err := updateOrderCountMission(
				db,
				userID,
				mission,
			); err != nil {
				return err
			}

		case models.MissionSpendAmount:

			if err := updateSpendMission(
				db,
				userID,
				mission,
			); err != nil {
				return err
			}

		case models.MissionProfile:
			// -------------------------------------------------
			// PROFILE_COMPLETE belum diproses oleh order.
			// Jangan dianggap error.
			// -------------------------------------------------
			continue

		case models.MissionNewSeller:
			// -------------------------------------------------
			// NEW_SELLER bukan mission berbasis order.
			// Jangan dianggap error.
			// -------------------------------------------------
			continue

		default:
			// -------------------------------------------------
			// Mission type tidak dikenal.
			// Jangan membuat seluruh loyalty gagal.
			// -------------------------------------------------
			continue
		}
	}

	return nil
}

// =====================================================
// ORDER COUNT MISSION
// =====================================================

func updateOrderCountMission(
	db *gorm.DB,
	userID string,
	mission *models.Mission,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if mission == nil {
		return fmt.Errorf("mission tidak ditemukan")
	}

	var completedOrders int64

	err := db.
		Model(&models.Order{}).
		Where(
			"user_id = ? AND status = ?",
			userID,
			models.OrderStatusCompleted,
		).
		Count(&completedOrders).
		Error

	if err != nil {
		return fmt.Errorf(
			"gagal menghitung completed order: %w",
			err,
		)
	}

	return saveMissionProgress(
		db,
		userID,
		mission,
		int(completedOrders),
	)
}

// =====================================================
// SPEND AMOUNT MISSION
// =====================================================

func updateSpendMission(
	db *gorm.DB,
	userID string,
	mission *models.Mission,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if mission == nil {
		return fmt.Errorf("mission tidak ditemukan")
	}

	var total float64

	err := db.
		Model(&models.Order{}).
		Where(
			"user_id = ? AND status = ?",
			userID,
			models.OrderStatusCompleted,
		).
		Select(
			"COALESCE(SUM(total_amount), 0)",
		).
		Scan(&total).
		Error

	if err != nil {
		return fmt.Errorf(
			"gagal menghitung total belanja: %w",
			err,
		)
	}

	return saveMissionProgress(
		db,
		userID,
		mission,
		int(total),
	)
}

// =====================================================
// SAVE MISSION PROGRESS
// =====================================================

func saveMissionProgress(
	db *gorm.DB,
	userID string,
	mission *models.Mission,
	progress int,
) error {

	if db == nil {
		return fmt.Errorf("database tidak tersedia")
	}

	if userID == "" {
		return fmt.Errorf("user_id kosong")
	}

	if mission == nil {
		return fmt.Errorf("mission tidak ditemukan")
	}

	// =================================================
	// FIND USER MISSION
	// =================================================

	var userMission models.UserMission

	err := db.
		Where(
			"user_id = ? AND mission_id = ?",
			userID,
			mission.ID,
		).
		First(&userMission).
		Error

	// =================================================
	// CREATE IF NOT EXISTS
	// =================================================

	if err == gorm.ErrRecordNotFound {

		userMission = models.UserMission{
			ID:          uuid.NewString(),
			UserID:      userID,
			MissionID:   mission.ID,
			Progress:    0,
			Completed:   false,
			CompletedAt: nil,
			Mission:     mission,
		}

	} else if err != nil {

		return fmt.Errorf(
			"gagal mengambil user mission: %w",
			err,
		)
	}

	// =================================================
	// ALREADY COMPLETED
	// =================================================

	if userMission.Completed {
		return nil
	}

	// =================================================
	// NORMALIZE PROGRESS
	// =================================================

	if progress < 0 {
		progress = 0
	}

	if mission.Target > 0 &&
		progress > mission.Target {

		progress = mission.Target
	}

	userMission.Progress = progress

	// =================================================
	// CHECK COMPLETED
	// =================================================

	if mission.Target > 0 &&
		userMission.Progress >= mission.Target {

		userMission.Progress = mission.Target
		userMission.Completed = true

		now := time.Now()
		userMission.CompletedAt = &now
	}

	// =================================================
	// SAVE USER MISSION
	// =================================================

	if err := db.Save(&userMission).Error; err != nil {
		return fmt.Errorf(
			"gagal menyimpan progress mission: %w",
			err,
		)
	}

	// =================================================
	// REWARD POINT
	// =================================================

	if userMission.Completed &&
		mission.RewardPoints > 0 {

		referenceID := userMission.ID

		if err := EarnPoints(
			db,
			userID,
			mission.RewardPoints,
			"MISSION_COMPLETED",
			referenceID,
			fmt.Sprintf(
				"Reward misi: %s",
				mission.Title,
			),
		); err != nil {

			return fmt.Errorf(
				"gagal memberikan reward mission: %w",
				err,
			)
		}
	}

	return nil
}

// =====================================================
// GET USER MISSIONS
// =====================================================
//
// Endpoint:
// GET /api/v1/users/missions
//
// PENTING:
//
// Fungsi ini membaca tabel `missions` secara langsung.
//
// Jadi walaupun user belum mempunyai row di
// `user_missions`, mission tetap akan dikembalikan.
//
// Contoh:
//
// missions:
//     Pesanan Pertamamu
//     Makan 3 Kali
//
// user_missions:
//     BELUM ADA
//
// hasil:
//     tetap muncul dengan progress 0.
// =====================================================

func GetUserMissions(
	db *gorm.DB,
	userID string,
) ([]models.UserMission, error) {

	if db == nil {
		return nil, fmt.Errorf(
			"database tidak tersedia",
		)
	}

	if userID == "" {
		return nil, fmt.Errorf(
			"user_id kosong",
		)
	}

	// =================================================
	// CURRENT TIME
	// =================================================

	now := time.Now()

	// =================================================
	// GET ACTIVE MISSIONS
	// =================================================

	var missions []models.Mission

	err := db.
		Where(
			"is_active = ?",
			true,
		).
		Where(
			"(start_at IS NULL OR start_at <= ?)",
			now,
		).
		Where(
			"(end_at IS NULL OR end_at >= ?)",
			now,
		).
		Order(
			"created_at ASC",
		).
		Find(
			&missions,
		).
		Error

	if err != nil {
		return nil, fmt.Errorf(
			"gagal mengambil missions: %w",
			err,
		)
	}

	// =================================================
	// SYNC ORDER-BASED MISSIONS
	// =================================================
	//
	// Mission progress is normally updated when an order becomes
	// COMPLETED. We also synchronize here so missions already present
	// in the database immediately show the correct progress on Profile,
	// even when the order was completed before the loyalty hook existed.
	// =================================================

	var completedOrders []models.Order
	if err := db.
		Where("user_id = ? AND status = ?", userID, models.OrderStatusCompleted).
		Find(&completedOrders).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil completed orders untuk mission: %w", err)
	}

	for i := range completedOrders {
		if err := UpdateOrderMissions(db, userID, &completedOrders[i]); err != nil {
			return nil, fmt.Errorf("gagal sinkronisasi mission: %w", err)
		}
	}

	// =================================================
	// ALWAYS RETURN ARRAY
	// =================================================

	result := make(
		[]models.UserMission,
		0,
		len(missions),
	)

	// =================================================
	// LOOP ACTIVE MISSIONS
	// =================================================

	for i := range missions {

		mission := &missions[i]

		// =================================================
		// FIND USER MISSION
		// =================================================

		var userMission models.UserMission

		err := db.
			Where(
				"user_id = ? AND mission_id = ?",
				userID,
				mission.ID,
			).
			First(&userMission).
			Error

		// =================================================
		// USER BELUM PERNAH MENGERJAKAN MISSION
		// =================================================

		if err == gorm.ErrRecordNotFound {

			userMission = models.UserMission{
				ID:          uuid.NewString(),
				UserID:      userID,
				MissionID:   mission.ID,
				Progress:    0,
				Completed:   false,
				CompletedAt: nil,
				Mission:     mission,
			}

			result = append(
				result,
				userMission,
			)

			continue
		}

		// =================================================
		// DATABASE ERROR
		// =================================================

		if err != nil {

			return nil, fmt.Errorf(
				"gagal mengambil user mission %s: %w",
				mission.ID,
				err,
			)
		}

		// =================================================
		// ASSIGN MISSION
		// =================================================

		userMission.Mission = mission

		// =================================================
		// NORMALIZE PROGRESS
		// =================================================

		if userMission.Progress < 0 {
			userMission.Progress = 0
		}

		if mission.Target > 0 &&
			userMission.Progress > mission.Target {

			userMission.Progress = mission.Target
		}

		result = append(
			result,
			userMission,
		)
	}

	return result, nil
}

// =====================================================
// REDEEM POINTS
// =====================================================

func RedeemPoints(
	db *gorm.DB,
	userID string,
	reward *models.Reward,
) (*models.RewardRedemption, error) {

	if db == nil {
		return nil, fmt.Errorf(
			"database tidak tersedia",
		)
	}

	if userID == "" {
		return nil, fmt.Errorf(
			"user_id kosong",
		)
	}

	if reward == nil {
		return nil, fmt.Errorf(
			"reward tidak ditemukan",
		)
	}

	if !reward.IsActive {
		return nil, fmt.Errorf(
			"reward tidak aktif",
		)
	}

	returned := &models.RewardRedemption{}

	err := db.Transaction(
		func(tx *gorm.DB) error {

			// =================================================
			// GET POINT
			// =================================================

			points, err := GetOrCreatePointAccount(
				tx,
				userID,
			)

			if err != nil {
				return err
			}

			// =================================================
			// CHECK BALANCE
			// =================================================

			if points.Balance < reward.PointCost {
				return fmt.Errorf(
					"poin tidak mencukupi",
				)
			}

			// =================================================
			// CHECK STOCK
			// =================================================

			if reward.Stock == 0 {
				return fmt.Errorf(
					"reward sudah habis",
				)
			}

			// =================================================
			// DEDUCT POINT
			// =================================================

			points.Balance -= reward.PointCost
			points.LifetimeSpent += reward.PointCost

			if err := tx.Save(points).Error; err != nil {
				return err
			}

			// =================================================
			// CREATE VOUCHER
			// =================================================

			code := fmt.Sprintf(
				"WKT-%s",
				uuid.NewString()[:8],
			)

			expiry := time.Now().Add(
				30 * 24 * time.Hour,
			)

			redemption := models.RewardRedemption{
				ID:          uuid.NewString(),
				UserID:      userID,
				RewardID:    reward.ID,
				PointsSpent: reward.PointCost,
				VoucherCode: code,
				Status:      models.RewardRedemptionActive,
				ExpiresAt:   &expiry,
			}

			if err := tx.Create(&redemption).Error; err != nil {
				return err
			}

			// =================================================
			// UPDATE STOCK
			// =================================================

			if reward.Stock > 0 {

				reward.Stock--

				if err := tx.Save(reward).Error; err != nil {
					return err
				}
			}

			// =================================================
			// POINT TRANSACTION
			// =================================================

			transaction := models.PointTransaction{
				ID:          uuid.NewString(),
				UserID:      userID,
				Type:        models.PointTransactionRedeem,
				Amount:      -reward.PointCost,
				Source:      "REWARD_REDEMPTION",
				ReferenceID: redemption.ID,
				Description: "Menukarkan poin dengan " + reward.Name,
			}

			if err := tx.Create(&transaction).Error; err != nil {
				return err
			}

			redemption.Reward = reward

			*returned = redemption

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	return returned, nil
}
