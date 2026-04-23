/**
 * Constants for the Renderer
 */
const CONSTANTS = {
    MM_TO_PX: 3.7795,
    PT_TO_PX: 1.333,
    PT_TO_MM: 0.3528,
    FONT_FAMILY: "Nanum Gothic",
    MIN_OPTIMAL_FONT_SIZE: 10,
    DEFAULT_PLACEHOLDER_SIZE: 20
};

/**
 * Parses raw string with markup into fragments
 */
class Parser {
    static parse(text) {
        const parts = [];
        const regex = /(\[\[.*?\]\]|\{\{.*?\}\})/gs;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ text: text.substring(lastIndex, match.index), invert: false, enforceMinSize: false });
            }
            const token = match[1];
            if (token.startsWith('[[')) {
                parts.push({ text: token.substring(2, token.length - 2), invert: true, enforceMinSize: false });
            } else {
                parts.push({ text: token.substring(2, token.length - 2), invert: false, enforceMinSize: true });
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push({ text: text.substring(lastIndex), invert: false, enforceMinSize: false });
        }
        return parts;
    }
}

/**
 * Handles Canvas-based text measurement
 */
class Measurer {
    constructor() {
        this.ctx = document.createElement('canvas').getContext('2d');
    }

    /**
     * Measures the width and height of text in mm.
     * @param {string} text - The text to measure.
     * @param {number} fontSize - Font size in points.
     * @param {number} globalScale - Horizontal scale factor (장평).
     * @returns {{width: number, height: number}} Dimensions in mm.
     */
    measure(text, fontSize, globalScale = 1.0) {
        this.ctx.save();
        const fontSizePx = fontSize * CONSTANTS.PT_TO_PX;
        this.ctx.font = `${fontSizePx}px "${CONSTANTS.FONT_FAMILY}", sans-serif`;
        
        const metrics = this.ctx.measureText(text);
        let width = (metrics.width / CONSTANTS.MM_TO_PX) * globalScale;

        // Fallback for zero-width due to missing font loading
        if (width <= 0 && text.length > 0) {
            width = text.length * (fontSize * CONSTANTS.PT_TO_MM * 0.5); 
        }
        
        this.ctx.restore();

        return {
            width: width,
            height: fontSize * CONSTANTS.PT_TO_MM
        };
    }
}

/**
 * Calculates (x,y) coordinates for cells and wraps text based on layout rules
 */
class LayoutEngine {
    constructor(config, measurer) {
        this.config = config;
        this.measurer = measurer;
    }

    _createFullBlock(y, w, padding) {
        return { type: 'full', x: padding, y: y, w: w - padding * 2, maxH: Infinity, h: 0, lines: [] };
    }

    _createSplitBlock(y, w, padding, pW, pH, pLabel, position) {
        const type = position === 'left' ? 'split-left' : 'split-right';
        const x = position === 'left' ? padding + pW : padding;
        return { type: type, x: x, y: y, w: w - padding * 2 - pW, maxH: pH, h: 0, lines: [], pW, pLabel };
    }

