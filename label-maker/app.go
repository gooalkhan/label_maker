package main

import (
	"context"
	"os"
	_ "embed"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed llm_image_to_json_prompt.md
var llmPrompt string

// App struct
type App struct {
	ctx context.Context
}

// GetLLMPrompt returns the embedded LLM prompt text
func (a *App) GetLLMPrompt() string {
	return llmPrompt
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SaveSVG prompts the user for a location and saves the SVG content to disk
func (a *App) SaveSVG(content string, defaultName string) error {
	path, _ := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Save Food Label SVG",
		Filters: []runtime.FileFilter{
			{DisplayName: "SVG Files (*.svg)", Pattern: "*.svg"},
		},
	})

	if path != "" {
		return os.WriteFile(path, []byte(content), 0644)
	}
	return nil
}
