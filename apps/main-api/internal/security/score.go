package security

import (
	"math"
	"time"

	"github.com/team556-mono/server/internal/models"
)

// ScoreResult contains the score and a normalized status used by the UI.
type ScoreResult struct {
	Score  int    // 0..100
	Status string // good | fair | at_risk
}

// ComputeAccountProtectionScore combines factors into a 0..100 score.
// - MFA enabled: +60
// - Password strength: score(0..4) -> +0..30 (score*10 - 10; but clamp to 0..30)
// - Password age (<= 90 days): +10
// - Recent suspicious activity (failed logins): -penalty up to 20
func ComputeAccountProtectionScore(user models.User, pwStrength int, lastChanged *time.Time, recentFailedLogins int) ScoreResult {
	score := 0
	if user.MFAEnabled {
		score += 60
	}
	// Password strength contribution
	pw := int(math.Max(0, math.Min(3, float64(pwStrength)))) // clamp 0..3 for 0..30 steps
	score += pw * 10
	// Age
	if lastChanged != nil && time.Since(*lastChanged) <= 90*24*time.Hour {
		score += 10
	}
	// Suspicious activity penalty (linear up to 20)
	penalty := recentFailedLogins * 5
	if penalty > 20 {
		penalty = 20
	}
	score -= penalty
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	status := "fair"
	if score >= 70 {
		status = "good"
	} else if score < 40 {
		status = "at_risk"
	}
	return ScoreResult{Score: score, Status: status}
}
