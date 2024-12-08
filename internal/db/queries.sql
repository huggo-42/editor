-- name: GetProject :one
SELECT * FROM projects
WHERE path = ? LIMIT 1;

-- name: CreateProject :one
INSERT INTO projects (name, path)
VALUES (?, ?)
RETURNING *;

-- name: UpdateProjectLastOpened :exec
UPDATE projects
SET last_opened = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: ListRecentProjects :many
SELECT * FROM projects
ORDER BY last_opened DESC
LIMIT ?;