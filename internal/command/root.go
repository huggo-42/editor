package command

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "edit4i",
	Short: "Edit4I - An AI-powered editor",
	Long:  `Edit4I is an AI-powered editor that enhances your coding experience.`,
}

// Execute runs the root command
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.AddCommand(dbCmd)
}
