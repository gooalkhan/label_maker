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
        const padding = this.config.global_padding || 0;
        const totalWidth = w;
        const totalHeight = h;
        const placeholders = this.mainTable.cells.filter(c => c.type === 'placeholder');
        
        let currentX = padding;
        let currentY = padding;
        let lineHeight = 0;
        const layoutCells = [];
        let overflow = false;

        for (const cell of this.mainTable.cells) {
            if (cell.type === 'placeholder') continue;
            const fullText = (cell.header ? `[${cell.header}] ` : '') + cell.content;
            const size = this.measureText(fullText, fontSize);
            let rightLimit = totalWidth - padding;
            placeholders.forEach(p => { rightLimit -= p.width; });

            if (cell.no_break && (currentX + size.width > rightLimit)) {
                currentY += lineHeight + (padding / 2);
                currentX = padding;
                lineHeight = 0;
            }

            if (currentX + size.width > rightLimit) {
                if (currentX !== padding) {
                    currentY += lineHeight + (padding / 2);
                    currentX = padding;
                    lineHeight = 0;
                }
            }

            layoutCells.push({ x: currentX, y: currentY, width: size.width, height: size.height, text: fullText });
            currentX += size.width + (padding / 2);
            lineHeight = Math.max(lineHeight, size.height);

            if (currentY + lineHeight > totalHeight - padding) { overflow = true; break; }
        }

        return { cells: layoutCells, placeholders, overflow, w, h };
    }

    calculateNutritionLayout(w, h, fontSize) {
        const padding = this.config.global_padding || 2;
        const entries = Object.entries(this.nutritionFacts.data.entries || {});
        const layoutEntries = [];
        let currentY = padding;
        let overflow = false;

        for (const [name, value] of entries) {
            const lineText = `${name}: ${value}`;
            const size = this.measureText(lineText, fontSize);
            layoutEntries.push({ x: padding, y: currentY, text: lineText, height: size.height });
            currentY += size.height + (padding / 4);
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
        for (const c of mainLayout.cells) {
            svg += `<text x="${c.x}" y="${c.y + c.height}" font-family="Nanum Gothic" font-size="${mainFS * 0.3528}mm">${c.text}</text>`;
        }
        let pY = this.config.global_padding;
        for (const p of mainLayout.placeholders) {
            const pX = mainLayout.w - p.width - this.config.global_padding;
            svg += `<rect x="${pX}" y="${pY}" width="${p.width}" height="${p.height}" fill="none" stroke="black" stroke-dasharray="2"/>`;
            pY += p.height + 2;
        }
        svg += `</g>`;

        // Render Nutrition Facts
        svg += `<g transform="translate(${nX}, ${nY})">`;
        svg += `<rect x="0" y="0" width="${nutritionLayout.w}" height="${nutritionLayout.h}" fill="white" stroke="black" stroke-width="${border}"/>`;
        svg += `<text x="${this.config.global_padding}" y="${this.config.global_padding + 2}" font-family="Nanum Gothic" font-weight="bold" font-size="3mm">영양성분</text>`;
        for (const e of nutritionLayout.entries) {
            svg += `<text x="${e.x}" y="${e.y + e.height + 3}" font-family="Nanum Gothic" font-size="${nutrFS * 0.3528}mm">${e.text}</text>`;
        }
        svg += `</g>`;

        svg += `</svg>`;
        return svg;
    }
}
