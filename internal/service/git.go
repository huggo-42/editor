package service

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/utils/diff"
	"github.com/sergi/go-diff/diffmatchpatch"
)

// FileStatus represents the status of a file in the Git repository
type FileStatus struct {
	File   string `json:"file"`   // File path relative to repository root
	Status string `json:"status"` // Status code: "M" for modified, "A" for added, "D" for deleted and "?" for untracked
	Staged bool   `json:"staged"` // Whether the file is staged
}

// BranchInfo represents information about a Git branch
type BranchInfo struct {
	Name     string `json:"name"`
	IsRemote bool   `json:"isRemote"`
	IsHead   bool   `json:"isHead"`
}

// CommitInfo represents information about a Git commit
type CommitInfo struct {
	Hash         string    `json:"hash"`
	Message      string    `json:"message"`
	Author       string    `json:"author"`
	AuthorEmail  string    `json:"authorEmail"`
	Date         time.Time `json:"date"`
	ParentHashes []string  `json:"parentHashes"`
	HasMore      bool      `json:"hasMore"` // Indicates if there are more commits after this one
}

// CommitFilter contains options for filtering commits
type CommitFilter struct {
	Branch      string    `json:"branch"`      // Branch to list commits from
	StartHash   string    `json:"startHash"`   // Start listing from this commit
	Limit       int       `json:"limit"`       // Max number of commits to return
	Offset      int       `json:"offset"`      // Skip this many commits (numeric offset)
	OffsetHash  string    `json:"offsetHash"`  // Start listing after this commit hash (more efficient for pagination)
	Author      string    `json:"author"`      // Filter by author
	SearchQuery string    `json:"searchQuery"` // Search in commit messages
	StartDate   time.Time `json:"startDate"`   // Filter commits after this date
	EndDate     time.Time `json:"endDate"`     // Filter commits before this date
}

// FileDiff represents the diff information for a file
type FileDiff struct {
	Path     string    `json:"path"`     // File path
	Content  string    `json:"content"`  // Diff content in unified format
	Stats    DiffStats `json:"stats"`    // Statistics about the changes
	IsBinary bool      `json:"isBinary"` // Whether the file is binary
}

// DiffStats contains statistics about changes in a diff
type DiffStats struct {
	Added    int `json:"added"`    // Number of added lines
	Deleted  int `json:"deleted"`  // Number of deleted lines
	Modified int `json:"modified"` // Number of modified lines
}

// GitService handles Git operations for projects
type GitService struct {
	fileService *FileService
}

// NewGitService creates a new Git service instance
func NewGitService(fileService *FileService) *GitService {
	return &GitService{
		fileService: fileService,
	}
}

// IsGitRepository checks if the given directory is a Git repository
// Returns true if it is a Git repository, false if not
// Returns error if there was a problem checking (e.g., directory doesn't exist)
func (s *GitService) IsGitRepository(projectPath string) (bool, error) {
	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return false, err
	}

	// Try to open the repository
	_, err = git.PlainOpen(absPath)
	if err != nil {
		if errors.Is(err, git.ErrRepositoryNotExists) {
			// Not a Git repository, but not an error
			return false, nil
		}
		// Some other error occurred
		return false, err
	}

	return true, nil
}

// InitRepository initializes a new Git repository in the given directory
func (s *GitService) InitRepository(projectPath string) error {
	// First check if it's already a Git repository
	isRepo, err := s.IsGitRepository(projectPath)
	if err != nil {
		return fmt.Errorf("failed to check if directory is a Git repository: %w", err)
	}
	if isRepo {
		return errors.New("directory is already a Git repository")
	}

	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Initialize the repository
	_, err = git.PlainInit(absPath, false) // false means not bare repository
	if err != nil {
		return fmt.Errorf("failed to initialize Git repository: %w", err)
	}

	return nil
}

