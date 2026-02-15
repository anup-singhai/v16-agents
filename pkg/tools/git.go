package tools

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
)

type GitTool struct {
	workingDir          string
	restrictToWorkspace bool
}

func NewGitTool(workingDir string, restrict bool) *GitTool {
	return &GitTool{
		workingDir:          workingDir,
		restrictToWorkspace: restrict,
	}
}

func (t *GitTool) Name() string {
	return "git"
}

func (t *GitTool) Description() string {
	return "Execute git operations: status, diff, log, commit, push, pull, branch"
}

func (t *GitTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":     "object",
		"required": []string{"action"},
		"properties": map[string]interface{}{
			"action": map[string]interface{}{
				"type": "string",
				"enum": []string{
					"status",
					"diff",
					"log",
					"commit",
					"push",
					"pull",
					"branch",
					"add",
					"show",
				},
				"description": "Git action to perform",
			},
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to git repository (defaults to workspace)",
			},
			"files": map[string]interface{}{
				"type":        "string",
				"description": "Files to add (for 'add' action, space-separated or '.' for all)",
			},
			"message": map[string]interface{}{
				"type":        "string",
				"description": "Commit message (for 'commit' action)",
			},
			"branch": map[string]interface{}{
				"type":        "string",
				"description": "Branch name (for 'branch' action)",
			},
			"limit": map[string]interface{}{
				"type":        "number",
				"description": "Number of log entries to show (for 'log' action, default: 10)",
				"default":     10,
			},
			"ref": map[string]interface{}{
				"type":        "string",
				"description": "Git ref to show (for 'show' action, e.g., commit hash, HEAD)",
			},
		},
	}
}

func (t *GitTool) Execute(ctx context.Context, args map[string]interface{}) *ToolResult {
	action, ok := args["action"].(string)
	if !ok {
		return ErrorResult("action parameter is required")
	}

	// Determine repository path
	repoPath := t.workingDir
	if pathArg, ok := args["path"].(string); ok && pathArg != "" {
		if filepath.IsAbs(pathArg) {
			repoPath = pathArg
		} else {
			repoPath = filepath.Join(t.workingDir, pathArg)
		}
	}

	// Validate path if restricted
	if t.restrictToWorkspace {
		absPath, err := filepath.Abs(repoPath)
		if err != nil {
			return ErrorResult(fmt.Sprintf("invalid path: %v", err))
		}
		absWorkspace, _ := filepath.Abs(t.workingDir)
		if !strings.HasPrefix(absPath, absWorkspace) {
			return ErrorResult("access denied: path outside workspace")
		}
	}

	// Execute git command based on action
	switch action {
	case "status":
		return t.gitStatus(ctx, repoPath)
	case "diff":
		return t.gitDiff(ctx, repoPath)
	case "log":
		limit := 10
		if l, ok := args["limit"].(float64); ok {
			limit = int(l)
		}
		return t.gitLog(ctx, repoPath, limit)
	case "commit":
		message, ok := args["message"].(string)
		if !ok {
			return ErrorResult("message parameter required for commit")
		}
		return t.gitCommit(ctx, repoPath, message)
	case "push":
		return t.gitPush(ctx, repoPath)
	case "pull":
		return t.gitPull(ctx, repoPath)
	case "branch":
		if branchName, ok := args["branch"].(string); ok && branchName != "" {
			return t.gitBranch(ctx, repoPath, branchName)
		}
		return t.gitBranchList(ctx, repoPath)
	case "add":
		files, ok := args["files"].(string)
		if !ok {
			return ErrorResult("files parameter required for add")
		}
		return t.gitAdd(ctx, repoPath, files)
	case "show":
		ref := "HEAD"
		if r, ok := args["ref"].(string); ok && r != "" {
			ref = r
		}
		return t.gitShow(ctx, repoPath, ref)
	default:
		return ErrorResult(fmt.Sprintf("unknown action: %s", action))
	}
}

func (t *GitTool) runGitCommand(ctx context.Context, repoPath string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = repoPath

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("%v: %s", err, stderr.String())
	}

	return stdout.String(), nil
}

func (t *GitTool) gitStatus(ctx context.Context, repoPath string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "status", "--short", "--branch")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git status failed: %v", err))
	}

	if strings.TrimSpace(output) == "" {
		output = "Working directory clean"
	}

	return NewToolResult(output)
}

func (t *GitTool) gitDiff(ctx context.Context, repoPath string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "diff")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git diff failed: %v", err))
	}

	if strings.TrimSpace(output) == "" {
		output = "No changes in working directory"
	}

	// Truncate if too long
	const maxDiffLength = 50000
	if len(output) > maxDiffLength {
		output = output[:maxDiffLength] + fmt.Sprintf("\n... (truncated, %d bytes total)", len(output))
	}

	return NewToolResult(output)
}

func (t *GitTool) gitLog(ctx context.Context, repoPath string, limit int) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "log",
		fmt.Sprintf("--max-count=%d", limit),
		"--pretty=format:%h - %s (%an, %ar)",
		"--abbrev-commit")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git log failed: %v", err))
	}

	return NewToolResult(output)
}

func (t *GitTool) gitCommit(ctx context.Context, repoPath, message string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "commit", "-m", message)
	if err != nil {
		return ErrorResult(fmt.Sprintf("git commit failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Commit successful:\n%s", output))
}

func (t *GitTool) gitPush(ctx context.Context, repoPath string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "push")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git push failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Push successful:\n%s", output))
}

func (t *GitTool) gitPull(ctx context.Context, repoPath string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "pull")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git pull failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Pull successful:\n%s", output))
}

func (t *GitTool) gitBranch(ctx context.Context, repoPath, branchName string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "branch", branchName)
	if err != nil {
		return ErrorResult(fmt.Sprintf("git branch failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Branch '%s' created:\n%s", branchName, output))
}

func (t *GitTool) gitBranchList(ctx context.Context, repoPath string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "branch", "-a")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git branch failed: %v", err))
	}

	return NewToolResult(output)
}

func (t *GitTool) gitAdd(ctx context.Context, repoPath, files string) *ToolResult {
	// Split files by space if multiple
	fileList := strings.Fields(files)
	if len(fileList) == 0 {
		return ErrorResult("no files specified")
	}

	args := append([]string{"add"}, fileList...)
	_, err := t.runGitCommand(ctx, repoPath, args...)
	if err != nil {
		return ErrorResult(fmt.Sprintf("git add failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Files staged:\n%s", strings.Join(fileList, "\n")))
}

func (t *GitTool) gitShow(ctx context.Context, repoPath, ref string) *ToolResult {
	output, err := t.runGitCommand(ctx, repoPath, "show", ref, "--stat")
	if err != nil {
		return ErrorResult(fmt.Sprintf("git show failed: %v", err))
	}

	// Truncate if too long
	const maxShowLength = 30000
	if len(output) > maxShowLength {
		output = output[:maxShowLength] + fmt.Sprintf("\n... (truncated, %d bytes total)", len(output))
	}

	return NewToolResult(output)
}