    /**
     * Calculates the layout for a given set of cells.
     */
    calculate(cells, w, h, fontSize) {
        const padding = this.config.global_padding || 2;
        const cellPadding = this.config.cell_padding || 0;
        const totalWidth = w;
        
        let currentY = padding;
        let blocks = [];
        let activeBlock = this._createFullBlock(currentY, totalWidth, padding);
        let currentLine = { h: 0, fragments: [], w: 0 };
        let overflow = false;

        const isSplitBlock = (block) => block.type === 'split-left' || block.type === 'split-right';

        const pushLineToBlock = () => {
            if (currentLine.fragments.length === 0) return;

            if (isSplitBlock(activeBlock) && activeBlock.h >= activeBlock.maxH) {
                activeBlock.actualH = Math.max(activeBlock.maxH, activeBlock.h);
                blocks.push(activeBlock);
                currentY = activeBlock.y + activeBlock.actualH;
                activeBlock = this._createFullBlock(currentY, totalWidth, padding);
            }

            const lineY = activeBlock.y + activeBlock.h;
            for(let f of currentLine.fragments) {
                f.y = lineY;
            }

            activeBlock.lines.push(currentLine);
            activeBlock.h += currentLine.h;
            
            if (activeBlock.y + activeBlock.h > h - padding) {
                overflow = true;
            }

            currentLine = { h: 0, fragments: [], w: 0 };
        };

        const pushActiveBlock = () => {
            if (currentLine.fragments.length > 0) pushLineToBlock();
            if (activeBlock.lines.length > 0 || isSplitBlock(activeBlock)) {
                if (isSplitBlock(activeBlock)) {
                    activeBlock.actualH = Math.max(activeBlock.maxH, activeBlock.h);
                } else {
                    activeBlock.actualH = activeBlock.h;
                }
                blocks.push(activeBlock);
                currentY = activeBlock.y + activeBlock.actualH;
            }
        };

        let cellIdx = 0;
        for (const cell of cells) {
            if (cell.type === 'placeholder') {
                pushActiveBlock();
                const pWidth = cell.width || CONSTANTS.DEFAULT_PLACEHOLDER_SIZE;
                const pHeight = cell.height || CONSTANTS.DEFAULT_PLACEHOLDER_SIZE;
                const pPosition = cell.position || cell.align || 'right'; // Default to right
                activeBlock = this._createSplitBlock(currentY, totalWidth, padding, pWidth, pHeight, cell.label, pPosition);
                cellIdx++;
                continue;
            }

            if ((cell.use_whole_line || !cell.header) && currentLine.fragments.length > 0) {
                pushLineToBlock();
            }

            const fullText = (cell.header && cell.content) ? `${cell.header} ${cell.content}` : (cell.header || cell.content || '');
            const fragments = Parser.parse(fullText);
            const drawPaddingLeft = cell.indent ? (cell.indent + cellPadding) : cellPadding;

            if (cell.no_break) {
                const cellFragments = [];
                let totalCellW = 0;
                let maxTextHeight = 0;
                
                for (const frag of fragments) {
                    const fragFontSize = frag.enforceMinSize ? Math.max(fontSize, 12) : fontSize;
                    const size = this.measurer.measure(frag.text, fragFontSize, this.config.horizontal_scale);
                    const fragW = size.width + (cellPadding * 2);
                    cellFragments.push({ text: frag.text, width: fragW, textW: size.width, height: size.height, invert: frag.invert, fs: fragFontSize });
                    totalCellW += fragW;
                    maxTextHeight = Math.max(maxTextHeight, size.height);
                }
                
                const cellH = maxTextHeight + (cellPadding * 2);
                
                if (currentLine.w + totalCellW > activeBlock.w && currentLine.fragments.length > 0) {
                    pushLineToBlock();
                }

                let appliedScale = this.config.horizontal_scale || 1.0;
                const availableW = activeBlock.w - currentLine.w;
                if (totalCellW > availableW) {
                    const globalScale = this.config.horizontal_scale || 1.0;
                    const fitRatio = availableW / totalCellW;
                    appliedScale = Math.max(0.9, globalScale * fitRatio);
                    const adjustRatio = appliedScale / globalScale;
                    totalCellW *= adjustRatio;
                    for (const cf of cellFragments) { cf.width *= adjustRatio; cf.textW *= adjustRatio; }
                }

                let drawXOffset = currentLine.w;
                for (const cf of cellFragments) {
                    currentLine.fragments.push({
                        offsetX: currentLine.w, 
                        fragOffsetX: drawXOffset,
                        width: totalCellW, 
                        fragWidth: cf.width, 
                        textWidth: cf.textW, 
                        height: cellH, 
                        textHeight: cf.height,
                        text: cf.text, invert: cf.invert, fs: cf.fs, isGroup: true, 
                        padding: cellPadding, paddingLeft: drawPaddingLeft,
                        scale: appliedScale, cellIdx: cellIdx, align: cell.align || 'left'
                    });
                    drawXOffset += cf.width;
                }
                currentLine.w += totalCellW;
                currentLine.h = Math.max(currentLine.h, cellH);

            } else {
                let allWords = [];
                for (const frag of fragments) {
                    const fragFontSize = frag.enforceMinSize ? Math.max(fontSize, 12) : fontSize;
                    const words = frag.text.split(' ');
                    words.forEach((w, idx) => {
                        allWords.push({ text: w + (idx === words.length - 1 ? '' : ' '), invert: frag.invert, fs: fragFontSize });
                    });
                }
                
                while (allWords.length > 0) {
                    let count = 0, lastFitW = 0, lastFitH = 0;
                    let currentFragInvert = allWords[0].invert;
                    let currentFragFs = allWords[0].fs;

                    for (let j = 1; j <= allWords.length; j++) {
                        if (allWords[j - 1].invert !== currentFragInvert || allWords[j - 1].fs !== currentFragFs) break;
                        
                        const subText = allWords.slice(0, j).map(w => w.text).join('');
                        const size = this.measurer.measure(subText, currentFragFs, this.config.horizontal_scale);
                        const testW = size.width + (cellPadding * 2);
                        const testH = size.height + (cellPadding * 2);
                        
                        if (currentLine.w + testW > activeBlock.w) {
                            if (currentLine.w > 0 || j > 1) break;
                            count = 1; lastFitW = testW; lastFitH = testH; break;
                        }
                        count = j; lastFitW = testW; lastFitH = testH;
                    }

                    if (count === 0) {
                        pushLineToBlock();
                        if (overflow) break;
                        continue;
                    }

                    const fitText = allWords.slice(0, count).map(w => w.text).join('');
                    const textWidth = lastFitW - (cellPadding * 2);

                    currentLine.fragments.push({
                        offsetX: currentLine.w, width: lastFitW, height: lastFitH,
                        textHeight: lastFitH - (cellPadding * 2), textWidth: textWidth,
                        text: fitText, invert: currentFragInvert, fs: currentFragFs, 
                        padding: cellPadding, paddingLeft: drawPaddingLeft,
                        scale: this.config.horizontal_scale || 1.0, cellIdx: cellIdx, 
                        align: cell.align || 'left', isGroup: false
                    });
                    
                    currentLine.w += lastFitW;
                    currentLine.h = Math.max(currentLine.h, lastFitH);
                    allWords = allWords.slice(count);
                    
                    if (overflow) break;
                }
            }
            if (overflow) break;
            if (cell.use_whole_line) pushLineToBlock();
            cellIdx++;
        }
        
        pushActiveBlock();

        const layoutCells = [];
        const placeholders = [];
        
        for (const block of blocks) {
            if (isSplitBlock(block)) {
                const pX = block.type === 'split-left' ? padding : totalWidth - padding - block.pW;
                
                const pParsed = Parser.parse(block.pLabel || '');
                const pInvert = pParsed.some(f => f.invert);
                const pText = pParsed.map(f => f.text).join('');
                
                let pFsPt = 10; // Base font size for measurement
                const size = this.measurer.measure(pText, pFsPt, 1.0);
                
                const availableW = block.pW - 2; // 1mm padding each side
                const availableH = block.actualH - 2; // 1mm padding top/bottom
                
                if (size.width > 0 && availableW > 0) {
                    // Scale font size to fit width
                    const scaleW = availableW / size.width;
                    const scaleH = availableH > 0 ? availableH / size.height : scaleW;
                    
                    // Use the smaller scale to ensure it fits both width and height
                    const finalScale = Math.min(scaleW, scaleH);
                    pFsPt = pFsPt * finalScale;
                }

                placeholders.push({
                    x: pX,
                    y: block.y,
                    width: block.pW,
                    height: block.actualH,
                    label: pText,
                    invert: pInvert,
                    textWidth: availableW, // Use availableW for textLength to perfectly flush it
                    fs: pFsPt
                });
            }
            
            for (const line of block.lines) {
                let uniqueOffsets = [];
                for(let f of line.fragments) {
                    if (!uniqueOffsets.includes(f.offsetX)) uniqueOffsets.push(f.offsetX);
                }
                uniqueOffsets.sort((a,b) => a - b);
                
                for(let f of line.fragments) {
                    let idx = uniqueOffsets.indexOf(f.offsetX);
                    let nextOffset = (idx < uniqueOffsets.length - 1) ? uniqueOffsets[idx+1] : block.w;
                    f.width = nextOffset - f.offsetX;
                    
                    f.x = block.x + f.offsetX;
                    if (f.isGroup) {
                        f.fragX = block.x + f.fragOffsetX;
                        f.textX = f.fragX + f.paddingLeft;
                    } else {
                        f.textX = f.x + f.paddingLeft;
                    }
                }
                layoutCells.push(...line.fragments);
            }
        }

        const logicalGroups = this._buildLogicalGroups(blocks);

        return { 
            cells: layoutCells, 
            logicalGroups: logicalGroups,
            placeholders: placeholders, 
            overflow: overflow, 
            w: w, 
            padding: padding,
            usedHeight: currentY + padding 
        };
    }

