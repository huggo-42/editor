package main

import (
	"log"
	"os"

	"github.com/edit4i/editor/internal/command"
)

func main() {
	if err := command.Execute(); err != nil {
		log.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}
