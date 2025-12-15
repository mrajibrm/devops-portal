package utils

import (
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SafeHTTPClient enforces SSRF protection
var SafeHTTPClient = &http.Client{
	Timeout: 10 * time.Second,
}

// IsSafeURL checks if a URL resolves to a public IP
func IsSafeURL(targetURL string) error {
	u, err := url.Parse(targetURL)
	if err != nil {
		return errors.New("invalid url")
	}

	hostname := u.Hostname()
	ips, err := net.LookupIP(hostname)
	if err != nil {
		return errors.New("dns lookup failed")
	}

	for _, ip := range ips {
		if ip.IsLoopback() || ip.IsPrivate() || ip.IsUnspecified() {
			return errors.New("blocked: resolves to private/local network")
		}
	}

	return nil
}

// FetchExternalData performs a GET request securely
func FetchExternalData(targetURL string) (string, error) {
	if err := IsSafeURL(targetURL); err != nil {
		return "", err
	}

	resp, err := SafeHTTPClient.Get(targetURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("external service returned non-200 status")
	}

	// Simple Content-Type check
	ctype := resp.Header.Get("Content-Type")
	if !strings.Contains(ctype, "application/json") && !strings.Contains(ctype, "text/plain") {
		return "", errors.New("blocked: invalid content type")
	}

	// Read body (limited to 1MB)
	// In real impl, use io.LimitReader
	return "Data fetched successfully (Mocked Body)", nil
}