    /**
     * Groups fragmented cells back into their logical cell representation for drawing borders and backgrounds.
     */
    _buildLogicalGroups(blocks) {
        const groups = [];
        
        for (const block of blocks) {
            for (const line of block.lines) {
                const cellsByIdx = {};
                for (const c of line.fragments) {
                    if (!cellsByIdx[c.cellIdx]) {
                        cellsByIdx[c.cellIdx] = {
                            cells: [],
                            minX: Infinity, maxX: -Infinity,
                            contentMinX: Infinity, contentMaxX: -Infinity,
                            x: c.x, y: c.y, align: c.align, maxH: line.h
                        };
                    }
                    const g = cellsByIdx[c.cellIdx];
                    g.cells.push(c);
                    
                    const fx = c.isGroup ? c.fragX : c.x;
                    const fw = c.isGroup ? c.fragWidth : c.width;
                    const sx = c.x;
                    const sw = c.width;
                    
                    g.contentMinX = Math.min(g.contentMinX, fx);
                    g.contentMaxX = Math.max(g.contentMaxX, fx + fw);
                    g.minX = Math.min(g.minX, sx);
                    g.maxX = Math.max(g.maxX, sx + sw);
                }
                for(let key in cellsByIdx) {
                    groups.push(cellsByIdx[key]);
                }
            }
        }
        return groups;
    }
}

