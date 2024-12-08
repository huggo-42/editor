package service

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	ignore "github.com/sabhiram/go-gitignore"
	"github.com/sahilm/fuzzy"
)

// FileNode represents a file or directory in the project
type FileNode struct {
	Name         string      `json:"name"`
	Path         string      `json:"path"`
	Type         string      `json:"type"` // "file" or "directory"
	Size         int64       `json:"size,omitempty"`
	LastModified time.Time   `json:"lastModified"`
	Children     []*FileNode `json:"children,omitempty"`
	IsLoaded     bool        `json:"isLoaded"` // Indicates if directory contents are loaded
}

// FileService handles file operations for projects
type FileService struct {
	// Cache file trees with expiration
	cache     map[string]*FileNode
	cacheLock sync.RWMutex
	// TODO: Add file watcher
	ignores map[string]*ignore.GitIgnore
}

// NewFileService creates a new file service instance
func NewFileService() *FileService {
	return &FileService{
		cache:   make(map[string]*FileNode),
		ignores: make(map[string]*ignore.GitIgnore),
	}
}

// GetProjectFiles returns the file tree for a project
func (s *FileService) GetProjectFiles(projectPath string) (*FileNode, error) {
	s.cacheLock.RLock()
	if node, ok := s.cache[projectPath]; ok {
		s.cacheLock.RUnlock()
		return node, nil
	}
	s.cacheLock.RUnlock()

	// Create root node
	root := &FileNode{
		Name: filepath.Base(projectPath),
		Path: projectPath,
		Type: "directory",
	}

	// Read directory contents
	entries, err := os.ReadDir(projectPath)
	if err != nil {
		return nil, err
	}

	// Process entries
	for _, entry := range entries {
		childPath := filepath.Join(projectPath, entry.Name())
		
		// Skip if ignored
		if s.isIgnored(projectPath, childPath) {
			continue
		}

		// Create child node
		child := &FileNode{
			Name: entry.Name(),
			Path: childPath,
		}

		if entry.IsDir() {
			child.Type = "directory"
			// Recursively process subdirectory
			childNode, err := s.GetProjectFiles(childPath)
			if err != nil {
				continue
			}
			child = childNode
		} else {
			child.Type = "file"
			info, err := entry.Info()
			if err == nil {
				child.Size = info.Size()
				child.LastModified = info.ModTime()
			}
		}

		root.Children = append(root.Children, child)
	}

	// Sort children
	s.sortFileTree(root)

	// Update cache
	s.cacheLock.Lock()
	s.cache[projectPath] = root
	s.cacheLock.Unlock()

	return root, nil
}

// buildTopLevelTree builds only the top level of the file tree
func (s *FileService) buildTopLevelTree(root string) (*FileNode, error) {
	info, err := os.Stat(root)
	if err != nil {
		return nil, err
	}

	node := &FileNode{
		Name:         filepath.Base(root),
		Path:         root,
		LastModified: info.ModTime(),
		IsLoaded:     false,
	}

	if info.IsDir() {
		node.Type = "directory"
		entries, err := os.ReadDir(root)
		if err != nil {
			return nil, err
		}

		node.Children = make([]*FileNode, 0, len(entries))
		for _, entry := range entries {
			// Skip hidden files and directories
			if entry.Name()[0] == '.' {
				continue
			}

			childPath := filepath.Join(root, entry.Name())
			childInfo, err := entry.Info()
			if err != nil {
				continue
			}

			childNode := &FileNode{
				Name:         entry.Name(),
				Path:         childPath,
				LastModified: childInfo.ModTime(),
				IsLoaded:     false,
			}

			if entry.IsDir() {
				childNode.Type = "directory"
				// Don't load children yet
				childNode.Children = []*FileNode{}
			} else {
				childNode.Type = "file"
				childNode.Size = childInfo.Size()
				childNode.IsLoaded = true // Files are always "loaded"
			}

			node.Children = append(node.Children, childNode)
		}
		node.IsLoaded = true // Mark top level as loaded
	} else {
		node.Type = "file"
		node.Size = info.Size()
		node.IsLoaded = true
	}

	return node, nil
}

// LoadDirectoryContents loads the contents of a specific directory
func (s *FileService) LoadDirectoryContents(dirPath string) (*FileNode, error) {
	s.cacheLock.Lock()
	defer s.cacheLock.Unlock()

	// Find the directory node in the cache
	var dirNode *FileNode
	for _, root := range s.cache {
		if node := s.findNode(root, dirPath); node != nil {
			dirNode = node
			break
		}
	}

	if dirNode == nil || dirNode.Type != "directory" {
		return nil, fmt.Errorf("directory not found: %s", dirPath)
	}

	// If already loaded, return as is
	if dirNode.IsLoaded {
		return dirNode, nil
	}

	// Load the directory contents
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	dirNode.Children = make([]*FileNode, 0, len(entries))
	for _, entry := range entries {
		if entry.Name()[0] == '.' {
			continue
		}

		childPath := filepath.Join(dirPath, entry.Name())
		childInfo, err := entry.Info()
		if err != nil {
			continue
		}

		childNode := &FileNode{
			Name:         entry.Name(),
			Path:         childPath,
			LastModified: childInfo.ModTime(),
			IsLoaded:     false,
		}

		if entry.IsDir() {
			childNode.Type = "directory"
			childNode.Children = []*FileNode{}
		} else {
			childNode.Type = "file"
			childNode.Size = childInfo.Size()
			childNode.IsLoaded = true
		}

		dirNode.Children = append(dirNode.Children, childNode)
	}

	dirNode.IsLoaded = true
	s.sortFileTree(dirNode)

	return dirNode, nil
}

