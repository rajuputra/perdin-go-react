package security

import (
	"strings"
	"testing"
	"time"
)

func TestJWTConfigurationAndSessionLifetime(t *testing.T) {
	if _, err := NewJWT(""); err == nil {
		t.Fatal("empty JWT key was accepted")
	}

	signer, err := NewJWT(strings.Repeat("a", 32))
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	token, err := signer.Generate(42, "session-test", now)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := signer.Validate(token)
	if err != nil {
		t.Fatal(err)
	}
	if claims.UserID != 42 || claims.ID != "session-test" {
		t.Fatalf("unexpected session claims: %+v", claims)
	}

	expired, err := signer.Generate(42, "expired-session", now.Add(-SessionLifetime-time.Minute))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := signer.Validate(expired); err == nil {
		t.Fatal("expired session was accepted")
	}
}