/**
 * Builds SVG Graphics from Layout Configurations
 */
class SVGBuilder {
    static build(layouts, borderThickness, totalW, totalH) {
        let svg = `<svg width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="background: white;">`;

        for(const config of layouts) {
            if (!config.layout) continue;
            svg += this._renderTable(config.layout, config.fs, config.x, config.y, borderThickness);
        }

        svg += `</svg>`;
        return svg;
    }

    static _renderTable(layout, fs, tX, tY, borderThickness) {
        const padding = layout.padding || 0;
        let group = `<g transform="translate(${tX}, ${tY})">`;
        
        // 1. Draw the outermost background and border (no padding)
        group += `<rect x="0" y="0" width="${layout.w}" height="${layout.usedHeight}" fill="white" stroke="black" stroke-width="${borderThickness}"/>`;

        // 2. Draw the inner background and border (with padding) if padding exists
        if (padding > 0) {
            group += `<rect x="${padding}" y="${padding}" width="${layout.w - 2 * padding}" height="${layout.usedHeight - 2 * padding}" fill="white" stroke="black" stroke-width="${borderThickness}"/>`;
        }

        // Draw Cell Borders and Backgrounds
        for (const g of layout.logicalGroups) {
            const contentW = g.contentMaxX - g.contentMinX;
            const effectiveW = g.maxX - g.minX;
            
            let shiftX = 0;
            if (g.align === 'right') shiftX = effectiveW - contentW;
            else if (g.align === 'center') shiftX = (effectiveW - contentW) / 2;

            for (const c of g.cells) {
                const drawPadding = c.padding || 0;
                const drawPaddingLeft = c.paddingLeft || drawPadding;
                
                const topTouch = layout.cells.some(other => other.cellIdx === c.cellIdx && Math.abs(other.y + other.height - c.y) < 0.001 && Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width));
                const bottomTouch = layout.cells.some(other => other.cellIdx === c.cellIdx && Math.abs(c.y + g.maxH - other.y) < 0.001 && Math.max(other.x, c.x) < Math.min(other.x + other.width, c.x + c.width));
                
                // 1. Render Inversion Background
                if (c.invert) {
                    const isOnlyFrag = (g.cells.length === 1);
                    const fillX = isOnlyFrag ? g.x : ((c.isGroup ? c.fragX : c.x) + shiftX);
                    const fillW = isOnlyFrag ? effectiveW : (c.isGroup ? c.fragWidth : c.width);
                    const fillH = bottomTouch ? g.maxH + 0.5 : g.maxH; // Overlap to prevent anti-aliasing gaps
                    group += `<rect x="${fillX}" y="${c.y}" width="${fillW}" height="${fillH}" fill="black"/>`;
                }

                // 2. Render Outer Borders
                const x1 = g.x;
                const x2 = g.x + effectiveW;
                
                // Only draw border once per logical group
                if (c === g.cells[0]) {
                    const stroke = `stroke="black" stroke-width="${borderThickness}"`;
                    const y1 = c.y, y2 = c.y + g.maxH;
                    group += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" ${stroke}/>`;
                    group += `<line x1="${x2}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                    if (!topTouch) group += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" ${stroke}/>`;
                    if (!bottomTouch) group += `<line x1="${x1}" y1="${y2}" x2="${x2}" y2="${y2}" ${stroke}/>`;
                }

                // 3. Render Text
                const centerY = c.y + (g.maxH / 2);
                let textX = (c.isGroup ? c.textX : c.x + drawPaddingLeft) + shiftX;
                const textColor = c.invert ? 'white' : 'black';
                
                const finalScale = (c.scale || 1.0);
                const textLengthAttr = finalScale !== 1.0 ? ` textLength="${c.textWidth}" lengthAdjust="spacingAndGlyphs"` : "";
                
                const drawFs = c.fs || fs;
                group += `<text x="${textX}" y="${centerY}" font-family="${CONSTANTS.FONT_FAMILY}" font-size="${drawFs * CONSTANTS.PT_TO_MM}" fill="${textColor}" dominant-baseline="central"${textLengthAttr} xml:space="preserve">${c.text}</text>`;
            }
        }

