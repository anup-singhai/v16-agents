package tools

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type GlobTool struct {
	workingDir          string
	restrictToWorkspace bool
}

type fileInfo struct {
	Path    string
	ModTime time.Time
}

func NewGlobTool(workingDir string, restrict bool) *GlobTool {
	return &GlobTool{
		workingDir:          workingDir,
		restrictToWorkspace: restrict,
	}
}

func (t *GlobTool) Name() string {
	return "glob"
}

func (t *GlobTool) Description() string {
	return "Find files matching glob patterns (e.g., '**/*.go', 'src/**/*.ts')"
}

func (t *GlobTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":     "object",
		"required": []string{"pattern"},
		"properties": map[string]interface{}{
			"pattern": map[string]interface{}{
				"type":        "string",
				"description": "Glob pattern to match (supports **, *, ?)",
			},
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Base path to search in (defaults to workspace root)",
			},
			"max_results": map[string]interface{}{
				"type":        "number",
				"description": "Maximum number of files to return (default: 1000)",
				"default":     1000,
			},
			"sort_by": map[string]interface{}{
				"type":        "string",
				"enum":        []string{"name", "mtime"},
				"description": "Sort results by name or modification time (default: mtime)",
				"default":     "mtime",
			},
			"include_dirs": map[string]interface{}{
				"type":        "boolean",
				"description": "Include directories in results (default: false)",
				"default":     false,
			},
		},
	}
}

func (t *GlobTool) Execute(ctx context.Context, args map[string]interface{}) *ToolResult {
	pattern, ok := args["pattern"].(string)
	if !ok {
		return ErrorResult("pattern parameter is required")
	}

	// Determine base path
	basePath := t.workingDir
	if pathArg, ok := args["path"].(string); ok && pathArg != "" {
		if filepath.IsAbs(pathArg) {
			basePath = pathArg
		} else {
			basePath = filepath.Join(t.workingDir, pathArg)
		}
	}

	// Validate path if restricted
	if t.restrictToWorkspace {
		absPath, err := filepath.Abs(basePath)
		if err != nil {
			return ErrorResult(fmt.Sprintf("invalid path: %v", err))
		}
		absWorkspace, _ := filepath.Abs(t.workingDir)
		if !strings.HasPrefix(absPath, absWorkspace) {
			return ErrorResult("access denied: path outside workspace")
		}
	}

	// Parse options
	maxResults := 1000
	if max, ok := args["max_results"].(float64); ok && max > 0 {
		maxResults = int(max)
	}

	sortBy := "mtime"
	if sort, ok := args["sort_by"].(string); ok {
		sortBy = sort
	}

	includeDirs := false
	if include, ok := args["include_dirs"].(bool); ok {
		includeDirs = include
	}

	// Build full pattern
	var fullPattern string
	if filepath.IsAbs(pattern) {
		fullPattern = pattern
	} else {
		fullPattern = filepath.Join(basePath, pattern)
	}

	// Find matching files
	matches, err := t.findMatches(fullPattern, includeDirs, maxResults)
	if err != nil {
		return ErrorResult(fmt.Sprintf("glob failed: %v", err))
	}

	if len(matches) == 0 {
		return NewToolResult(fmt.Sprintf("No files found matching pattern: %s", pattern))
	}

	// Sort results
	if sortBy == "mtime" {
		sort.Slice(matches, func(i, j int) bool {
			return matches[i].ModTime.After(matches[j].ModTime)
		})
	} else {
		sort.Slice(matches, func(i, j int) bool {
			return matches[i].Path < matches[j].Path
		})
	}

	// Format output
	var output strings.Builder
	output.WriteString(fmt.Sprintf("Found %d files matching '%s':\n\n", len(matches), pattern))

	for i, match := range matches {
		// Make path relative to base if possible
		relPath, err := filepath.Rel(basePath, match.Path)
		if err != nil {
			relPath = match.Path
		}

		if sortBy == "mtime" {
			output.WriteString(fmt.Sprintf("%s (modified: %s)\n", relPath, match.ModTime.Format("2006-01-02 15:04:05")))
		} else {
			output.WriteString(fmt.Sprintf("%s\n", relPath))
		}

		if i >= maxResults-1 {
			break
		}
	}

	if len(matches) > maxResults {
		output.WriteString(fmt.Sprintf("\n... (showing first %d of %d results)", maxResults, len(matches)))
	}

	return NewToolResult(output.String())
}

func (t *GlobTool) findMatches(pattern string, includeDirs bool, maxResults int) ([]fileInfo, error) {
	var matches []fileInfo

	// Use filepath.Glob for simple patterns
	if !strings.Contains(pattern, "**") {
		files, err := filepath.Glob(pattern)
		if err != nil {
			return nil, err
		}

		for _, file := range files {
			info, err := os.Stat(file)
			if err != nil {
				continue
			}

			if !includeDirs && info.IsDir() {
				continue
			}

			matches = append(matches, fileInfo{
				Path:    file,
				ModTime: info.ModTime(),
			})

			if len(matches) >= maxResults*2 {
				break
			}
		}
		return matches, nil
	}

	// Handle ** patterns with recursive walk
	baseDir := pattern
	globPattern := pattern

	// Extract base directory (part before **)
	if idx := strings.Index(pattern, "**"); idx > 0 {
		baseDir = filepath.Dir(pattern[:idx])
		// Keep pattern relative to base
		if relPattern, err := filepath.Rel(baseDir, pattern); err == nil {
			globPattern = relPattern
		}
	}

	// Walk directory tree
	err := filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip errors
		}

		// Skip directories unless requested
		if !includeDirs && info.IsDir() {
			return nil
		}

		// Get relative path for matching
		relPath, err := filepath.Rel(baseDir, path)
		if err != nil {
			return nil
		}

		// Try to match
		matched, err := filepath.Match(globPattern, relPath)
		if err != nil {
			// Try matching with doublestar pattern
			matched = t.matchDoublestar(globPattern, relPath)
		}

		if matched {
			matches = append(matches, fileInfo{
				Path:    path,
				ModTime: info.ModTime(),
			})

			// Stop early if we have enough results
			if len(matches) >= maxResults*2 {
				return filepath.SkipDir
			}
		}

		return nil
	})

	return matches, err
}

// matchDoublestar handles ** patterns manually
func (t *GlobTool) matchDoublestar(pattern, path string) bool {
	// Convert ** to a regex-like match
	// Simple implementation: ** matches any number of path segments
	parts := strings.Split(pattern, "**")
	if len(parts) != 2 {
		return false
	}

	prefix := strings.TrimSuffix(parts[0], "/")
	suffix := strings.TrimPrefix(parts[1], "/")

	// Check prefix
	if prefix != "" && !strings.HasPrefix(path, prefix) {
		return false
	}

	// Check suffix
	if suffix != "" {
		// Try to match the suffix part
		matched, _ := filepath.Match(suffix, filepath.Base(path))
		if matched {
			return true
		}
		// Also check if full remaining path matches
		if strings.HasSuffix(path, suffix) {
			return true
		}
	}

	return prefix == "" && suffix == ""
}
