package tools

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/chromedp/chromedp"
)

type BrowserTool struct {
	allocCtx context.Context
	cancel   context.CancelFunc
}

func NewBrowserTool() *BrowserTool {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
	)

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)

	return &BrowserTool{
		allocCtx: allocCtx,
		cancel:   cancel,
	}
}

func (t *BrowserTool) Name() string {
	return "browser"
}

func (t *BrowserTool) Description() string {
	return "Automate browser: navigate, click, type, screenshot, extract content"
}

func (t *BrowserTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":     "object",
		"required": []string{"action"},
		"properties": map[string]interface{}{
			"action": map[string]interface{}{
				"type": "string",
				"enum": []string{
					"navigate",
					"screenshot",
					"click",
					"type",
					"get_content",
					"get_text",
					"evaluate",
					"wait_visible",
				},
				"description": "Browser action to perform",
			},
			"url": map[string]interface{}{
				"type":        "string",
				"description": "URL to navigate to",
			},
			"selector": map[string]interface{}{
				"type":        "string",
				"description": "CSS selector for element",
			},
			"text": map[string]interface{}{
				"type":        "string",
				"description": "Text to type",
			},
			"script": map[string]interface{}{
				"type":        "string",
				"description": "JavaScript to evaluate",
			},
			"timeout": map[string]interface{}{
				"type":        "number",
				"description": "Timeout in seconds",
				"default":     30,
			},
			"path": map[string]interface{}{
				"type":        "string",
				"description": "File path for screenshot (optional, defaults to /tmp/browser-screenshot.png)",
			},
		},
	}
}

func (t *BrowserTool) Execute(ctx context.Context, args map[string]interface{}) *ToolResult {
	action, ok := args["action"].(string)
	if !ok {
		return ErrorResult("action parameter required")
	}

	// Create browser context
	browserCtx, cancel := chromedp.NewContext(t.allocCtx)
	defer cancel()

	// Set timeout
	timeout := 30
	if timeoutVal, ok := args["timeout"].(float64); ok {
		timeout = int(timeoutVal)
	}
	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, time.Duration(timeout)*time.Second)
	defer timeoutCancel()

	switch action {
	case "navigate":
		return t.navigate(timeoutCtx, args)
	case "screenshot":
		return t.screenshot(timeoutCtx, args)
	case "click":
		return t.click(timeoutCtx, args)
	case "type":
		return t.typeText(timeoutCtx, args)
	case "get_content":
		return t.getContent(timeoutCtx, args)
	case "get_text":
		return t.getText(timeoutCtx, args)
	case "evaluate":
		return t.evaluate(timeoutCtx, args)
	case "wait_visible":
		return t.waitVisible(timeoutCtx, args)
	default:
		return ErrorResult(fmt.Sprintf("unknown action: %s", action))
	}
}

func (t *BrowserTool) navigate(ctx context.Context, args map[string]interface{}) *ToolResult {
	url, ok := args["url"].(string)
	if !ok {
		return ErrorResult("url parameter required")
	}

	err := chromedp.Run(ctx, chromedp.Navigate(url))
	if err != nil {
		return ErrorResult(fmt.Sprintf("navigation failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Navigated to %s", url))
}

func (t *BrowserTool) screenshot(ctx context.Context, args map[string]interface{}) *ToolResult {
	var buf []byte

	err := chromedp.Run(ctx, chromedp.CaptureScreenshot(&buf))
	if err != nil {
		return ErrorResult(fmt.Sprintf("screenshot failed: %v", err))
	}

	// Get path or use default
	path, ok := args["path"].(string)
	if !ok || path == "" {
		path = "/tmp/browser-screenshot.png"
	}

	// Save to file
	err = os.WriteFile(path, buf, 0644)
	if err != nil {
		return ErrorResult(fmt.Sprintf("failed to save screenshot: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Screenshot saved to %s", path))
}

func (t *BrowserTool) click(ctx context.Context, args map[string]interface{}) *ToolResult {
	selector, ok := args["selector"].(string)
	if !ok {
		return ErrorResult("selector parameter required")
	}

	err := chromedp.Run(ctx, chromedp.Click(selector))
	if err != nil {
		return ErrorResult(fmt.Sprintf("click failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Clicked element: %s", selector))
}

func (t *BrowserTool) typeText(ctx context.Context, args map[string]interface{}) *ToolResult {
	selector, ok := args["selector"].(string)
	if !ok {
		return ErrorResult("selector parameter required")
	}

	text, ok := args["text"].(string)
	if !ok {
		return ErrorResult("text parameter required")
	}

	err := chromedp.Run(ctx, chromedp.SendKeys(selector, text))
	if err != nil {
		return ErrorResult(fmt.Sprintf("type failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Typed '%s' into %s", text, selector))
}

func (t *BrowserTool) getContent(ctx context.Context, args map[string]interface{}) *ToolResult {
	var html string
	err := chromedp.Run(ctx, chromedp.OuterHTML("html", &html))
	if err != nil {
		return ErrorResult(fmt.Sprintf("get content failed: %v", err))
	}

	return NewToolResult(html)
}

func (t *BrowserTool) getText(ctx context.Context, args map[string]interface{}) *ToolResult {
	selector, ok := args["selector"].(string)
	if !ok {
		return ErrorResult("selector parameter required")
	}

	var text string
	err := chromedp.Run(ctx, chromedp.Text(selector, &text))
	if err != nil {
		return ErrorResult(fmt.Sprintf("get text failed: %v", err))
	}

	return NewToolResult(text)
}

func (t *BrowserTool) evaluate(ctx context.Context, args map[string]interface{}) *ToolResult {
	script, ok := args["script"].(string)
	if !ok {
		return ErrorResult("script parameter required")
	}

	var result interface{}
	err := chromedp.Run(ctx, chromedp.Evaluate(script, &result))
	if err != nil {
		return ErrorResult(fmt.Sprintf("evaluate failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Result: %v", result))
}

func (t *BrowserTool) waitVisible(ctx context.Context, args map[string]interface{}) *ToolResult {
	selector, ok := args["selector"].(string)
	if !ok {
		return ErrorResult("selector parameter required")
	}

	err := chromedp.Run(ctx, chromedp.WaitVisible(selector))
	if err != nil {
		return ErrorResult(fmt.Sprintf("wait failed: %v", err))
	}

	return NewToolResult(fmt.Sprintf("Element visible: %s", selector))
}

// Cleanup cleans up browser resources
func (t *BrowserTool) Cleanup() {
	if t.cancel != nil {
		t.cancel()
	}
}
