const fs = require('fs');

const mainJsPath = './main.js';
const content = fs.readFileSync(mainJsPath, 'utf-8');

const initialDataMatch = content.match(/const initialData = (\{[\s\S]*?\n\});/);
const verticalDataMatch = content.match(/const verticalData = (\{[\s\S]*?\n\});/);

const initialDataStr = initialDataMatch[1];
const verticalDataStr = verticalDataMatch[1];

const newMainJs = `import './style.css';
import { SaveSVG } from '../wailsjs/go/main/App';
import { Renderer } from './renderer';

const initialData = ${initialDataStr};

const verticalData = ${verticalDataStr};

// --- State Management ---
let appState = null;
let currentZoom = 1.0;
let draggedItem = null;

// --- DOM Elements ---
const nutritionModeSelect = document.getElementById('nutrition-mode-select');
const globalPaddingInput = document.getElementById('global-padding-input');
const cellPaddingInput = document.getElementById('cell-padding-input');
const borderThicknessInput = document.getElementById('border-thickness-input');
const horizontalScaleSlider = document.getElementById('horizontal-scale-slider');
const scaleValueDisplay = document.getElementById('scale-value');

const mainWidthInput = document.getElementById('main-width-input');
const mainHeightInput = document.getElementById('main-height-input');
const nutrWidthInput = document.getElementById('nutr-width-input');
const nutrHeightInput = document.getElementById('nutr-height-input');

const mainCellsList = document.getElementById('main-cells-list');
const nutritionCellsList = document.getElementById('nutrition-cells-list');

const svgContainer = document.getElementById('svg-container');
const validationMsg = document.getElementById('validation-msg');
const overflowWarning = document.getElementById('overflow-warning');
const zoomLevelDisplay = document.getElementById('zoom-level');

// --- Initialization ---
function init() {
    appState = JSON.parse(JSON.stringify(initialData));
    bindGlobalListeners();
    bindDragAndDrop();
    renderGUI();
    updatePreview(true);
}

function renderGUI() {
    if (!appState) return;

    // Populate Global Settings
    nutritionModeSelect.value = appState.label_config.nutrition_mode || 'bottom';
    globalPaddingInput.value = appState.label_config.global_padding;
    cellPaddingInput.value = appState.label_config.cell_padding;
    borderThicknessInput.value = appState.label_config.border_thickness;
    
    const scalePct = Math.round((appState.label_config.horizontal_scale || 1.0) * 100);
    horizontalScaleSlider.value = scalePct;
    scaleValueDisplay.innerText = scalePct;

    // Populate Dims
    mainWidthInput.value = appState.main_table.width;
    mainHeightInput.value = appState.main_table.height;
    if(appState.nutrition_facts) {
        nutrWidthInput.value = appState.nutrition_facts.width || 100;
        nutrHeightInput.value = appState.nutrition_facts.height || 100;
    }

    // Render Lists
    renderCellList(mainCellsList, appState.main_table.cells, 'main_table');
    if(appState.nutrition_facts) {
        renderCellList(nutritionCellsList, appState.nutrition_facts.cells, 'nutrition_facts');
    }
}

function renderCellList(container, cells, tableName) {
    container.innerHTML = '';
    cells.forEach((cell, index) => {
        const el = createCellElement(cell, index, tableName);
        container.appendChild(el);
    });
}

function createCellElement(cell, index, tableName) {
    const div = document.createElement('div');
    div.className = 'cell-item';
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.table = tableName;

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '☰';
    
    const content = document.createElement('div');
    content.className = 'cell-content';

    // Top row: Type and Delete
    const topRow = document.createElement('div');
    topRow.className = 'cell-row';
    
    const typeSelect = document.createElement('select');
    typeSelect.className = 'cell-input';
    typeSelect.style.width = '120px';
    typeSelect.style.flex = 'none';
    typeSelect.innerHTML = \`<option value="info">Info</option><option value="placeholder">Placeholder</option>\`;
    typeSelect.value = cell.type || 'info';
    typeSelect.onchange = (e) => {
        cell.type = e.target.value;
        if (cell.type === 'placeholder') {
            cell.width = cell.width || 20;
            cell.height = cell.height || 20;
            delete cell.header;
            delete cell.content;
            delete cell.use_whole_line;
            delete cell.no_break;
            delete cell.align;
        } else {
            delete cell.width;
            delete cell.height;
            delete cell.label;
        }
        renderGUI();
        updatePreview();
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '✖';
    delBtn.title = 'Delete Cell';
    delBtn.onclick = () => {
        appState[tableName].cells.splice(index, 1);
        renderGUI();
        updatePreview();
    };

    topRow.appendChild(typeSelect);
    topRow.appendChild(delBtn);
    content.appendChild(topRow);

    if (cell.type === 'placeholder') {
        const dimRow = document.createElement('div');
        dimRow.className = 'cell-row';
        dimRow.innerHTML = \`
            <input type="number" class="cell-input placeholder-w" value="\${cell.width || 20}" placeholder="W (mm)" title="Width (mm)">
            <input type="number" class="cell-input placeholder-h" value="\${cell.height || 20}" placeholder="H (mm)" title="Height (mm)">
            <input type="text" class="cell-input placeholder-lbl" value="\${cell.label || ''}" placeholder="Label Text">
        \`;
        
        dimRow.querySelector('.placeholder-w').oninput = (e) => { cell.width = parseFloat(e.target.value) || 0; updatePreview(); };
        dimRow.querySelector('.placeholder-h').oninput = (e) => { cell.height = parseFloat(e.target.value) || 0; updatePreview(); };
        dimRow.querySelector('.placeholder-lbl').oninput = (e) => { cell.label = e.target.value; updatePreview(); };
        
        content.appendChild(dimRow);
    } else {
        // Info Cell
        const headerRow = document.createElement('div');
        headerRow.className = 'cell-row';
        
        const hasHeaderLabel = document.createElement('label');
        hasHeaderLabel.style.display = 'flex';
        hasHeaderLabel.style.alignItems = 'center';
        hasHeaderLabel.style.gap = '4px';
        hasHeaderLabel.style.fontSize = '0.8rem';
        
        const hasHeaderCheckbox = document.createElement('input');
        hasHeaderCheckbox.type = 'checkbox';
        hasHeaderCheckbox.className = 'header-toggle';
        hasHeaderCheckbox.checked = cell.header !== undefined;
        
        hasHeaderLabel.appendChild(hasHeaderCheckbox);
        hasHeaderLabel.appendChild(document.createTextNode('Header'));

        const headerInput = document.createElement('input');
        headerInput.type = 'text';
        headerInput.className = 'cell-input';
        headerInput.placeholder = 'Header Text (e.g. [[제품명]])';
        headerInput.value = cell.header || '';
        headerInput.disabled = !hasHeaderCheckbox.checked;

        hasHeaderCheckbox.onchange = (e) => {
            headerInput.disabled = !e.target.checked;
            if (!e.target.checked) {
                delete cell.header;
            } else {
                cell.header = headerInput.value;
            }
            updatePreview();
        };

        headerInput.oninput = (e) => {
            cell.header = e.target.value;
            updatePreview();
        };

        headerRow.appendChild(hasHeaderLabel);
        headerRow.appendChild(headerInput);
        
        const contentRow = document.createElement('div');
        contentRow.className = 'cell-row';
        const contentInput = document.createElement('input');
        contentInput.type = 'text';
        contentInput.className = 'cell-input';
        contentInput.placeholder = 'Content Text (e.g. {{내용}})';
        contentInput.value = cell.content || '';
        contentInput.oninput = (e) => {
            cell.content = e.target.value;
            updatePreview();
        };
        contentRow.appendChild(contentInput);

        const optionsRow = document.createElement('div');
        optionsRow.className = 'cell-options';
        
        // use_whole_line
        const wlLabel = document.createElement('label');
        const wlCheck = document.createElement('input');
        wlCheck.type = 'checkbox';
        wlCheck.checked = !!cell.use_whole_line;
        wlCheck.onchange = (e) => { 
            cell.use_whole_line = e.target.checked; 
            if(cell.use_whole_line) {
                cell.no_break = false; // Reset mutually exclusive option
                renderGUI();
            }
            updatePreview(); 
        };
        wlLabel.appendChild(wlCheck);
        wlLabel.appendChild(document.createTextNode('Whole Line'));
        
        // no_break
        const nbLabel = document.createElement('label');
        const nbCheck = document.createElement('input');
        nbCheck.type = 'checkbox';
        nbCheck.checked = !!cell.no_break;
        nbCheck.onchange = (e) => { 
            cell.no_break = e.target.checked; 
            if(cell.no_break) {
                cell.use_whole_line = false;
                renderGUI();
            }
            updatePreview(); 
        };
        nbLabel.appendChild(nbCheck);
        nbLabel.appendChild(document.createTextNode('No Break'));

        // align
        const alignSelect = document.createElement('select');
        alignSelect.className = 'cell-input';
        alignSelect.style.width = '80px';
        alignSelect.style.flex = 'none';
        alignSelect.style.padding = '2px';
        alignSelect.innerHTML = \`<option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>\`;
        alignSelect.value = cell.align || 'left';
        alignSelect.onchange = (e) => {
            if(e.target.value === 'left') delete cell.align;
            else cell.align = e.target.value;
            updatePreview();
        };

        optionsRow.appendChild(wlLabel);
        optionsRow.appendChild(nbLabel);
        optionsRow.appendChild(alignSelect);

        content.appendChild(headerRow);
        content.appendChild(contentRow);
        content.appendChild(optionsRow);
    }

    div.appendChild(handle);
    div.appendChild(content);

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

// --- Drag and Drop Logic ---
function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.sortable-list .cell-item').forEach(item => item.classList.remove('drag-over'));
}

function bindDragAndDrop() {
    const lists = [mainCellsList, nutritionCellsList];
    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            if (!draggedItem) return;
            if (draggedItem.dataset.table !== list.dataset.table) return;

            const afterElement = getDragAfterElement(list, e.clientY);
            
            document.querySelectorAll('.sortable-list .cell-item').forEach(item => item.classList.remove('drag-over'));
            if (afterElement) {
                afterElement.classList.add('drag-over');
            }

            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            if (!draggedItem) return;
            const tableName = list.dataset.table;
            if (draggedItem.dataset.table !== tableName) return;

            document.querySelectorAll('.sortable-list .cell-item').forEach(item => item.classList.remove('drag-over'));

            const newCells = [];
            const items = list.querySelectorAll('.cell-item');
            items.forEach(item => {
                const originalIndex = parseInt(item.dataset.index);
                newCells.push(appState[tableName].cells[originalIndex]);
            });
            appState[tableName].cells = newCells;
            
            renderGUI();
            updatePreview();
        });
        
        list.addEventListener('dragleave', e => {
             document.querySelectorAll('.sortable-list .cell-item').forEach(item => item.classList.remove('drag-over'));
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.cell-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Global Listeners ---
function bindGlobalListeners() {
    nutritionModeSelect.onchange = (e) => { appState.label_config.nutrition_mode = e.target.value; updatePreview(); };
    globalPaddingInput.oninput = (e) => { appState.label_config.global_padding = parseFloat(e.target.value) || 0; updatePreview(); };
    cellPaddingInput.oninput = (e) => { appState.label_config.cell_padding = parseFloat(e.target.value) || 0; updatePreview(); };
    borderThicknessInput.oninput = (e) => { appState.label_config.border_thickness = parseFloat(e.target.value) || 0; updatePreview(); };
    
    horizontalScaleSlider.oninput = (e) => {
        const scaleFactor = parseInt(e.target.value) / 100;
        scaleValueDisplay.innerText = e.target.value;
        appState.label_config.horizontal_scale = scaleFactor;
        updatePreview();
    };

    mainWidthInput.onchange = (e) => { appState.main_table.width = parseFloat(e.target.value) || 0; updatePreview(); };
    mainHeightInput.onchange = (e) => { appState.main_table.height = parseFloat(e.target.value) || 0; updatePreview(); };
    nutrWidthInput.onchange = (e) => { 
        if(!appState.nutrition_facts) appState.nutrition_facts = {cells:[]};
        appState.nutrition_facts.width = parseFloat(e.target.value) || 0; 
        updatePreview(); 
    };
    nutrHeightInput.onchange = (e) => { 
        if(!appState.nutrition_facts) appState.nutrition_facts = {cells:[]};
        appState.nutrition_facts.height = parseFloat(e.target.value) || 0; 
        updatePreview(); 
    };

    document.getElementById('add-main-cell-btn').onclick = () => {
        appState.main_table.cells.push({ type: 'info', content: '새로운 셀' });
        renderGUI();
        updatePreview();
    };

    document.getElementById('add-nutr-cell-btn').onclick = () => {
        if(!appState.nutrition_facts) appState.nutrition_facts = {width:100, height:100, cells:[]};
        appState.nutrition_facts.cells.push({ type: 'info', content: '새로운 셀' });
        renderGUI();
        updatePreview();
    };

    document.getElementById('zoom-in-btn').onclick = () => { currentZoom = Math.min(currentZoom + 0.1, 3.0); applyZoom(); };
    document.getElementById('zoom-out-btn').onclick = () => { currentZoom = Math.max(currentZoom - 0.1, 0.1); applyZoom(); };
    document.getElementById('zoom-reset-btn').onclick = () => { autoFitZoom(); };

    document.getElementById('save-btn').onclick = () => {
        const svgElement = svgContainer.querySelector('svg');
        if (!svgElement) return;
        SaveSVG(svgElement.outerHTML, 'label.svg').then(() => console.log('Saved')).catch(console.error);
    };

    document.getElementById('load-horizontal-btn').onclick = () => {
        appState = JSON.parse(JSON.stringify(initialData));
        renderGUI();
        updatePreview();
    };
    document.getElementById('load-vertical-btn').onclick = () => {
        appState = JSON.parse(JSON.stringify(verticalData));
        renderGUI();
        updatePreview();
    };

    document.getElementById('save-json-btn').onclick = () => {
        const blob = new Blob([JSON.stringify(appState, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'food_label.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    document.getElementById('load-json-btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    appState = JSON.parse(e.target.result);
                    renderGUI();
                    updatePreview();
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    window.addEventListener('resize', autoFitZoom);
}

function applyZoom() {
    const svg = svgContainer.querySelector('svg');
    if (svg) svg.style.transform = \`scale(\${currentZoom})\`;
    zoomLevelDisplay.innerText = \`\${Math.round(currentZoom * 100)}%\`;
}

function autoFitZoom() {
    const svg = svgContainer.querySelector('svg');
    if (!svg) return;
    const containerWidth = svgContainer.clientWidth - 80;
    const containerHeight = svgContainer.clientHeight - 80;
    const bbox = svg.getBoundingClientRect();
    const svgWidth = bbox.width / currentZoom;
    const svgHeight = bbox.height / currentZoom;

    if (svgWidth > containerWidth || svgHeight > containerHeight) {
        currentZoom = Math.min(containerWidth / svgWidth, containerHeight / svgHeight, 1.0);
    } else {
        currentZoom = 1.0;
    }
    applyZoom();
}

function updatePreview(isInitial = false) {
    try {
        validationMsg.innerText = 'Validating...';
        validationMsg.className = '';

        const renderer = new Renderer(appState);
        const result = renderer.render();

        svgContainer.innerHTML = result.svg;

        if (result.overflow) overflowWarning.classList.add('visible');
        else overflowWarning.classList.remove('visible');

        document.getElementById('main-font-size-val').innerText = result.mainFontSize.toFixed(1);
        document.getElementById('nutr-font-size-val').innerText = result.nutritionFontSize ? result.nutritionFontSize.toFixed(1) : '-';

        validationMsg.innerText = 'Render Successful';
        validationMsg.className = 'success';

        if (isInitial) autoFitZoom();
        else applyZoom();

    } catch (e) {
        validationMsg.innerText = 'Render Error: ' + e.message;
        validationMsg.className = 'error';
        console.error(e);
        overflowWarning.classList.remove('visible');
    }
}

// Wait for fonts to load before initial render
document.fonts.ready.then(() => {
    init();
});
`;

fs.writeFileSync(mainJsPath, newMainJs, 'utf-8');