// GetStatus returns the current Git status of the repository
// Returns two slices: staged files and unstaged files
func (s *GitService) GetStatus(projectPath string) ([]FileStatus, error) {
	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Open the repository
	repo, err := git.PlainOpen(absPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	// Get the working tree
	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	// Get the status
	status, err := worktree.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	// Convert status to our format
	var files []FileStatus
	for file, fileStatus := range status {
		// Skip unmodified files
		if fileStatus.Staging == git.Unmodified && fileStatus.Worktree == git.Unmodified {
			continue
		}

		// Check if file is ignored using FileService
		fullPath := filepath.Join(absPath, file)
		if s.fileService.isIgnored(absPath, fullPath) {
			continue
		}

		// For untracked files
		if fileStatus.Worktree == git.Untracked {
			files = append(files, FileStatus{
				File:   file,
				Staged: false,
				Status: string(git.Untracked),
			})
			continue
		}

		// Handle staged changes
		if fileStatus.Staging != git.Unmodified {
			files = append(files, FileStatus{
				File:   file,
				Staged: true,
				Status: string(fileStatus.Staging),
			})
		}

		// Handle unstaged changes
		if fileStatus.Worktree != git.Unmodified {
			files = append(files, FileStatus{
				File:   file,
				Staged: false,
				Status: string(fileStatus.Worktree),
			})
		}
	}

	return files, nil
}

// getWorktree is a helper function that returns the worktree for a given project path
func (s *GitService) getWorktree(projectPath string) (*git.Worktree, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	return worktree, nil
}

// StageFile adds a file to the staging area
func (s *GitService) StageFile(projectPath string, file string) error {
	worktree, err := s.getWorktree(projectPath)
	if err != nil {
		return err
	}

	_, err = worktree.Add(file)
	if err != nil {
		return fmt.Errorf("failed to stage file: %w", err)
	}

	return nil
}

func (s *GitService) UnstageFile(projectPath string, file string) error {
	worktree, err := s.getWorktree(projectPath)
	if err != nil {
		return err
	}

	_, err = worktree.Remove(file)
	if err != nil {
		return fmt.Errorf("failed to unstage file: %w", err)
	}

	return nil
}

// DiscardChanges discards changes in an unstaged file, reverting it to the last commit
func (s *GitService) DiscardChanges(projectPath string, file string) error {
	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	// Get worktree to check file status
	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	// Check if file is untracked
	status, err := worktree.Status()
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}

	fileStatus := status.File(file)
	if fileStatus.Staging == git.Untracked {
		fullPath := filepath.Join(projectPath, file)
		if err := os.Remove(fullPath); err != nil {
			return fmt.Errorf("failed to delete untracked file: %w", err)
		}
		return nil
	}

	// Get HEAD commit
	ref, err := repo.Head()
	if err != nil {
		return fmt.Errorf("failed to get HEAD: %w", err)
	}

	commit, err := repo.CommitObject(ref.Hash())
	if err != nil {
		return fmt.Errorf("failed to get commit: %w", err)
	}

	// Get the tree for the commit
	tree, err := commit.Tree()
	if err != nil {
		return fmt.Errorf("failed to get tree: %w", err)
	}

	// Find the file entry in the tree to get both content and mode
	entry, err := tree.FindEntry(file)
	if err != nil {
		return fmt.Errorf("failed to find file in tree: %w", err)
	}

	// Get file object
	treeFile, err := tree.File(file)
	if err != nil {
		return fmt.Errorf("failed to get file from tree: %w", err)
	}

	// Get the contents
	contents, err := treeFile.Contents()
	if err != nil {
		return fmt.Errorf("failed to get file contents: %w", err)
	}

	// Write the contents back to the file
	fullPath := filepath.Join(projectPath, file)
	err = os.WriteFile(fullPath, []byte(contents), 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	// Set the original permissions from git tree entry
	mode, modeErr := entry.Mode.ToOSFileMode()
	if modeErr != nil {
		return fmt.Errorf("failed to convert file mode: %w", modeErr)
	}
	if err := os.Chmod(fullPath, mode); err != nil {
		return fmt.Errorf("failed to set file permissions: %w", err)
	}

	return nil
}

// Commit creates a new commit with the staged changes
func (s *GitService) Commit(projectPath string, message string) error {
	worktree, err := s.getWorktree(projectPath)
	if err != nil {
		return err
	}

	// Create the commit
	_, err = worktree.Commit(message, &git.CommitOptions{})
	if err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	return nil
}

// ListBranches returns a list of all branches in the repository
func (s *GitService) ListBranches(projectPath string) ([]BranchInfo, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	branches := []BranchInfo{}

	// Get current branch to mark the HEAD
	head, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("failed to get HEAD reference: %w", err)
	}
	currentBranchName := head.Name().Short()

	// List local branches
	branchIter, err := repo.Branches()
	if err != nil {
		return nil, fmt.Errorf("failed to list branches: %w", err)
	}

	err = branchIter.ForEach(func(ref *plumbing.Reference) error {
		branchName := ref.Name().Short()
		branches = append(branches, BranchInfo{
			Name:     branchName,
			IsRemote: false,
			IsHead:   branchName == currentBranchName,
		})
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to iterate branches: %w", err)
	}

	// List remote branches
	remotes, err := repo.Remotes()
	if err != nil {
		return nil, fmt.Errorf("failed to list remotes: %w", err)
	}

	for _, remote := range remotes {
		refs, err := remote.List(&git.ListOptions{})
		if err != nil {
			continue // Skip this remote if we can't list its refs
		}

		for _, ref := range refs {
			if ref.Name().IsBranch() {
				branchName := ref.Name().Short()
				branches = append(branches, BranchInfo{
					Name:     branchName,
					IsRemote: true,
					IsHead:   false,
				})
			}
		}
	}

	return branches, nil
}

// GetCurrentBranch returns the name of the current branch
func (s *GitService) GetCurrentBranch(projectPath string) (string, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}

	head, err := repo.Head()
	if err != nil {
		return "", fmt.Errorf("failed to get HEAD reference: %w", err)
	}

	return head.Name().Short(), nil
}

