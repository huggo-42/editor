package command

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"

	"github.com/amacneil/dbmate/v2/pkg/dbmate"
	_ "github.com/amacneil/dbmate/v2/pkg/driver/sqlite"
	"github.com/spf13/cobra"

	"github.com/edit4i/editor/db/migrations"
	"github.com/edit4i/editor/internal/db"
)

var (
	force bool
)

// dbCmd represents the database management command
var dbCmd = &cobra.Command{
	Use:   "db",
	Short: "Manage the database",
	Long: `Manage the Edit4I database, including migrations and status.

Available Commands:
  migrate     Run pending migrations
  status      Show current migration status`,
}

// migrateCmd represents the migrate command
var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Run database migrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg := db.DefaultConfig()

		// Create database directory if it doesn't exist
		if err := os.MkdirAll(cfg.Directory, 0755); err != nil {
			return fmt.Errorf("error creating database directory: %v", err)
		}

		// Construct database URL
		dbPath := filepath.Join(cfg.Directory, cfg.Filename)
		dbURL := &url.URL{
			Scheme: "sqlite",
			Path:   dbPath,
		}

		// Initialize dbmate
		migrator := dbmate.New(dbURL)
		migrator.FS = migrations.FS
		migrator.MigrationsDir = []string{"."}
		migrator.AutoDumpSchema = false
		migrator.Verbose = true

		// Run migrations
		if err := migrator.CreateAndMigrate(); err != nil {
			return fmt.Errorf("error running migrations: %v", err)
		}

		fmt.Println("Migrations completed successfully")
		return nil
	},
}

// statusCmd represents the status command
var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show migration status",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg := db.DefaultConfig()
		dbPath := filepath.Join(cfg.Directory, cfg.Filename)
		dbURL := &url.URL{
			Scheme: "sqlite",
			Path:   dbPath,
		}

		migrator := dbmate.New(dbURL)
		migrator.FS = migrations.FS
		migrator.MigrationsDir = []string{"."}

		// Show migration status
		if _, err := migrator.Status(false); err != nil {
			return fmt.Errorf("error checking migration status: %v", err)
		}

		return nil
	},
}

func init() {
	dbCmd.AddCommand(migrateCmd)
	dbCmd.AddCommand(statusCmd)
	migrateCmd.Flags().BoolVarP(&force, "force", "f", false, "Force migration even if there are errors")
}
