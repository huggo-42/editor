package db

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"

	"github.com/amacneil/dbmate/v2/pkg/dbmate"
	_ "github.com/amacneil/dbmate/v2/pkg/driver/sqlite"
	"github.com/edit4i/editor/db/migrations"
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

	// Run migrations first using the same code as the migrate command
	dbURL := &url.URL{
		Scheme: "sqlite",
		Path:   dbPath,
	}

	// Initialize dbmate with the same configuration as the migrate command
	migrator := dbmate.New(dbURL)
	migrator.FS = migrations.FS
	migrator.MigrationsDir = []string{"."}
	migrator.AutoDumpSchema = false
	migrator.Verbose = true

	// Run migrations
	if err := migrator.CreateAndMigrate(); err != nil {
		return nil, fmt.Errorf("error running migrations: %v", err)
	}

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