// ListCommits returns a list of commits based on the provided filters
func (s *GitService) ListCommits(projectPath string, filter CommitFilter) ([]CommitInfo, error) {
	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Open the repository
	repo, err := git.PlainOpen(absPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	// Get the reference to start from (branch or commit)
	var startRef plumbing.Hash
	if filter.Branch != "" {
		// If branch is specified, use it
		ref, err := repo.Reference(plumbing.NewBranchReferenceName(filter.Branch), true)
		if err != nil {
			return nil, fmt.Errorf("failed to get branch reference: %w", err)
		}
		startRef = ref.Hash()
	} else if filter.StartHash != "" {
		// If start hash is specified, use it
		hash := plumbing.NewHash(filter.StartHash)
		if !hash.IsZero() {
			startRef = hash
		}
	} else {
		// Default to HEAD
		ref, err := repo.Head()
		if err != nil {
			return nil, fmt.Errorf("failed to get HEAD reference: %w", err)
		}
		startRef = ref.Hash()
	}

	// Create log options
	logOptions := &git.LogOptions{
		From:  startRef,
		Order: git.LogOrderCommitterTime,
	}

	// Get the commit iterator
	commitIter, err := repo.Log(logOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit iterator: %w", err)
	}
	defer commitIter.Close()

	var commits []CommitInfo
	var skipped int
	var foundOffsetHash bool = filter.OffsetHash == "" // If no offset hash specified, we start collecting immediately
	var hasMoreCommits bool = false

	err = commitIter.ForEach(func(c *object.Commit) error {
		// Handle hash-based offset
		if !foundOffsetHash {
			if c.Hash.String() == filter.OffsetHash {
				foundOffsetHash = true
			}
			return nil
		}

		// Apply date filters
		if !filter.StartDate.IsZero() && c.Author.When.Before(filter.StartDate) {
			return nil
		}
		if !filter.EndDate.IsZero() && c.Author.When.After(filter.EndDate) {
			return nil
		}

		// Apply author filter
		if filter.Author != "" && !strings.Contains(c.Author.Name, filter.Author) && !strings.Contains(c.Author.Email, filter.Author) {
			return nil
		}

		// Apply message search
		if filter.SearchQuery != "" && !strings.Contains(strings.ToLower(c.Message), strings.ToLower(filter.SearchQuery)) {
			return nil
		}

		// Handle numeric offset (only if we're not using hash-based offset)
		if filter.OffsetHash == "" && skipped < filter.Offset {
			skipped++
			return nil
		}

		// Create parent hashes list
		parentHashes := make([]string, len(c.ParentHashes))
		for i, hash := range c.ParentHashes {
			parentHashes[i] = hash.String()
		}

		// Check if we've reached one before the limit
		if filter.Limit > 0 && len(commits) == filter.Limit-1 {
			// We found one more commit, so there are more after the current batch
			hasMoreCommits = true
			return errors.New("stop iteration")
		}

		// Add commit to results
		commits = append(commits, CommitInfo{
			Hash:         c.Hash.String(),
			Message:      strings.TrimSpace(c.Message),
			Author:       c.Author.Name,
			AuthorEmail:  c.Author.Email,
			Date:         c.Author.When,
			ParentHashes: parentHashes,
			HasMore:      true, // Will be updated after the loop
		})

		// Check if we've reached the limit
		if filter.Limit > 0 && len(commits) >= filter.Limit {
			return errors.New("stop iteration")
		}

		return nil
	})

	// If we stopped due to reaching the limit, don't treat it as an error
	if err != nil && err.Error() != "stop iteration" {
		return nil, fmt.Errorf("failed to iterate commits: %w", err)
	}

	// Update HasMore for the last commit
	if len(commits) > 0 {
		lastIdx := len(commits) - 1
		for i := range commits {
			commits[i].HasMore = i < lastIdx || hasMoreCommits
		}
	}

	return commits, nil
}

// ListCommitsAfter is a convenience function to list commits after a specific commit
func (s *GitService) ListCommitsAfter(projectPath string, offsetHash string, limit int) ([]CommitInfo, error) {
	return s.ListCommits(projectPath, CommitFilter{
		OffsetHash: offsetHash,
		Limit:      limit,
	})
}

// ListCommitsByBranch is a convenience function to list commits from a specific branch
func (s *GitService) ListCommitsByBranch(projectPath string, branch string, limit int) ([]CommitInfo, error) {
	return s.ListCommits(projectPath, CommitFilter{
		Branch: branch,
		Limit:  limit,
	})
}

// ListCommitsByAuthor is a convenience function to list commits by a specific author
func (s *GitService) ListCommitsByAuthor(projectPath string, author string, limit int) ([]CommitInfo, error) {
	return s.ListCommits(projectPath, CommitFilter{
		Author: author,
		Limit:  limit,
	})
}

// SearchCommits is a convenience function to search commits by message
func (s *GitService) SearchCommits(projectPath string, query string, limit int) ([]CommitInfo, error) {
	return s.ListCommits(projectPath, CommitFilter{
		SearchQuery: query,
		Limit:       limit,
	})
}

// GetHeadCommit returns the current HEAD commit
func (s *GitService) GetHeadCommit(projectPath string) (*CommitInfo, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	head, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("failed to get HEAD reference: %w", err)
	}

	commit, err := repo.CommitObject(head.Hash())
	if err != nil {
		return nil, fmt.Errorf("failed to get commit object: %w", err)
	}

	parentHashes := make([]string, len(commit.ParentHashes))
	for i, hash := range commit.ParentHashes {
		parentHashes[i] = hash.String()
	}

	return &CommitInfo{
		Hash:         commit.Hash.String(),
		Message:      commit.Message,
		Author:       commit.Author.Name,
		AuthorEmail:  commit.Author.Email,
		Date:         commit.Author.When,
		ParentHashes: parentHashes,
	}, nil
}

