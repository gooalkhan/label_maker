import './style.css';
import { SaveSVG } from '../wailsjs/go/main/App';
import { Renderer } from './renderer';

const initialData = {
    label_config: {
        nutrition_mode: "right",
        global_padding: 3,
        cell_padding: 1.2,
        border_thickness: 0.4,
        horizontal_scale: 1.0,
        font_family: "NanumGothic"
    },
    main_table: {
        width: 140,
        height: 120,
        cells: [
            { type: "info", content: "식품등의표시 · 광고에관한법률에 따른 한글표시사항", use_whole_line: true },
            { type: "info", header: "[[제품명]]", content: "프리미엄 호밀 가공빵(호밀 80% 함유)", no_break: true },
            { type: "info", header: "[[식품유형]]", content: "빵류", no_break: true },
            { type: "info", header: "[[원산지]]", content: "{{덴마크}}", no_break: true },
            { type: "info", header: "[[내용량]]", content: "500g (790Kcal)", no_break: true },
            { type: "info", header: "[[제조원]]", content: "(주)글로벌푸드코리아", use_whole_line: true },
            { type: "info", header: "[[수입원]]", content: "주식회사 젤러노트 / 서울특별시 중구 한강대로 416, 서울스퀘어 13층 5호, 25호", use_whole_line: true },
            { type: "info", header: "[[원재료명]]", content: "호밀 60%, 정제수, 효모, 정제소금, 맥아추출물(고형분함량 100%), 설탕, 사탕무, 식이섬유, 옥수수전분, 밀식이섬유, 유채유, 맥아분말", use_whole_line: true },
            { type: "placeholder", label: "비닐류 OTHER(LDPE+PP)", width: 25, height: 25 },
            { type: "info", header: "[[포장기한]]", content: "2024.12.31", no_break: true },
            { type: "info", header: "[[소비기한]]", content: "제품 별도 표기일까지(읽는법: 일/월/년 순)", no_break: true },
            { type: "info", header: "[[보관방법]]", content: "직사광선을 피해 건조하고 서늘한곳에 보관", use_whole_line: true },
            { type: "info", header: "[[반품및교환]]", content: "구입처 및 수입원(T.02-6956-7787)", use_whole_line: true },
            { type: "info", content: "주 표시면의 이미지는 조리예 및 연출된 예입니다\n우유, 대두, 밀, 호두 함유 가능성 있음\n본 제품은 공정거래위원회의 고시 소비자분쟁해결기준에 의거 교환 또는 보상받을 수 있습니다.\n부정·불량식품 신고는 국번없이 1399", use_whole_line: true }
        ]
    },
    nutrition_facts: {
        width: 70,
        height: 120,
        cells: [
            { "type": "info", "header": "[[영양정보]]", "no_break": true },
            { "type": "info", "header": "[[총 내용량 450g / 100g당 210kcal]]", "align": "right", "no_break": true },
            { "type": "info", "content": "[[나트륨]]", "no_break": true },
            { "type": "info", "header": "280mg 14 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[탄수화물]]", "no_break": true },
            { "type": "info", "header": "41g 13 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[당류]]", "no_break": true },
            { "type": "info", "header": "6g 6 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[지방]]", "no_break": true },
            { "type": "info", "header": "1.1g 2 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[트랜스지방]]", "no_break": true },
            { "type": "info", "header": "0g", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[포화지방]]", "no_break": true },
            { "type": "info", "header": "0.3g 2 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[콜레스테롤]]", "no_break": true },
            { "type": "info", "header": "0mg 0 %", "no_break": true, "align": "right" },
            { "type": "info", "content": "[[단백질]]", "no_break": true },
            { "type": "info", "header": "4.4g 8 %", "no_break": true, "align": "right" },

            { "type": "info", "content": "1일 영양성분 기준치에 대한 비율(%)은 2,000 kcal 기준이므로 개인의 필요 열량에 따라 다를 수 있습니다.", "use_whole_line": true }
        ]
    }
};

