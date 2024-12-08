package service

import (
	"context"
	"database/sql"

	"github.com/edit4i/editor/internal/db"
)

// ProjectsService handles project-related operations
type ProjectsService struct {
	queries *db.Queries
}

// NewProjectsService creates a new projects service
func NewProjectsService(dbConn *sql.DB) *ProjectsService {
	return &ProjectsService{
		queries: db.New(dbConn),
	}
}

// GetRecentProjects returns a list of recently opened projects
func (s *ProjectsService) GetRecentProjects(limit int64) ([]db.Project, error) {
	return s.queries.ListRecentProjects(context.Background(), limit)
}

// AddProject adds a new project or updates its last opened time if it exists
func (s *ProjectsService) AddProject(name, path string) (*db.Project, error) {
	ctx := context.Background()

	// Try to create new project
	proj, err := s.queries.CreateProject(ctx, db.CreateProjectParams{
		Name: name,
		Path: path,
	})
	if err != nil {
		// If project exists, update last opened time
		existing, err := s.queries.GetProject(ctx, path)
		if err != nil {
			return nil, err
		}

		err = s.queries.UpdateProjectLastOpened(ctx, existing.ID)
		if err != nil {
			return nil, err
		}

		return &existing, nil
	}

	return &proj, nil
}