// GetFileDiff returns the diff for a specific file
// If staged is true, returns the diff between HEAD and staged changes
// If staged is false, returns the diff between staged/HEAD and working directory
func (s *GitService) GetFileDiff(projectPath string, filePath string, staged bool) (*FileDiff, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	// Get file status to check if it's untracked or binary
	status, err := worktree.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	fileStatus := status.File(filePath)
	if fileStatus.Staging == git.Untracked && staged {
		return nil, fmt.Errorf("cannot get staged diff for untracked file")
	}

	// Handle deleted files
	if fileStatus.Worktree == git.Deleted || fileStatus.Staging == git.Deleted {
		head, err := repo.Head()
		if err != nil {
			return nil, fmt.Errorf("failed to get HEAD: %w", err)
		}

		commit, err := repo.CommitObject(head.Hash())
		if err != nil {
			return nil, fmt.Errorf("failed to get commit: %w", err)
		}

		tree, err := commit.Tree()
		if err != nil {
			return nil, fmt.Errorf("failed to get tree: %w", err)
		}

		file, err := tree.File(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to get file from HEAD: %w", err)
		}

		content, err := file.Contents()
		if err != nil {
			return nil, fmt.Errorf("failed to get file contents: %w", err)
		}

		diff, stats, err := s.generateDiff(content, "", filePath)
		if err != nil {
			return nil, err
		}

		return &FileDiff{
			Path:     filePath,
			Content:  diff,
			Stats:    stats,
			IsBinary: false,
		}, nil
	}

	// Check if file is binary (only for non-deleted files)
	fullPath := filepath.Join(projectPath, filePath)
	isBinary, err := isFileBinary(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to check if file is binary: %w", err)
	}
	if isBinary {
		return &FileDiff{
			Path:     filePath,
			IsBinary: true,
		}, nil
	}

	var diff string
	var stats DiffStats

	if staged {
		// Get diff between HEAD and index
		diff, stats, err = s.getStagedDiff(repo, worktree, filePath)
	} else {
		// Get diff between index/HEAD and working directory
		diff, stats, err = s.getWorkingDiff(repo, worktree, filePath, fileStatus.Staging == git.Untracked)
	}

	if err != nil {
		return nil, err
	}

	return &FileDiff{
		Path:     filePath,
		Content:  diff,
		Stats:    stats,
		IsBinary: false,
	}, nil
}

