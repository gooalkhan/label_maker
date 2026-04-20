/**
 * Renderer class for the Food Labeling SVG Generator.
 * Implements Line-based Flow with right-anchored placeholders and font maximization.
 */
export class Renderer {
    constructor(data) {
        this.data = data;
        this.config = data.label_config;
        this.mainTable = data.main_table;
        this.nutritionFacts = data.nutrition_facts;

        // Canvas for pre-measurement
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Units conversion (assuming 1mm = 3.7795px at 96 DPI)
        this.mmToPx = 3.7795;
    }

    parseFragments(text) {
        const parts = [];
        const regex = /\[\[(.*?)\]\]/gs;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ text: text.substring(lastIndex, match.index), invert: false });
            }
            parts.push({ text: match[1], invert: true });
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push({ text: text.substring(lastIndex), invert: false });
        }
        return parts;
    }

    measureText(text, fontSize) {
        // Use px for more standard canvas measurement (1pt = 1.333px)
        const fontSizePx = fontSize * 1.333;
        this.ctx.font = `${fontSizePx}px "Nanum Gothic", sans-serif`;
        const metrics = this.ctx.measureText(text);
        const scale = this.config.horizontal_scale || 1.0;

        let width = (metrics.width / this.mmToPx) * scale;

        // Fallback: If measurement returns 0 (font load issue), estimate width based on character count
        if (width <= 0 && text.length > 0) {
            console.warn(`Measurement failed for text: "${text}". Using fallback width.`);
            width = text.length * (fontSize * 0.3528 * 0.5); // Approx 0.5 aspect ratio
        }

        return {
            width: width,
            height: fontSize * 0.3528 // pt to mm conversion
        };
    }

    render() {
        const mode = this.config.nutrition_mode || 'bottom';

        // 1. Calculate Main Table Bounds
        let mainWidth = this.config.width;
        let mainHeight = this.config.height;
        let nutritionX = 0, nutritionY = 0;
        let mainX = 0, mainY = 0;

        if (mode === 'bottom') {
            mainHeight = this.config.height - (this.nutritionFacts.height || 0);
            nutritionY = mainHeight;
        } else if (mode === 'left') {
            mainWidth = this.config.width - (this.nutritionFacts.width || 0);
            mainX = (this.nutritionFacts.width || 0);
        } else if (mode === 'right') {
            mainWidth = this.config.width - (this.nutritionFacts.width || 0);
            nutritionX = mainWidth;
        }

        // 2. Find optimal font size for Main Table
        let mainFontSize = this.findOptimalFontSize(mainWidth, mainHeight);
        const mainLayout = this.calculateLayout(mainWidth, mainHeight, mainFontSize);

        // 3. Find optimal font size for Nutrition Facts
        let nutritionFontSize = this.findOptimalNutritionFontSize(this.nutritionFacts.width, this.nutritionFacts.height);
        const nutritionLayout = this.calculateNutritionLayout(this.nutritionFacts.width, this.nutritionFacts.height, nutritionFontSize);

        // 4. Generate SVG
        const svg = this.generateSVG(mainLayout, mainFontSize, mainX, mainY, nutritionLayout, nutritionFontSize, nutritionX, nutritionY);

        return {
            svg: svg,
            overflow: mainLayout.overflow || nutritionLayout.overflow,
            mainFontSize: mainFontSize,
            nutritionFontSize: nutritionFontSize
        };
    }

    findOptimalFontSize(w, h) {
        for (let size = 20; size >= 10; size -= 0.2) {
            const layout = this.calculateLayout(w, h, size);
            if (!layout.overflow) return size;
        }
        return 10;
    }

    findOptimalNutritionFontSize(w, h) {
        for (let size = 20; size >= 6; size -= 0.2) { // Nutrition can go smaller if needed, but we'll try to keep it large
            const layout = this.calculateNutritionLayout(w, h, size);
            if (!layout.overflow) return size;
        }
        return 6;
    }

    calculateLayout(w, h, fontSize) {
        const padding = this.config.global_padding || 2;
        const cellPadding = this.config.cell_padding || 0;
        const border = this.config.border_thickness || 0.5;
        const totalWidth = w;
        const totalHeight = h;

        let currentX = padding;
        let currentY = padding;
        let lineHeight = 0;
        const layoutCells = [];
        const placedPlaceholders = [];
        let overflow = false;

        // Helper to get available width at a specific y-range
        const getRightLimit = (y, height) => {
            let limit = totalWidth - padding;
            for (const p of placedPlaceholders) {
                // Check for vertical overlap between line and placeholder
                const lineBottom = y + height;
                const pBottom = p.y + p.height;
                if (Math.max(y, p.y) < Math.min(lineBottom, pBottom)) {
                    // Reduce limit by placeholder width and a small margin
                    limit = Math.min(limit, p.x);
                }
            }
            return limit;
        };

        const fillLastLine = () => {
            const currentLineCells = layoutCells.filter(c => Math.abs(c.y - currentY) < 0.001);
            if (currentLineCells.length === 0) return;

            const limit = getRightLimit(currentY, lineHeight || currentLineCells[0].height);
            
            // 1. Identify unique cell starting positions (x) on this line and sort them left-to-right
            const uniqueXStarts = [...new Set(currentLineCells.map(c => c.x))].sort((a, b) => a - b);
            
            for (let i = 0; i < uniqueXStarts.length; i++) {
                const x = uniqueXStarts[i];
                // Next cell starts at the next unique X, or if this is the last cell, at the line limit.
                const nextX = (i < uniqueXStarts.length - 1) ? uniqueXStarts[i+1] : limit;
                const newW = nextX - x;
                
                // Update the width of all fragments (headers, content, etc.) that belong to this logical cell x-position
                currentLineCells.filter(c => c.x === x).forEach(c => {
                    c.width = newW;
                });
            }
        };

        const wrap = () => {
            fillLastLine();
            currentY += (lineHeight > 0 ? lineHeight : 0);
            currentX = padding;
            lineHeight = 0;
        };

        let cellIdx = 0;
        for (const cell of this.mainTable.cells) {
            if (cell.type === 'placeholder') {
                const pWidth = cell.width || 20;
                const pHeight = cell.height || 20;
                const pX = totalWidth - padding - pWidth;
                const pY = currentY;
                placedPlaceholders.push({ x: pX, y: pY, width: pWidth, height: pHeight, label: cell.label });
                cellIdx++;
                continue;
            }

            // If no header, force start on a new line
            if (!cell.header && currentX > padding) {
                wrap();
            }

            // Automatic Header Inversion: Wrap headers in [[ ... ]]
            const headerStr = cell.header ? `[[${cell.header}]] ` : '';
            const contentStr = cell.content || '';
            const fullText = headerStr + contentStr;
            const fragments = this.parseFragments(fullText);

            if (cell.no_break) {
                // For no_break, we measure all fragments together
                const cellFragments = [];
                let totalCellW = 0;
                let maxTextHeight = 0;
                
                for (const frag of fragments) {
                    const size = this.measureText(frag.text, fontSize);
                    const fragW = size.width + (cellPadding * 2);
                    cellFragments.push({ 
                        text: frag.text, 
                        width: fragW, 
                        textW: size.width,
                        height: size.height, 
                        invert: frag.invert 
                    });
                    totalCellW += fragW;
                    maxTextHeight = Math.max(maxTextHeight, size.height);
                }

                const cellH = maxTextHeight + (cellPadding * 2);

                let limit = getRightLimit(currentY, cellH);
                if (currentX + totalCellW > limit && currentX > padding) {
                    wrap();
                    limit = getRightLimit(currentY, cellH);
                }

                // Auto-Compress: If no_break cell exceeds line width, squeeze it (min 90%)
                let appliedScale = this.config.horizontal_scale || 1.0;
                const availableW = limit - currentX;
                if (totalCellW > availableW) {
                    const globalScale = this.config.horizontal_scale || 1.0;
                    const fitRatio = availableW / totalCellW;
                    const neededScale = globalScale * fitRatio;
                    appliedScale = Math.max(0.9, neededScale);
                    const adjustRatio = appliedScale / globalScale;
                    
                    // Adjust widths
                    totalCellW *= adjustRatio;
                    for (const cf of cellFragments) {
                        cf.width *= adjustRatio;
                        cf.textW *= adjustRatio;
                    }
                }

                let drawX = currentX;
                for (const cf of cellFragments) {
                    layoutCells.push({ 
                        x: currentX, // Cell start
                        fragX: drawX, // Individual fragment start
                        textX: drawX + cellPadding, 
                        y: currentY, 
                        width: totalCellW, // Total shared cell box width
                        fragWidth: cf.width, // Individual fragment box width
                        textWidth: cf.textW,
                        height: cellH, 
                        textHeight: cf.height,
                        text: cf.text, 
                        invert: cf.invert,
                        isGroup: true,
                        padding: cellPadding,
                        scale: appliedScale,
                        cellIdx: cellIdx
                    });
                    drawX += cf.width;
                }
                currentX += totalCellW; 
                lineHeight = Math.max(lineHeight, cellH);
            } else {
                // Unified word-flow for non-breaking cells across fragments
                let allWords = [];
                for (const frag of fragments) {
                    const words = frag.text.split(' ');
                    words.forEach((w, idx) => {
                        allWords.push({ 
                            text: w + (idx === words.length - 1 ? '' : ' '), 
                            invert: frag.invert 
                        });
                    });
                }

                while (allWords.length > 0) {
                    let count = 0;
                    let lastFitW = 0;
                    let lastFitH = 0;
                    let currentFragInvert = allWords[0].invert;

                    for (let j = 1; j <= allWords.length; j++) {
                        // We group words as long as they have the same inversion AND they fit on the line
                        if (allWords[j-1].invert !== currentFragInvert) break;

                        const subText = allWords.slice(0, j).map(w => w.text).join('');
                        const size = this.measureText(subText, fontSize);
                        const testW = size.width + (cellPadding * 2);
                        const testH = size.height + (cellPadding * 2);
                        const limit = getRightLimit(currentY, testH);

                        if (currentX + testW > limit) {
                            if (currentX > padding || j > 1) {
                                break;
                            }
                            // Start of line AND first word: fit at least this word and break
                            count = 1;
                            lastFitW = testW;
                            lastFitH = testH;
                            break;
                        }

                        count = j;
                        lastFitW = testW;
                        lastFitH = testH;
                    }

                    if (count === 0) {
                        wrap();
                        if (currentY + (fontSize * 0.3528) > totalHeight - padding) { overflow = true; break; }
                        continue;
                    }

                    const fitText = allWords.slice(0, count).map(w => w.text).join('');
                    const textWidth = lastFitW - (cellPadding * 2);
                    layoutCells.push({ 
                        x: currentX, 
                        y: currentY, 
                        width: lastFitW, 
                        height: lastFitH, 
                        textHeight: lastFitH - (cellPadding * 2), 
                        textWidth: textWidth,
                        text: fitText, 
                        invert: currentFragInvert,
                        padding: cellPadding,
                        scale: this.config.horizontal_scale || 1.0,
                        cellIdx: cellIdx
                    });
                    currentX += lastFitW;
                    lineHeight = Math.max(lineHeight, lastFitH);
                    allWords = allWords.slice(count);

                    if (currentY + lineHeight > totalHeight - padding) { overflow = true; break; }
                }
                // Removed horizontal gap between cells
            }

            if (overflow) break;
            cellIdx++;
        }

        fillLastLine();

        return { cells: layoutCells, placeholders: placedPlaceholders, overflow, w, h };
    }

    calculateNutritionLayout(w, h, fontSize) {
        const padding = this.config.global_padding || 2;
        const entries = Object.entries(this.nutritionFacts.data.entries || {});
        const layoutEntries = [];
        let currentY = padding + 5; // Start below "영양성분" title
        let overflow = false;

        for (const [name, value] of entries) {
            const lineText = `${name}: ${value}`;
            const size = this.measureText(lineText, fontSize);
            layoutEntries.push({ x: padding, y: currentY, text: lineText, height: size.height });
            currentY += size.height;
            if (currentY > h - padding) { overflow = true; break; }
        }
        return { entries: layoutEntries, overflow, w, h };
    }

    generateSVG(mainLayout, mainFS, mX, mY, nutritionLayout, nutrFS, nX, nY) {
        const totalW = this.config.width;
        const totalH = this.config.height;
        const border = this.config.border_thickness;

        let svg = `<svg width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="background: white;">`;

        // Render Main Table
        svg += `<g transform="translate(${mX}, ${mY})">`;
        svg += `<rect x="0" y="0" width="${mainLayout.w}" height="${mainLayout.h}" fill="white" stroke="black" stroke-width="${border}"/>`;

        // Group cells by line to handle consistent background rectangles
        const lines = {};
        for (const c of mainLayout.cells) {
            const yKey = c.y.toFixed(4);
            if (!lines[yKey]) lines[yKey] = { cells: [], maxH: 0 };
            lines[yKey].cells.push(c);
            lines[yKey].maxH = Math.max(lines[yKey].maxH, c.height);
        }

        for (const yKey in lines) {
            const line = lines[yKey];
            let lastInX = -1; // To avoid drawing multiple outline boxes for grouped cells
            for (const c of line.cells) {
                const drawPadding = c.padding || this.config.cell_padding || 0;
                
                // 1. Draw individual background fill if inverted
                if (c.invert) {
                    const fillX = c.isGroup ? c.fragX : c.x;
                    const fillW = c.isGroup ? c.fragWidth : c.width;
                    svg += `<rect x="${fillX}" y="${c.y}" width="${fillW}" height="${line.maxH}" fill="black"/>`;
                }

                // 2. Draw Borders selectively to merge multi-line cells
                const topTouch = mainLayout.cells.some(other => 
                    other.cellIdx === c.cellIdx && 
                    Math.abs(other.y + other.height - c.y) < 0.001 &&
                    Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width)
                );
                const bottomTouch = mainLayout.cells.some(other => 
                    other.cellIdx === c.cellIdx && 
                    Math.abs(c.y + line.maxH - other.y) < 0.001 &&
                    Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width)
                );

                const x1 = c.x, y1 = c.y, x2 = c.x + c.width, y2 = c.y + line.maxH;
                const stroke = `stroke="black" stroke-width="${border}"`;
                
                // Left & Right borders are almost always drawn
                svg += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" ${stroke}/>`;
                svg += `<line x1="${x2}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                
                // Top border only if NOT touching same cell above
                if (!topTouch) {
                    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" ${stroke}/>`;
                }
                // Bottom border only if NOT touching same cell below
                if (!bottomTouch) {
                    svg += `<line x1="${x1}" y1="${y2}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                }

                // 3. Draw text inside the box
                const textX = c.isGroup ? c.textX : c.x + drawPadding;
                const textY = c.y + (line.maxH - c.textHeight) / 2 + c.textHeight; // Vertically center within line height
                const textColor = c.invert ? 'white' : 'black';
                
                const textWidth = c.isGroup ? c.textWidth : c.textWidth; // same property name now
                const scale = c.scale || this.config.horizontal_scale || 1.0;

                // Only apply textLength if horizontal_scale is not 1.0 to keep SVG clean
                const textLengthAttr = scale !== 1.0 ? ` textLength="${textWidth}" lengthAdjust="spacingAndGlyphs"` : "";

                svg += `<text x="${textX}" y="${textY}" font-family="Nanum Gothic" font-size="${mainFS * 0.3528}" fill="${textColor}"${textLengthAttr}>${c.text}</text>`;
            }
        }
        for (const p of mainLayout.placeholders) {
            svg += `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="none" stroke="black" stroke-dasharray="2"/>`;
            if (p.label) {
                svg += `<text x="${p.x + 2}" y="${p.y + 5}" font-family="Nanum Gothic" font-size="2">${p.label}</text>`;
            }
        }
        svg += `</g>`;

        // Render Nutrition Facts
        svg += `<g transform="translate(${nX}, ${nY})">`;
        svg += `<rect x="0" y="0" width="${nutritionLayout.w}" height="${nutritionLayout.h}" fill="white" stroke="black" stroke-width="${border}"/>`;
        // Invert the Nutrition Facts title as well for consistency
        const titleText = "영양성분";
        const titleSize = this.measureText(titleText, 8.5); // approx 3mm in pt terms
        svg += `<rect x="${this.config.global_padding}" y="${this.config.global_padding}" width="${titleSize.width + 1}" height="${titleSize.height + 1}" fill="black"/>`;
        svg += `<text x="${this.config.global_padding + 0.5}" y="${this.config.global_padding + titleSize.height}" font-family="Nanum Gothic" font-weight="bold" font-size="3" fill="white">${titleText}</text>`;
        for (const e of nutritionLayout.entries) {
            const scale = this.config.horizontal_scale || 1.0;
            const textWidth = this.measureText(e.text, nutrFS).width;
            const textLengthAttr = scale !== 1.0 ? ` textLength="${textWidth}" lengthAdjust="spacingAndGlyphs"` : "";
            svg += `<text x="${e.x}" y="${e.y + e.height}" font-family="Nanum Gothic" font-size="${nutrFS * 0.3528}"${textLengthAttr}>${e.text}</text>`;
        }
        svg += `</g>`;

        svg += `</svg>`;
        return svg;
    }
}