const verticalData = {
    label_config: {
        nutrition_mode: "bottom",
        global_padding: 3,
        cell_padding: 1.2,
        border_thickness: 0.4,
        horizontal_scale: 1.0,
        font_family: "NanumGothic"
    },
    main_table: {
        width: 130,
        height: 150,
        cells: [
            { type: "info", content: "식품 등의 표시 · 광고에 관한 법률에 의한 한글표시사항", use_whole_line: true },
            { type: "info", header: "[[제품명]]", content: "냉동브로콜리믹스", no_break: true },
            { type: "info", header: "[[식품유형]]", content: "과·채가공품(가열하여 섭취하는 냉동식품)", no_break: true },
            { type: "info", header: "[[업소명 및 소재지]]", content: "제조원 Dujardin Foods NV / 수입판매원 (주)웰팜 / 충청북도 음성군 금왕읍 금일로 546번길 87", use_whole_line: true },
            { type: "info", header: "[[소비기한]]", content: "2028년 12월 31일 까지", no_break: true },
            { type: "info", header: "[[내용량]]", content: "1 kg(300kcal)", no_break: true },
            { type: "info", header: "[[원재료명]]", content: "슬라이스당근 35 %, 콜리플라워 33 %, 브로콜리 32 %", use_whole_line: true },
            { type: "info", header: "[[원산지]]", content: "{{벨기에}}", no_break: true },
            { type: "info", header: "[[포장재질(내면)]]", content: "폴리에틸렌", no_break: true },
            {
                type: "info",
                content: "본 제품은 공정거래 위원회고시 소비자분쟁해결기준에 의거 교환 또는 보상받을 수 있습니다. 반품 및 교환 구입처 및 수입판매원 보관방법 -18℃ 이하 냉동보관 해동방법 별도의 해동 없음 주의사항 · 이미 냉동된 바 있으니 해동 후 재냉동시키지 마시길 바랍니다. · 냉동상태에서는 단단할 수 있으니 주의하시기 바랍니다. · 이 제품은 알류(계란), 우유, 메밀, 땅콩, 대두, 밀, 게, 새우, 고등어, 복숭아, 토마토, 돼지고기, 아황산류, 호두, 쇠고기, 닭고기, 오징어, 조개류(굴, 전복, 홍합 포함), 잣을 사용한 제품과 같은 제조 시설에서 제조하고 있습니다. · 특정원료에 대해 알레르기가 있으신 분은 반드시 원재료를 확인하시고 섭취하시기 바랍니다. 자연원행복센터 080-707-2547 (www.jyone.co.kr) · 부정 · 불량 식품 신고는 국번없이 1399",
                use_whole_line: true
            },
            { type: "placeholder", label: "비닐류 LDPE", width: 12, height: 12 },
            {
                type: "info",
                header: "[[요리법 및 활용법]]",
                content: ". 볶음밥, 수프, 등 다양한 요리로 즐길 수 있으며 새우, 전복과 같은 해산물이나 육류와 곁들여 먹어도 좋습니다. 더 자세한 요리법 및 활용법은 자연원몰(www.jyone.co.kr)에서 확인하세요.",
                use_whole_line: true
            }
        ]
    },
    nutrition_facts: {
        width: 130,
        height: 60,
        cells: [
            { "type": "info", "header": "[[영양정보]]", "no_break": true },
            { "type": "info", "header": "[[총 내용량 1 kg 100 g당 30 kcal]]", "align": "right", "no_break": true },
            { "type": "info", "content": "나트륨 20 mg 1 %", "no_break": true },
            { "type": "info", "header": "탄수화물 3 g 1 %", "no_break": true },
            { "type": "info", "header": "당류 2.5 g 3 %", "no_break": true },
            { "type": "info", "header": "지방 0.7 g 1 %", "no_break": true },
            { "type": "info", "header": "트랜스지방 0 g", "no_break": true },
            { "type": "info", "header": "포화지방 0.1 g 1 %", "no_break": true },
            { "type": "info", "header": "콜레스테롤 0 mg 0 %", "no_break": true },
            { "type": "info", "header": "단백질 2.2 g 4 %", "no_break": true },
            { "type": "info", "content": "1일 영양성분 기준치에 대한 비율(%)은 2,000 kcal 기준이므로 개인의 필요 열량에 따라 다를 수 있습니다.", "use_whole_line": true }
        ]
    }
};

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
    typeSelect.innerHTML = `<option value="info">Info</option><option value="placeholder">Placeholder</option>`;
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
        dimRow.innerHTML = `
            <input type="number" class="cell-input placeholder-w" value="${cell.width || 20}" placeholder="W (mm)" title="Width (mm)">
            <input type="number" class="cell-input placeholder-h" value="${cell.height || 20}" placeholder="H (mm)" title="Height (mm)">
            <input type="text" class="cell-input placeholder-lbl" value="${cell.label || ''}" placeholder="Label Text">
        `;
        
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
        alignSelect.innerHTML = `<option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>`;
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
    // Accordion Logic
    const panels = document.querySelectorAll('.accordion-panel');
    panels.forEach(panel => {
        const header = panel.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            if (panel.classList.contains('active')) return;
            
            panels.forEach(p => {
                p.classList.remove('active');
                p.querySelector('.accordion-body').style.display = 'none';
                p.querySelector('.accordion-icon').innerText = '▶';
            });
            
            panel.classList.add('active');
            panel.querySelector('.accordion-body').style.display = 'flex';
            panel.querySelector('.accordion-icon').innerText = '▼';
        });
    });

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
        
        if (window.go && window.go.main && window.go.main.App) {
            SaveSVG(svgElement.outerHTML, 'label.svg').then(() => console.log('Saved')).catch(console.error);
        } else {
            // Web fallback for GitHub Pages
            const blob = new Blob([svgElement.outerHTML], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'label.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Saved via browser download');
        }
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

    // Prompt Modal Logic
    const promptModal = document.getElementById('prompt-modal');
    const promptTextarea = document.getElementById('prompt-textarea');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');

    document.getElementById('show-prompt-btn').onclick = async () => {
        try {
            if (window.go && window.go.main && window.go.main.App) {
                const promptText = await window.go.main.App.GetLLMPrompt();
                promptTextarea.value = promptText;
            } else {
                promptTextarea.value = "Failed to load prompt. Backend not available.";
            }
        } catch (e) {
            promptTextarea.value = "Error loading prompt: " + e;
        }
        promptModal.style.display = 'flex';
        copyPromptBtn.innerText = '복사하기';
    };

    document.querySelector('.close-modal-btn').onclick = () => {
        promptModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === promptModal) {
            promptModal.style.display = 'none';
        }
    };

    copyPromptBtn.onclick = () => {
        promptTextarea.select();
        promptTextarea.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(promptTextarea.value).then(() => {
            copyPromptBtn.innerText = '복사 완료!';
            setTimeout(() => {
                copyPromptBtn.innerText = '복사하기';
            }, 2000);
        });
    };

    window.addEventListener('resize', autoFitZoom);
}

function applyZoom() {
    const svg = svgContainer.querySelector('svg');
    if (svg) svg.style.transform = `scale(${currentZoom})`;
    zoomLevelDisplay.innerText = `${Math.round(currentZoom * 100)}%`;
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