        // Draw Placeholders
        for (const p of layout.placeholders) {
            if (p.invert) {
                group += `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="black" stroke="black" stroke-width="${borderThickness}"/>`;
            } else {
                group += `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="none" stroke="black" stroke-width="${borderThickness}"/>`;
            }
            
            if (p.label) {
                const centerY = p.y + (p.height / 2);
                const textColor = p.invert ? 'white' : '#888';
                const textLengthAttr = p.textWidth ? ` textLength="${p.textWidth}" lengthAdjust="spacingAndGlyphs"` : "";
                
                group += `<text x="${p.x + 1}" y="${centerY}" font-family="${CONSTANTS.FONT_FAMILY}" font-size="${(p.fs || 6) * CONSTANTS.PT_TO_MM}" fill="${textColor}" dominant-baseline="central"${textLengthAttr} xml:space="preserve">${p.label}</text>`;
            }
        }
        
        // Final borderline overlap for clean edges (no padding)
        group += `<rect x="0" y="0" width="${layout.w}" height="${layout.usedHeight}" fill="none" stroke="black" stroke-width="${borderThickness}"/>`;
        
        // Final borderline overlap for clean edges (with padding) if padding exists
        if (padding > 0) {
            group += `<rect x="${padding}" y="${padding}" width="${layout.w - 2 * padding}" height="${layout.usedHeight - 2 * padding}" fill="none" stroke="black" stroke-width="${borderThickness}"/>`;
        }