// getStagedDiff returns the diff between HEAD and index
func (s *GitService) getStagedDiff(repo *git.Repository, worktree *git.Worktree, filePath string) (string, DiffStats, error) {
	head, err := repo.Head()
	if err != nil {
		if err == plumbing.ErrReferenceNotFound {
			// If no HEAD (new repo), compare with empty tree
			return s.getDiffWithEmpty(worktree, filePath, true)
		}
		return "", DiffStats{}, fmt.Errorf("failed to get HEAD: %w", err)
	}

	commit, err := repo.CommitObject(head.Hash())
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get commit: %w", err)
	}

	// Get the tree for HEAD
	headTree, err := commit.Tree()
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get tree: %w", err)
	}

	var oldContent string

	// Get old content from HEAD
	if headFile, err := headTree.File(filePath); err == nil {
		oldContent, err = headFile.Contents()
		if err != nil {
			return "", DiffStats{}, fmt.Errorf("failed to get HEAD file contents: %w", err)
		}
	}

	// Get index content using the underlying index
	idx, err := repo.Storer.Index()
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get index: %w", err)
	}

	// Find the entry in the index
	var newContent string
	for _, entry := range idx.Entries {
		if entry.Name == filePath {
			// Get the object from the repository
			obj, err := repo.BlobObject(entry.Hash)
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to get blob object: %w", err)
			}

			// Read the blob content
			reader, err := obj.Reader()
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to get blob reader: %w", err)
			}
			defer reader.Close()

			content, err := io.ReadAll(reader)
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to read blob content: %w", err)
			}
			newContent = string(content)
			break
		}
	}

	return s.generateDiff(oldContent, newContent, filePath)
}

// getWorkingDiff returns the diff between index/HEAD and working directory
func (s *GitService) getWorkingDiff(repo *git.Repository, worktree *git.Worktree, filePath string, isUntracked bool) (string, DiffStats, error) {
	if isUntracked {
		return s.getDiffWithEmpty(worktree, filePath, false)
	}

	var oldContent string

	// Try to get content from index first
	idx, err := repo.Storer.Index()
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get index: %w", err)
	}

	foundInIndex := false
	for _, entry := range idx.Entries {
		if entry.Name == filePath {
			// Get the object from the repository
			obj, err := repo.BlobObject(entry.Hash)
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to get blob object: %w", err)
			}

			// Read the blob content
			reader, err := obj.Reader()
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to get blob reader: %w", err)
			}
			defer reader.Close()

			content, err := io.ReadAll(reader)
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to read blob content: %w", err)
			}
			oldContent = string(content)
			foundInIndex = true
			break
		}
	}

	// If not in index, try HEAD
	if !foundInIndex {
		head, err := repo.Head()
		if err != nil {
			if err == plumbing.ErrReferenceNotFound {
				return s.getDiffWithEmpty(worktree, filePath, false)
			}
			return "", DiffStats{}, fmt.Errorf("failed to get HEAD: %w", err)
		}

		commit, err := repo.CommitObject(head.Hash())
		if err != nil {
			return "", DiffStats{}, fmt.Errorf("failed to get commit: %w", err)
		}

		tree, err := commit.Tree()
		if err != nil {
			return "", DiffStats{}, fmt.Errorf("failed to get tree: %w", err)
		}

		if headFile, err := tree.File(filePath); err == nil {
			oldContent, err = headFile.Contents()
			if err != nil {
				return "", DiffStats{}, fmt.Errorf("failed to get HEAD file contents: %w", err)
			}
		}
	}

	// Get working directory content
	newContent, err := s.getFileContents(filepath.Join(worktree.Filesystem.Root(), filePath))
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get working file contents: %w", err)
	}

	return s.generateDiff(oldContent, newContent, filePath)
}

