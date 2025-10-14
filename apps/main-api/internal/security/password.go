package security

import (
	"regexp"
	"time"
)

// PasswordStrength represents a coarse-grained score with guidance.
type PasswordStrength struct {
	Score int      // 0–4
	Hints []string // human-readable suggestions
}

// EvaluatePasswordStrength returns a 0–4 score and suggestions based on simple rules.
// Avoids external deps to keep the API predictable.
func EvaluatePasswordStrength(pw string) PasswordStrength {
	length := len(pw)
	var hints []string
	score := 0

	if length >= 12 {
		score += 2
	} else if length >= 10 {
		score += 1
	} else {
		hints = append(hints, "Use at least 12 characters")
	}

	upper := regexp.MustCompile(`[A-Z]`).MatchString(pw)
	lower := regexp.MustCompile(`[a-z]`).MatchString(pw)
	digit := regexp.MustCompile(`[0-9]`).MatchString(pw)
	special := regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(pw)

	cats := 0
	if upper { cats++ } else { hints = appendIfMissing(hints, "Add an uppercase letter") }
	if lower { cats++ } else { hints = appendIfMissing(hints, "Add a lowercase letter") }
	if digit { cats++ } else { hints = appendIfMissing(hints, "Add a number") }
	if special { cats++ } else { hints = appendIfMissing(hints, "Add a special character") }

	score += cats - 1 // 0..3
	if score < 0 { score = 0 }
	if score > 4 { score = 4 }
	return PasswordStrength{Score: score, Hints: hints}
}

func appendIfMissing(xs []string, s string) []string {
	for _, v := range xs {
		if v == s { return xs }
	}
	return append(xs, s)
}

// AgeScore returns 10 if password changed within window days, else 0.
func AgeScore(lastChanged *time.Time, windowDays int) int {
	if lastChanged == nil { return 0 }
	if time.Since(*lastChanged) <= time.Duration(windowDays)*24*time.Hour {
		return 10
	}
	return 0
}
