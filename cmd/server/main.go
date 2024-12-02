package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "editai",
	Short: "EditAI - An AI-first powered agentic editor",
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: Initialize and start the server
		log.Println("Starting EditAI server...")
	},
}

func init() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
