package tools

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
)

type GrepTool struct {
	workingDir          string
	restrictToWorkspace bool
}

func NewGrepTool(workingDir string, restrict bool) *GrepTool {
	return &GrepTool{
		workingDir:          workingDir,
		restrictToWorkspace: restrict,
	}
}

func (t *GrepTool) Name() string {
	return "grep"
}

func (t *GrepTool) Description() string {
	return "Search for patterns in files using ripgrep (fast recursive search)"
}

func (t *GrepTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":     "object",
		"required": []string{"pattern"},
		"properties": map[string]interface{}{
			"pattern": map[string]interface{}{
				"type":        "string",
				"description": "Pattern to search for (supports regex)",
			},
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to search in (file or directory, defaults to current workspace)",
			},
			"case_sensitive": map[string]interface{}{
				"type":        "boolean",
				"description": "Whether search is case sensitive (default: false)",
				"default":     false,
			},
			"file_pattern": map[string]interface{}{
				"type":        "string",
				"description": "File pattern to filter (e.g., '*.go', '*.js')",
			},
			"max_results": map[string]interface{}{
				"type":        "number",
				"description": "Maximum number of results to return (default: 100)",
				"default":     100,
			},
			"context_lines": map[string]interface{}{
				"type":        "number",
				"description": "Number of context lines to show around matches (default: 0)",
				"default":     0,
			},
		},
	}
}

func (t *GrepTool) Execute(ctx context.Context, args map[string]interface{}) *ToolResult {
	pattern, ok := args["pattern"].(string)
	if !ok {
		return ErrorResult("pattern parameter is required")
	}

	// Determine search path
	searchPath := t.workingDir
	if pathArg, ok := args["path"].(string); ok && pathArg != "" {
		if filepath.IsAbs(pathArg) {
			searchPath = pathArg
		} else {
			searchPath = filepath.Join(t.workingDir, pathArg)
		}
	}

	// Validate path if restricted
	if t.restrictToWorkspace {
		absPath, err := filepath.Abs(searchPath)
		if err != nil {
			return ErrorResult(fmt.Sprintf("invalid path: %v", err))
		}
		absWorkspace, _ := filepath.Abs(t.workingDir)
		if !strings.HasPrefix(absPath, absWorkspace) {
			return ErrorResult("access denied: path outside workspace")
		}
	}

	// Build ripgrep command
	args_list := []string{
		"--color=never", // No color codes
		"--line-number",  // Show line numbers
		"--no-heading",   // Don't group by file
		"--with-filename", // Always show filename
	}

	// Case sensitivity
	caseSensitive, _ := args["case_sensitive"].(bool)
	if !caseSensitive {
		args_list = append(args_list, "--ignore-case")
	}

	// File pattern filter
	if filePattern, ok := args["file_pattern"].(string); ok && filePattern != "" {
		args_list = append(args_list, "--glob", filePattern)
	}

	// Context lines
	if contextLines, ok := args["context_lines"].(float64); ok && contextLines > 0 {
		args_list = append(args_list, fmt.Sprintf("--context=%d", int(contextLines)))
	}

	// Max results
	maxResults := 100
	if max, ok := args["max_results"].(float64); ok && max > 0 {
		maxResults = int(max)
	}
	args_list = append(args_list, fmt.Sprintf("--max-count=%d", maxResults))

	// Add pattern and path
	args_list = append(args_list, pattern, searchPath)

	// Try ripgrep first, fallback to grep
	output, err := t.executeSearch("rg", args_list, ctx)
	if err != nil {
		// Try standard grep as fallback
		output, err = t.fallbackGrep(pattern, searchPath, caseSensitive, ctx)
		if err != nil {
			return ErrorResult(fmt.Sprintf("search failed: %v", err))
		}
	}

	if strings.TrimSpace(output) == "" {
		return NewToolResult(fmt.Sprintf("No matches found for pattern: %s", pattern))
	}

	// Truncate if too long
	const maxOutputLength = 50000
	if len(output) > maxOutputLength {
		output = output[:maxOutputLength] + fmt.Sprintf("\n... (truncated, %d bytes total)", len(output))
	}

	return NewToolResult(output)
}

func (t *GrepTool) executeSearch(cmd string, args []string, ctx context.Context) (string, error) {
	command := exec.CommandContext(ctx, cmd, args...)
	command.Dir = t.workingDir

	var stdout, stderr bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = &stderr

	err := command.Run()

	// ripgrep returns exit code 1 when no matches found (not an error)
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			return "", nil // No matches found
		}
		return "", fmt.Errorf("%v: %s", err, stderr.String())
	}

	return stdout.String(), nil
}

func (t *GrepTool) fallbackGrep(pattern, searchPath string, caseSensitive bool, ctx context.Context) (string, error) {
	args := []string{
		"-r",  // Recursive
		"-n",  // Line numbers
		"-H",  // Show filename
	}

	if !caseSensitive {
		args = append(args, "-i")
	}

	args = append(args, pattern, searchPath)

	command := exec.CommandContext(ctx, "grep", args...)
	command.Dir = t.workingDir

	var stdout, stderr bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = &stderr

	err := command.Run()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			return "", nil // No matches found
		}
		return "", fmt.Errorf("%v: %s", err, stderr.String())
	}

	return stdout.String(), nil
}