// findNode recursively finds a node by path
func (s *FileService) findNode(root *FileNode, path string) *FileNode {
	if root.Path == path {
		return root
	}

	if root.Children != nil {
		for _, child := range root.Children {
			if found := s.findNode(child, path); found != nil {
				return found
			}
		}
	}

	return nil
}

// GetFileContent reads and returns the content of a file
func (s *FileService) GetFileContent(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// SaveFile saves content to a file
func (s *FileService) SaveFile(path string, content string) error {
	err := os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return err
	}

	// Invalidate cache for the project containing this file
	s.cacheLock.Lock()
	projectPath := filepath.Dir(path)
	delete(s.cache, projectPath)
	s.cacheLock.Unlock()

	return nil
}

// InvalidateCache removes a project's file tree from cache
func (s *FileService) InvalidateCache(projectPath string) {
	s.cacheLock.Lock()
	delete(s.cache, projectPath)
	s.cacheLock.Unlock()
}

// loadGitIgnore loads the gitignore file for a directory if it exists
func (s *FileService) loadGitIgnore(dirPath string) *ignore.GitIgnore {
	if ig, ok := s.ignores[dirPath]; ok {
		return ig
	}

	gitignorePath := filepath.Join(dirPath, ".gitignore")
	if ig, err := ignore.CompileIgnoreFile(gitignorePath); err == nil {
		s.ignores[dirPath] = ig
		return ig
	}
	return nil
}

// isIgnored checks if a path should be ignored based on gitignore rules
func (s *FileService) isIgnored(rootPath, path string) bool {
	// Always ignore .git directory
	if strings.Contains(path, "/.git/") || strings.HasSuffix(path, "/.git") {
		return true
	}

	// Check each parent directory for .gitignore rules
	dir := filepath.Dir(path)
	for dir != "/" && strings.HasPrefix(path, rootPath) {
		if ig := s.loadGitIgnore(dir); ig != nil {
			relPath, err := filepath.Rel(dir, path)
			if err == nil && ig.MatchesPath(relPath) {
				return true
			}
		}
		dir = filepath.Dir(dir)
	}
	return false
}

// SearchFiles performs a fuzzy search on files in a directory
func (s *FileService) SearchFiles(ctx context.Context, dirPath, query string) ([]*FileNode, error) {
	var allFiles []*FileNode
	var searchPaths []string

	// Get the file tree
	root, err := s.GetProjectFiles(dirPath)
	if err != nil {
		return nil, err
	}

	// Debug: Print root structure
	fmt.Printf("Root node: %s, Type: %s, Children: %d\n", root.Name, root.Type, len(root.Children))

	// Collect all files recursively
	var collectFiles func(*FileNode, string)
	collectFiles = func(node *FileNode, currentPath string) {
		if node == nil {
			return
		}

		// Check for cancellation
		select {
		case <-ctx.Done():
			return
		default:
		}

		// Build the current path
		nodePath := filepath.Join(currentPath, node.Name)
		
		// Debug: Print current node
		fmt.Printf("Processing node: %s, Type: %s, Path: %s\n", node.Name, node.Type, nodePath)

		// Process current node if it's a file
		if node.Type == "file" && !s.isIgnored(dirPath, node.Path) {
			// Create relative path by removing project base path
			relPath := strings.TrimPrefix(node.Path, dirPath)
			relPath = strings.TrimPrefix(relPath, "/")
			fmt.Printf("Adding file: %s, RelPath: %s\n", node.Name, relPath)
			searchPaths = append(searchPaths, relPath)
			allFiles = append(allFiles, node)
		}

		// Process all children regardless of type
		if node.Children != nil {
			for _, child := range node.Children {
				collectFiles(child, nodePath)
			}
		}
	}

	// Start traversal from root only
	collectFiles(root, "")

	if ctx.Err() != nil {
		return nil, ctx.Err()
	}

	fmt.Printf("Total files collected: %d\n", len(allFiles))
	fmt.Printf("Search paths: %v\n", searchPaths)

	// If no query, return first 10 files
	if query == "" || len(allFiles) == 0 {
		maxResults := 10
		if len(allFiles) < maxResults {
			maxResults = len(allFiles)
		}
		return allFiles[:maxResults], nil
	}

	// Use fuzzy library to search
	matches := fuzzy.Find(query, searchPaths)
	fmt.Printf("Fuzzy matches found: %d\n", len(matches))

	// Sort matches by score (already done by fuzzy.Find)
	results := make([]*FileNode, 0, len(matches))
	seen := make(map[string]bool)

	for _, match := range matches {
		if len(results) >= 10 {
			break
		}

		// Skip if we've already added this file
		if seen[allFiles[match.Index].Path] {
			continue
		}

		fmt.Printf("Match: %s (Score: %d)\n", searchPaths[match.Index], match.Score)
		results = append(results, allFiles[match.Index])
		seen[allFiles[match.Index].Path] = true
	}

	return results, nil
}

// sortFileTree sorts the file tree with folders first and by alphabetical order
func (s *FileService) sortFileTree(node *FileNode) {
	if node == nil || len(node.Children) == 0 {
		return
	}

	// Sort children recursively first
	for _, child := range node.Children {
		s.sortFileTree(child)
	}

	// Sort current level
	sort.Slice(node.Children, func(i, j int) bool {
		// If types are different, directories come first
		if node.Children[i].Type != node.Children[j].Type {
			return node.Children[i].Type == "directory"
		}
		// If types are the same, sort by name
		return node.Children[i].Name < node.Children[j].Name
	})
}