        group += `</g>`;
        return group;
    }
}

/**
 * Renderer facade class that maintains external API compatibility.
 */
export class Renderer {
    constructor(data) {
        this.data = data;
        this.config = data.label_config;
        this.mainTable = data.main_table;
        this.nutritionFacts = data.nutrition_facts;
        this.measurer = new Measurer();
    }

    render() {
        const mode = this.config.nutrition_mode || 'bottom';
        const savedScale = this.config.horizontal_scale || 1.0;
        const nutritionConfig = this.nutritionFacts || { width: 0, height: 0, cells: [] };
        
        let mainWidth = this.mainTable.width || 100;
        let mainHeight = this.mainTable.height || 100;
        let nutritionX = 0, nutritionY = 0;
        let mainX = 0, mainY = 0;

        const layoutEngine = new LayoutEngine(this.config, this.measurer);

        // --- PASS 1: Baseline Font Size (Forced 1.0 Scale) ---
        this.config.horizontal_scale = 1.0;
        
        // Inline findOptimalFontSize
        let mainFontSize = CONSTANTS.MIN_OPTIMAL_FONT_SIZE;
        for (let size = 20; size >= CONSTANTS.MIN_OPTIMAL_FONT_SIZE; size -= 0.2) {
            if (!layoutEngine.calculate(this.mainTable.cells, mainWidth, mainHeight, size).overflow) {
                mainFontSize = size;
                break;
            }
        }
        
        let nutritionFontSize = nutritionConfig.cells && nutritionConfig.cells.length > 0 ? mainFontSize : 0;

        // --- PASS 2: Final Flow Calculation (User Scale) ---
        this.config.horizontal_scale = savedScale;
        const mainLayout = layoutEngine.calculate(this.mainTable.cells, mainWidth, mainHeight, mainFontSize);

        let nutritionLayout = null;
        if (nutritionFontSize > 0) {
            let nutrW = mode === 'bottom' ? mainWidth : (nutritionConfig.width || 100);
            let nutrH = (mode === 'left' || mode === 'right') ? mainHeight : (nutritionConfig.height || 100);
            
            if (mode === 'bottom') {
                nutritionY = mainY + mainLayout.usedHeight;
                nutritionX = mainX;
            } else if (mode === 'left') {
                mainX = nutrW;
                nutritionX = 0;
            } else if (mode === 'right') {
                nutritionX = mainX + mainLayout.w;
            }

            nutritionLayout = layoutEngine.calculate(nutritionConfig.cells, nutrW, nutrH, nutritionFontSize);
        }

        // Calculate Final Viewport Bounds
        let actualW = mainX + mainLayout.w;
        let actualH = mainY + mainLayout.usedHeight;
        
        if (nutritionLayout) {
            actualW = Math.max(actualW, nutritionX + (nutritionLayout.w || 0));
            actualH = Math.max(actualH, nutritionY + (nutritionLayout.usedHeight || 0));
        }

        // Build SVG
        const layoutsToRender = [];
        
        if (nutritionLayout && mode === 'none') {
            layoutsToRender.push({ layout: nutritionLayout, fs: nutritionFontSize, x: nutritionX, y: nutritionY, padding: nutritionLayout.padding });
        }
        
        layoutsToRender.push({ layout: mainLayout, fs: mainFontSize, x: mainX, y: mainY, padding: mainLayout.padding });
        
        if (nutritionLayout && mode !== 'none') {
            layoutsToRender.push({ layout: nutritionLayout, fs: nutritionFontSize, x: nutritionX, y: nutritionY, padding: nutritionLayout.padding });
        }

        const borderThickness = this.config.border_thickness || 0.4;
        const svg = SVGBuilder.build(layoutsToRender, borderThickness, actualW, actualH);

        return {
            svg: svg,
            overflow: mainLayout.overflow || (nutritionLayout ? nutritionLayout.overflow : false),
            mainFontSize: mainFontSize,
            nutritionFontSize: nutritionFontSize,
            actualWidth: actualW,
            actualHeight: actualH
        };
    }
}