package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

const (
	defaultDBName = "metadata.db"
)

// Config holds database configuration
type Config struct {
	Directory string
	Filename  string
}

// DefaultConfig returns the default configuration for Edit4I database
func DefaultConfig() *Config {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}

	return &Config{
		Directory: filepath.Join(homeDir, ".edit4i"),
		Filename:  defaultDBName,
	}
}

// InitDB initializes the database connection using the provided configuration
func InitDB(cfg *Config) (*sql.DB, error) {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(cfg.Directory, 0755); err != nil {
		return nil, fmt.Errorf("error creating database directory: %v", err)
	}

	// Full database path
	dbPath := filepath.Join(cfg.Directory, cfg.Filename)

	// Open database connection
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("error connecting to database: %v", err)
	}

	return db, nil
}
