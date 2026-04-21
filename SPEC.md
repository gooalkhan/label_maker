- **Name**: Food Labeling SVG Generator
- **Version**: 0.1.0
- **Platform**: Desktop (Windows/Linux)
- **Framework**: Wails v2 (Stable)
- **Frontend**: Vanilla JavaScript (No Framework)
- **Font**: NanumGothic (Bundled/Embedded)
- **Purpose**: A desktop application to generate standardized "Korean Food Labeling" in SVG format based on JSON input.

## 2. Tech Stack
- **Backend**: Go (File I/O, OS Dialogs, System Integration)
- **Frontend**: JavaScript/TypeScript (Vanilla/Framework), CSS (SVG Styling)
- **Data Formats**: 
  - **Input**: JSON (Food details)
  - **Output**: SVG (Scalable Vector Graphics)

## 3. System Architecture
### 3.1 Component Responsibilities
| Component | Responsibility | Key Features |
| :--- | :--- | :--- |
| **Frontend** | UI & Rendering | JSON parsing, SVG DOM generation, Preview, Validation |
| **Wails Bridge** | Communication | Passing XML strings from JS to Go, Triggering Save Dialogs |
| **Backend** | System Access | Writing files to disk, OS-level file selection |

## 4. Functional Requirements (FR)
- **[FR-01] Data Input**: Support uploading JSON files matching a predefined schema.
- **[FR-02] SVG Rendering**: Dynamically generate a table-style SVG based on JSON data.
- **[FR-03] Dynamic Layout**: Automatically adjust row heights based on text volume.
- **[FR-04] Standards Compliance**: Adhere to legal font sizes and line spacings for food labeling.
- **[FR-05] Preview**: Real-time display of the generated SVG within the UI.
- **[FR-06] File Export**: Save the generated SVG to the local file system via a Save Dialog.
- **[FR-07] Validation**: Provide feedback for missing mandatory fields in the JSON input.
- **[FR-08] Dynamic Table Breaking**: Automatically split the table across multiple columns or pages if it exceeds the user-defined label dimensions.
- [FR-19] Right-anchored Placeholders: Placeholder cells always stick to the far right.
- [FR-20] Legal No-Break Constraint: Support a "no-break" flag; if enabled, the cell must not be split across lines (must move to next line entirely if space is insufficient).

## 5. Technical Specifications
### 5.1 Data Schema (JSON)
```json
{
  "label_config": {
    "nutrition_mode": "bottom",
    "global_padding": 2, // mm
    "border_thickness": 0.5, // mm
    "horizontal_scale": 1.0, // 0.9 to 1.0 (장평)
    "font_family": "NanumGothic"
  },
  "main_table": {
    "width": 130, "height": 110,
    "cells": [
      { 
        "type": "info",
        "header": "제품명", 
        "content": "식초", 
        "order_locked": true,
        "no_break": true
      },
      { 
        "type": "info",
        "header": "원산지", 
        "content": "이탈리아",
        "use_whole_line": true 
      },
      { "type": "placeholder", "label": "HACCP", "width": 20, "height": 20 }
    ]
  },
  "nutrition_facts": {
    "width": 100, "height": 100,
    "cells": [
      { "header": "[[영양정보]]", "no_break": true },
      { "content": "[[총 내용량...]]", "align": "right", "use_whole_line": true },
      ...
    ]
  }
}
```
- **Main Table**: Implements "Line-based Flow". Cells wrap through horizontal lines.
- **Placeholders**: Deduct their width from the line's available space at the specific y-offset.
- **Nutrition Facts**: Uses the same cell-based engine as the Main Table, allowing for flexible grid layouts (horizontal or vertical).

### 5.2 Interface Definitions (Wails Bridge)
...

#### Backend (Go)
```go
// App struct
func (a *App) SaveSVG(content string, defaultName string) error {
    path, _ := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
        DefaultFilename: defaultName,
        Filters: []runtime.FileFilter{{DisplayName: "SVG Files (*.svg)", Pattern: "*.svg"}},
    })
    
    if path != "" {
        return os.WriteFile(path, []byte(content), 0644)
    }
    return nil
}
```

#### Frontend (JS/TS)
- `generateSVG(jsonData)`: Logic to iterate over JSON and create SVG elements (`<rect>`, `<text>`, etc.).
- `exportToBackend()`: Converts SVG DOM to XML string and calls `window.go.main.App.SaveSVG`.

### 5.3 Rendering Logic Constraints
- **Line-based Flow**: Cells are standard as flow elements. They wrap to a new line if they exceed the remaining width.
- **Header Inversion**: Headers are inverted only if wrapped in `[[ ... ]]` tags (e.g., `"header": "[[제품명]]"`). Non-wrapped headers are rendered as standard text fragments.
- **Header-less Cells**: Cells without a `header` property always start on a new line for better visual separation.
- **Whole Line Constraint**: Optional `use_whole_line: true` ensures the cell occupies the entire available line width. 
  - It forces the cell to start on a new line (if not already at the start).
  - It forces any following cells to start on a new line.
  - If the cell text wraps, each line it occupies will be stretched to the full width.
- **Alignment**: Optional `align: "left" | "center" | "right"` (default "left") controls text alignment within the cell's final stretched width.
- **Indentation**: Optional `indent: number` (mm) adds horizontal padding to the left side of the cell's content/header.
- **No-Break Constraint**: Optional `no_break: true` ensures Header and Content stay together on the same line. If the cell's estimated width + X-cursor > Available Width, the entire cell must move to the beginning of the next line.
  - **Continuity**: The *next* cell starts immediately at the end of the previous cell's content (unless restricted by breaking rules).
- **Right-anchored Placeholder Logic**:
  - Placeholder cells (e.g., certification marks) are always anchored to the **far right**.
  - While a placeholder is active for a specific Y-range, the "Available Width" for standard cells is reduced by the placeholder's width.
- **Font Scaling Algorithm**:
  - Uniform scaling (>= 10pt) across the Main Table to find the maximum possible fit.
  - Independent scaling for the Nutrition Facts container.
- **Global Styling**:
  - Universal `padding` and `border_thickness` applied from `label_config`.
  - Borders are perfectly overlapped (100% thickness overlap) to ensure that shared lines maintain the same single thickness as outer borders.
- **Horizontal Scaling (장평)**:
  - Text width is multiplied by `horizontal_scale` during measurement.
  - SVG `<text>` elements use `textLength` and `lengthAdjust="spacingAndGlyphs"` to apply the scaling visually.
  - Reduced horizontal scale naturally affects line-breaking by fitting more characters per line.
- **Legal Reference**: Conform to '식품등의 표시기준', using a **10pt** baseline.

## 6. UI/UX Requirements
- **Layout**: Split-pane view (JSON Editor vs. SVG Preview).
- **Settings**: Global configuration for font, padding, and border.
- **Validation**: Error popups when content cannot fit at 10pt.

## 7. Roadmap & Progress
- [ ] **Phase 1**: Wails v2 + Vanilla JS project initialization & basic bridge setup.
- [ ] **Phase 2**: Core Rendering Engine implementation (Line-based Flow + Float-right placeholders).
- [ ] **Phase 3**: Nutrition Facts sub-renderer and template system.
- [ ] **Phase 4**: Advanced styling (NanumGothic embedding), File Export, and Polish.
