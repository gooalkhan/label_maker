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
        const savedScale = this.config.horizontal_scale || 1.0;
        // Force 1.0 scale during optimization to prevent font growth when narrowing text
        this.config.horizontal_scale = 1.0;

        const nutritionConfig = this.nutritionFacts || { width: 0, height: 0, cells: [] };
        
        let mainWidth = this.mainTable.width || 100;
        let mainHeight = this.mainTable.height || 100;
        let nutritionX = 0, nutritionY = 0;
        let mainX = 0, mainY = 0;

        // --- PASS 1: Baseline Font Size (Forced 1.0 Scale) ---
        this.config.horizontal_scale = 1.0;
        let mainFontSize = this.findOptimalFontSize(this.mainTable.cells, mainWidth, mainHeight, 10);
        
        let nutritionFontSize = 0;
        if (nutritionConfig.cells && nutritionConfig.cells.length > 0) {
            // Force nutrition facts to use the same font size as the main table
            nutritionFontSize = mainFontSize;
        }

        // --- PASS 2: Final Flow Calculation (User Scale) ---
        this.config.horizontal_scale = savedScale;
        
        // Recalculate main layout with user scale to allow text to re-flow
        const mainLayout = this._calculateLayout(this.mainTable.cells, mainWidth, mainHeight, mainFontSize);

        let nutritionLayout = null;
        if (nutritionConfig.cells && nutritionConfig.cells.length > 0) {
            let nutrW = mode === 'bottom' ? mainWidth : (nutritionConfig.width || 100);
            let nutrH = (mode === 'left' || mode === 'right') ? mainHeight : (nutritionConfig.height || 100);
            
            // Adjust coordinates based on pass 2 main layout
            if (mode === 'bottom') {
                nutritionY = mainY + mainLayout.usedHeight;
                nutritionX = mainX;
            } else if (mode === 'left') {
                mainX = nutrW;
                nutritionX = 0;
            } else if (mode === 'right') {
                nutritionX = mainX + mainLayout.w;
            }

            nutritionLayout = this._calculateLayout(nutritionConfig.cells, nutrW, nutrH, nutritionFontSize);
        }

        // 4. Calculate Final Actual Bounds for dynamic viewport
        let actualW = mainX + mainLayout.w;
        let actualH = mainY + mainLayout.usedHeight;
        
        if (nutritionLayout) {
            actualW = Math.max(actualW, nutritionX + (nutritionLayout.w || 0));
            actualH = Math.max(actualH, nutritionY + (nutritionLayout.usedHeight || 0));
        }

        // Restore original scale BEFORE generating SVG
        this.config.horizontal_scale = savedScale;

        // 5. Generate SVG with dynamic dimensions
        const svg = this.generateSVG(mainLayout, mainFontSize, mainX, mainY, nutritionLayout, nutritionFontSize, nutritionX, nutritionY, actualW, actualH);

        return {
            svg: svg,
            overflow: mainLayout.overflow || (nutritionLayout ? nutritionLayout.overflow : false),
            mainFontSize: mainFontSize,
            nutritionFontSize: nutritionFontSize,
            actualWidth: actualW,
            actualHeight: actualH
        };
    }

    findOptimalFontSize(cells, w, h, minSize) {
        for (let size = 20; size >= minSize; size -= 0.2) {
            const layout = this._calculateLayout(cells, w, h, size);
            if (!layout.overflow) return size;
        }
        return minSize;
    }

    _calculateLayout(cells, w, h, fontSize) {
        const padding = this.config.global_padding || 2;
        const cellPadding = this.config.cell_padding || 0;
        const totalWidth = w;
        const totalHeight = h;

        let currentX = padding;
        let currentY = padding;
        let lineHeight = 0;
        const layoutCells = [];
        const placedPlaceholders = [];
        let overflow = false;

        const getRightLimit = (y, height) => {
            let limit = totalWidth - padding;
            for (const p of placedPlaceholders) {
                const lineBottom = y + height;
                const pBottom = p.y + p.height;
                if (Math.max(y, p.y) < Math.min(lineBottom, pBottom)) {
                    limit = Math.min(limit, p.x);
                }
            }
            return limit;
        };

        const fillLastLine = () => {
            const currentLineCells = layoutCells.filter(c => Math.abs(c.y - currentY) < 0.001);
            if (currentLineCells.length === 0) return;
            const limit = getRightLimit(currentY, lineHeight || currentLineCells[0].height);
            const uniqueXStarts = [...new Set(currentLineCells.map(c => c.x))].sort((a, b) => a - b);
            for (let i = 0; i < uniqueXStarts.length; i++) {
                const x = uniqueXStarts[i];
                const nextX = (i < uniqueXStarts.length - 1) ? uniqueXStarts[i + 1] : limit;
                const newW = nextX - x;
                currentLineCells.filter(c => c.x === x).forEach(c => { c.width = newW; });
            }
        };

        const wrap = () => {
            fillLastLine();
            currentY += (lineHeight > 0 ? lineHeight : 0);
            currentX = padding;
            lineHeight = 0;
        };

        let cellIdx = 0;
        for (const cell of cells) {
            if (cell.type === 'placeholder') {
                const pWidth = cell.width || 20;
                const pHeight = cell.height || 20;
                const pX = totalWidth - padding - pWidth;
                const pY = currentY;
                placedPlaceholders.push({ x: pX, y: pY, width: pWidth, height: pHeight, label: cell.label });
                cellIdx++;
                continue;
            }

            if ((cell.use_whole_line || !cell.header) && currentX > padding) {
                wrap();
            }

            const fullText = (cell.header && cell.content) ? `${cell.header} ${cell.content}` : (cell.header || cell.content || '');
            const fragments = this.parseFragments(fullText);

            const drawPaddingLeft = cell.indent ? (cell.indent + cellPadding) : cellPadding;

            if (cell.no_break) {
                const cellFragments = [];
                let totalCellW = 0;
                let maxTextHeight = 0;
                for (const frag of fragments) {
                    const size = this.measureText(frag.text, fontSize);
                    const fragW = size.width + (cellPadding * 2);
                    cellFragments.push({ text: frag.text, width: fragW, textW: size.width, height: size.height, invert: frag.invert });
                    totalCellW += fragW;
                    maxTextHeight = Math.max(maxTextHeight, size.height);
                }
                const cellH = maxTextHeight + (cellPadding * 2);
                let limit = getRightLimit(currentY, cellH);
                if (currentX + totalCellW > limit && currentX > padding) {
                    wrap();
                    limit = getRightLimit(currentY, cellH);
                }
                let appliedScale = this.config.horizontal_scale || 1.0;
                const availableW = limit - currentX;
                if (totalCellW > availableW) {
                    const globalScale = this.config.horizontal_scale || 1.0;
                    const fitRatio = availableW / totalCellW;
                    appliedScale = Math.max(0.9, globalScale * fitRatio);
                    const adjustRatio = appliedScale / globalScale;
                    totalCellW *= adjustRatio;
                    for (const cf of cellFragments) { cf.width *= adjustRatio; cf.textW *= adjustRatio; }
                }
                let drawX = currentX;
                for (const cf of cellFragments) {
                    layoutCells.push({
                        x: currentX, fragX: drawX, textX: drawX + drawPaddingLeft, y: currentY,
                        width: totalCellW, fragWidth: cf.width, textWidth: cf.textW, height: cellH, textHeight: cf.height,
                        text: cf.text, invert: cf.invert, isGroup: true, padding: cellPadding, paddingLeft: drawPaddingLeft,
                        scale: appliedScale, cellIdx: cellIdx, align: cell.align || 'left'
                    });
                    drawX += cf.width;
                }
                currentX += totalCellW;
                lineHeight = Math.max(lineHeight, cellH);
            } else {
                let allWords = [];
                for (const frag of fragments) {
                    const words = frag.text.split(' ');
                    words.forEach((w, idx) => {
                        allWords.push({ text: w + (idx === words.length - 1 ? '' : ' '), invert: frag.invert });
                    });
                }
                while (allWords.length > 0) {
                    let count = 0, lastFitW = 0, lastFitH = 0;
                    let currentFragInvert = allWords[0].invert;
                    for (let j = 1; j <= allWords.length; j++) {
                        if (allWords[j - 1].invert !== currentFragInvert) break;
                        const subText = allWords.slice(0, j).map(w => w.text).join('');
                        const size = this.measureText(subText, fontSize);
                        const testW = size.width + (cellPadding * 2);
                        const testH = size.height + (cellPadding * 2);
                        const limit = getRightLimit(currentY, testH);
                        if (currentX + testW > limit) {
                            if (currentX > padding || j > 1) break;
                            count = 1; lastFitW = testW; lastFitH = testH; break;
                        }
                        count = j; lastFitW = testW; lastFitH = testH;
                    }
                    if (count === 0) {
                        wrap();
                        if (currentY + (fontSize * 0.3528) > totalHeight - padding) { overflow = true; break; }
                        continue;
                    }
                    const fitText = allWords.slice(0, count).map(w => w.text).join('');
                    const textWidth = lastFitW - (cellPadding * 2);
                    layoutCells.push({
                        x: currentX, y: currentY, width: lastFitW, height: lastFitH,
                        textHeight: lastFitH - (cellPadding * 2), textWidth: textWidth,
                        text: fitText, invert: currentFragInvert, padding: cellPadding, paddingLeft: drawPaddingLeft,
                        scale: this.config.horizontal_scale || 1.0, cellIdx: cellIdx, align: cell.align || 'left'
                    });
                    currentX += lastFitW;
                    lineHeight = Math.max(lineHeight, lastFitH);
                    allWords = allWords.slice(count);
                    if (currentY + lineHeight > totalHeight - padding) { overflow = true; break; }
                }
            }
            if (overflow) break;
            if (cell.use_whole_line) wrap();
            cellIdx++;
        }
        wrap(); // Final wrap to fill last line
        return { cells: layoutCells, placeholders: placedPlaceholders, overflow, w, h, usedHeight: currentY + padding };
    }

    generateSVG(mainLayout, mainFS, mX, mY, nutritionLayout, nutrFS, nX, nY, actualW, actualH) {
        const totalW = actualW;
        const totalH = actualH;
        const border = this.config.border_thickness;
        
        let svg = `<svg width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="background: white;">`;
        
        const renderTable = (layout, fs, x, y) => {
            if (!layout) return '';
            let group = `<g transform="translate(${x}, ${y})">`;
            group += `<rect x="0" y="0" width="${layout.w}" height="${layout.usedHeight}" fill="white" stroke="black" stroke-width="${border}"/>`;
            const lines = {};
            for (const c of layout.cells) {
                const yKey = c.y.toFixed(4);
                if (!lines[yKey]) lines[yKey] = { cells: [], maxH: 0 };
                lines[yKey].cells.push(c);
                lines[yKey].maxH = Math.max(lines[yKey].maxH, c.height);
            }

            for (const yKey in lines) {
                const line = lines[yKey];
                
                // Group cells by cellIdx to handle multi-fragment alignment (no_break)
                const cellsByIdx = {};
                for (const c of line.cells) {
                    if (!cellsByIdx[c.cellIdx]) {
                        cellsByIdx[c.cellIdx] = {
                            cells: [],
                            minX: Infinity,
                            maxX: -Infinity,
                            x: c.x,
                            align: c.align
                        };
                    }
                    cellsByIdx[c.cellIdx].cells.push(c);
                    
                    // Natural content bounds (for shifting)
                    const fx = c.isGroup ? c.fragX : c.x;
                    const fw = c.isGroup ? c.fragWidth : c.width;
                    
                    // Stretched logical bounds (for borders)
                    const sx = c.x;
                    const sw = c.width;
                    
                    if (!cellsByIdx[c.cellIdx].contentMinX) {
                        cellsByIdx[c.cellIdx].contentMinX = Infinity;
                        cellsByIdx[c.cellIdx].contentMaxX = -Infinity;
                    }
                    
                    cellsByIdx[c.cellIdx].contentMinX = Math.min(cellsByIdx[c.cellIdx].contentMinX, fx);
                    cellsByIdx[c.cellIdx].contentMaxX = Math.max(cellsByIdx[c.cellIdx].contentMaxX, fx + fw);
                    
                    cellsByIdx[c.cellIdx].minX = Math.min(cellsByIdx[c.cellIdx].minX, sx);
                    cellsByIdx[c.cellIdx].maxX = Math.max(cellsByIdx[c.cellIdx].maxX, sx + sw);
                }

                for (const idx in cellsByIdx) {
                    const groupData = cellsByIdx[idx];
                    const contentW = groupData.contentMaxX - groupData.contentMinX;
                    
                    // Effective stretched width of the entire logical cell
                    const effectiveW = groupData.maxX - groupData.minX;
                    
                    let shiftX = 0;
                    if (groupData.align === 'right') shiftX = effectiveW - contentW;
                    else if (groupData.align === 'center') shiftX = (effectiveW - contentW) / 2;

                    for (const c of groupData.cells) {
                        const drawPadding = c.padding || this.config.cell_padding || 0;
                        const drawPaddingLeft = c.paddingLeft || drawPadding;
                        
                        // 1. Render Inversion Background
                        if (c.invert) {
                            // If this logical cell contains ONLY inverted content, fill the entire area
                            const isOnlyFrag = (groupData.cells.length === 1);
                            const fillX = isOnlyFrag ? groupData.x : ((c.isGroup ? c.fragX : c.x) + shiftX);
                            const fillW = isOnlyFrag ? effectiveW : (c.isGroup ? c.fragWidth : c.width);
                            
                            group += `<rect x="${fillX}" y="${c.y}" width="${fillW}" height="${line.maxH}" fill="black"/>`;
                        }

                        // 2. Render Cell Borders
                        const topTouch = layout.cells.some(other => other.cellIdx === c.cellIdx && Math.abs(other.y + other.height - c.y) < 0.001 && Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width));
                        const bottomTouch = layout.cells.some(other => other.cellIdx === c.cellIdx && Math.abs(c.y + line.maxH - other.y) < 0.001 && Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width));
                        
                        const x1 = groupData.x;
                        const x2 = groupData.x + effectiveW;
                        
                        // We only draw borders once per cellIdx to avoid overlap in fragments
                        if (c === groupData.cells[0]) {
                            const stroke = `stroke="black" stroke-width="${border}"`;
                            const y1 = c.y, y2 = c.y + line.maxH;
                            group += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" ${stroke}/>`;
                            group += `<line x1="${x2}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                            if (!topTouch) group += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" ${stroke}/>`;
                            if (!bottomTouch) group += `<line x1="${x1}" y1="${y2}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                        }

                        // 3. Render Text
                        const centerY = c.y + (line.maxH / 2);
                        let textX = (c.isGroup ? c.textX : c.x + drawPaddingLeft) + shiftX;
                        const textColor = c.invert ? 'white' : 'black';
                        
                        const finalScale = (c.scale || 1.0);
                        const textLengthAttr = finalScale !== 1.0 ? ` textLength="${c.textWidth}" lengthAdjust="spacingAndGlyphs"` : "";
                        
                        group += `<text x="${textX}" y="${centerY}" font-family="Nanum Gothic" font-size="${fs * 0.3528}" fill="${textColor}" dominant-baseline="central"${textLengthAttr} xml:space="preserve">${c.text}</text>`;
                    }
                }
            }
            for (const p of layout.placeholders) {
                if (p.label) {
                    const labelFs = 2;
                    const centerY = p.y + (p.height / 2);
                    group += `<text x="${p.x + 2}" y="${centerY}" font-family="Nanum Gothic" font-size="${labelFs}" fill="#888" dominant-baseline="central" xml:space="preserve">${p.label}</text>`;
                }
            }
            group += `</g>`;
            return group;
        };

        // 2. Render Tables
        svg += renderTable(mainLayout, mainFS, mX, mY);
        if (nutritionLayout) svg += renderTable(nutritionLayout, nutrFS, nX, nY);

        svg += `</svg>`;
        return svg;
    }
}