// getDiffWithEmpty returns a diff comparing with an empty file
func (s *GitService) getDiffWithEmpty(worktree *git.Worktree, filePath string, staged bool) (string, DiffStats, error) {
	var content string
	var err error

	// Both staged and unstaged cases read from the same location
	// since we're dealing with a new file
	content, err = s.getFileContents(filepath.Join(worktree.Filesystem.Root(), filePath))
	if err != nil {
		return "", DiffStats{}, fmt.Errorf("failed to get file contents: %w", err)
	}

	return s.generateDiff("", content, filePath)
}

// generateDiff creates a unified diff from old and new content
func (s *GitService) generateDiff(oldContent, newContent, filePath string) (string, DiffStats, error) {
	// For deleted files, show all lines as deleted
	if newContent == "" && oldContent != "" {
		lines := strings.Split(strings.TrimSuffix(oldContent, "\n"), "\n")
		stats := DiffStats{
			Deleted: len(lines),
		}
		var diffOutput strings.Builder

		// Write diff header
		fmt.Fprintf(&diffOutput, "--- a/%s\n+++ b/%s\n", filePath, filePath)
		fmt.Fprintf(&diffOutput, "@@ -1,%d +0,0 @@\n", len(lines))

		// Show each line as deleted
		for _, line := range lines {
			fmt.Fprintf(&diffOutput, "-%s\n", line)
		}

		return diffOutput.String(), stats, nil
	}

	// Normalize line endings and split into lines
	oldLines := strings.Split(strings.TrimSuffix(oldContent, "\n"), "\n")
	newLines := strings.Split(strings.TrimSuffix(newContent, "\n"), "\n")

	// Calculate diffs using go-git/go-diff
	diffs := diff.Do(strings.Join(oldLines, "\n"), strings.Join(newLines, "\n"))

	stats := DiffStats{}
	var diffOutput strings.Builder

	// Write diff header
	fmt.Fprintf(&diffOutput, "--- a/%s\n+++ b/%s\n", filePath, filePath)

	// Calculate stats and build diff output
	for _, d := range diffs {
		switch d.Type {
		case diffmatchpatch.DiffDelete:
			lines := strings.Split(strings.TrimSuffix(d.Text, "\n"), "\n")
			stats.Deleted += len(lines)
			for _, line := range lines {
				fmt.Fprintf(&diffOutput, "-%s\n", line)
			}
		case diffmatchpatch.DiffInsert:
			lines := strings.Split(strings.TrimSuffix(d.Text, "\n"), "\n")
			stats.Added += len(lines)
			for _, line := range lines {
				fmt.Fprintf(&diffOutput, "+%s\n", line)
			}
		case diffmatchpatch.DiffEqual:
			lines := strings.Split(strings.TrimSuffix(d.Text, "\n"), "\n")
			for _, line := range lines {
				fmt.Fprintf(&diffOutput, " %s\n", line)
			}
		}
	}

	return diffOutput.String(), stats, nil
}

// getFileContents reads a file's contents
func (s *GitService) getFileContents(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	return string(content), nil
}

// isFileBinary checks if a file is binary
func isFileBinary(path string) (bool, error) {
	file, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer file.Close()

	// Read first 512 bytes to check content type
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return false, err
	}

	return strings.Contains(http.DetectContentType(buffer[:n]), "application/octet-stream"), nil
}
