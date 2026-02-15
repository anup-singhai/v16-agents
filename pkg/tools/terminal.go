package tools

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/creack/pty"
	"github.com/google/uuid"
)

type ptySession struct {
	id      string
	cmd     *exec.Cmd
	ptmx    *os.File
	output  []byte
	mu      sync.Mutex
}

type TerminalTool struct {
	sessions map[string]*ptySession
	mu       sync.RWMutex
}

func NewTerminalTool() *TerminalTool {
	return &TerminalTool{
		sessions: make(map[string]*ptySession),
	}
}

func (t *TerminalTool) Name() string {
	return "terminal"
}

func (t *TerminalTool) Description() string {
	return "Interactive terminal sessions: open shells, run commands, get output"
}

func (t *TerminalTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":     "object",
		"required": []string{"action"},
		"properties": map[string]interface{}{
			"action": map[string]interface{}{
				"type": "string",
				"enum": []string{
					"open",
					"input",
					"get_output",
					"resize",
					"close",
					"list",
				},
				"description": "Terminal action to perform",
			},
			"session_id": map[string]interface{}{
				"type":        "string",
				"description": "Session ID (returned from open)",
			},
			"command": map[string]interface{}{
				"type":        "string",
				"description": "Command to run (for input)",
			},
			"shell": map[string]interface{}{
				"type":        "string",
				"description": "Shell to use (for open)",
				"default":     "/bin/bash",
			},
			"rows": map[string]interface{}{
				"type":        "number",
				"description": "Terminal rows (for resize)",
			},
			"cols": map[string]interface{}{
				"type":        "number",
				"description": "Terminal columns (for resize)",
			},
		},
	}
}

func (t *TerminalTool) Execute(ctx context.Context, args map[string]interface{}) *ToolResult {
	action, ok := args["action"].(string)
	if !ok {
		return ErrorResult("action parameter required")
	}

	switch action {
	case "open":
		return t.openSession(args)
	case "input":
		return t.sendInput(args)
	case "get_output":
		return t.getOutput(args)
	case "resize":
		return t.resize(args)
	case "close":
		return t.closeSession(args)
	case "list":
		return t.listSessions()
	default:
		return ErrorResult(fmt.Sprintf("unknown action: %s", action))
	}
}

func (t *TerminalTool) openSession(args map[string]interface{}) *ToolResult {
	shell, ok := args["shell"].(string)
	if !ok {
		shell = "/bin/bash"
	}

	cmd := exec.Command(shell)
	ptmx, err := pty.Start(cmd)
	if err != nil {
		return ErrorResult(fmt.Sprintf("failed to start PTY: %v", err))
	}

	sessionID := uuid.New().String()
	session := &ptySession{
		id:     sessionID,
		cmd:    cmd,
		ptmx:   ptmx,
		output: make([]byte, 0),
	}

	// Start reading output
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				if err != io.EOF {
					// Log error but don't return - session might be closing
				}
				return
			}
			session.mu.Lock()
			session.output = append(session.output, buf[:n]...)
			session.mu.Unlock()
		}
	}()

	t.mu.Lock()
	t.sessions[sessionID] = session
	t.mu.Unlock()

	return NewToolResult(fmt.Sprintf("Session opened: %s", sessionID))
}

func (t *TerminalTool) sendInput(args map[string]interface{}) *ToolResult {
	sessionID, ok := args["session_id"].(string)
	if !ok {
		return ErrorResult("session_id parameter required")
	}

	command, ok := args["command"].(string)
	if !ok {
		return ErrorResult("command parameter required")
	}

	t.mu.RLock()
	session, exists := t.sessions[sessionID]
	t.mu.RUnlock()

	if !exists {
		return ErrorResult(fmt.Sprintf("session not found: %s", sessionID))
	}

	// Add newline if not present
	if !strings.HasSuffix(command, "\n") {
		command += "\n"
	}

	_, err := session.ptmx.Write([]byte(command))
	if err != nil {
		return ErrorResult(fmt.Sprintf("write failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Sent: %s", strings.TrimSpace(command)))
}

func (t *TerminalTool) getOutput(args map[string]interface{}) *ToolResult {
	sessionID, ok := args["session_id"].(string)
	if !ok {
		return ErrorResult("session_id parameter required")
	}

	t.mu.RLock()
	session, exists := t.sessions[sessionID]
	t.mu.RUnlock()

	if !exists {
		return ErrorResult(fmt.Sprintf("session not found: %s", sessionID))
	}

	session.mu.Lock()
	output := string(session.output)
	session.output = make([]byte, 0) // Clear output buffer
	session.mu.Unlock()

	return NewToolResult(output)
}

func (t *TerminalTool) resize(args map[string]interface{}) *ToolResult {
	sessionID, ok := args["session_id"].(string)
	if !ok {
		return ErrorResult("session_id parameter required")
	}

	rows, rowsOk := args["rows"].(float64)
	cols, colsOk := args["cols"].(float64)

	if !rowsOk || !colsOk {
		return ErrorResult("rows and cols parameters required")
	}

	t.mu.RLock()
	session, exists := t.sessions[sessionID]
	t.mu.RUnlock()

	if !exists {
		return ErrorResult(fmt.Sprintf("session not found: %s", sessionID))
	}

	size := &pty.Winsize{
		Rows: uint16(rows),
		Cols: uint16(cols),
	}

	err := pty.Setsize(session.ptmx, size)
	if err != nil {
		return ErrorResult(fmt.Sprintf("resize failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Resized to %dx%d", int(cols), int(rows)))
}

func (t *TerminalTool) closeSession(args map[string]interface{}) *ToolResult {
	sessionID, ok := args["session_id"].(string)
	if !ok {
		return ErrorResult("session_id parameter required")
	}

	t.mu.Lock()
	session, exists := t.sessions[sessionID]
	if exists {
		delete(t.sessions, sessionID)
	}
	t.mu.Unlock()

	if !exists {
		return ErrorResult(fmt.Sprintf("session not found: %s", sessionID))
	}

	session.ptmx.Close()
	if session.cmd.Process != nil {
		session.cmd.Process.Kill()
	}

	return NewToolResult(fmt.Sprintf("Session closed: %s", sessionID))
}

func (t *TerminalTool) listSessions() *ToolResult {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if len(t.sessions) == 0 {
		return NewToolResult("No active sessions")
	}

	var sessions []string
	for id := range t.sessions {
		sessions = append(sessions, id)
	}

	return NewToolResult(fmt.Sprintf("Active sessions:\n%s", strings.Join(sessions, "\n")))
}
