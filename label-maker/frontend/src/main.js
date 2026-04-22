import './style.css';
import { SaveSVG } from '../wailsjs/go/main/App';
import { Renderer } from './renderer';

const jsonInput = document.getElementById('json-input');
const svgContainer = document.getElementById('svg-container');
const saveBtn = document.getElementById('save-btn');
const validationMsg = document.getElementById('validation-msg');
const overflowWarning = document.getElementById('overflow-warning');
const scaleSlider = document.getElementById('horizontal-scale-slider');
const scaleValueDisplay = document.getElementById('scale-value');
const loadHorizontalBtn = document.getElementById('load-horizontal-btn');
const loadVerticalBtn = document.getElementById('load-vertical-btn');
const saveJsonBtn = document.getElementById('save-json-btn');
const loadJsonBtn = document.getElementById('load-json-btn');

// Initial Sample Data (Horizontal Layout)
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

jsonInput.value = JSON.stringify(initialData, null, 4);

const zoomLevelDisplay = document.getElementById('zoom-level');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');

let currentZoom = 1.0;

function applyZoom() {
    const svg = svgContainer.querySelector('svg');
    if (svg) {
        svg.style.transform = `scale(${currentZoom})`;
    }
    zoomLevelDisplay.innerText = `${Math.round(currentZoom * 100)}%`;
}

function autoFitZoom() {
    const svg = svgContainer.querySelector('svg');
    if (!svg) return;

    // Get container dimensions (minus padding)
    const containerWidth = svgContainer.clientWidth - 80;
    const containerHeight = svgContainer.clientHeight - 80;

    // Get SVG dimensions in pixels
    const bbox = svg.getBoundingClientRect();
    const svgWidth = bbox.width / currentZoom;
    const svgHeight = bbox.height / currentZoom;

    if (svgWidth > containerWidth || svgHeight > containerHeight) {
        const scaleX = containerWidth / svgWidth;
        const scaleY = containerHeight / svgHeight;
        currentZoom = Math.min(scaleX, scaleY, 1.0);
        applyZoom();
    } else {
        currentZoom = 1.0;
        applyZoom();
    }
}

// Rendering Logic
function updatePreview(isInitial = false) {
    try {
        const data = JSON.parse(jsonInput.value);
        validationMsg.innerText = 'JSON Status: Valid';
        validationMsg.className = 'success';

        const renderer = new Renderer(data);
        const result = renderer.render();

        svgContainer.innerHTML = result.svg;

        // Toggle Overflow Warning
        if (result.overflow) {
            overflowWarning.classList.add('visible');
        } else {
            overflowWarning.classList.remove('visible');
        }

        // Update Font Size Footer
        document.getElementById('main-font-size-val').innerText = result.mainFontSize.toFixed(1);
        document.getElementById('nutr-font-size-val').innerText = result.nutritionFontSize ? result.nutritionFontSize.toFixed(1) : '-';

        console.log(`Render complete. Main FS: ${result.mainFontSize}pt, Nutrition FS: ${result.nutritionFontSize}pt`);

        // Sync Slider with JSON (if horizontal_scale exists)
        if (data.label_config && data.label_config.horizontal_scale !== undefined) {
            const scalePct = Math.round(data.label_config.horizontal_scale * 100);
            scaleSlider.value = scalePct;
            scaleValueDisplay.innerText = scalePct;
        }

        // Apply Zoom after injection
        if (isInitial) {
            autoFitZoom();
        } else {
            applyZoom();
        }

    } catch (e) {
        if (e instanceof SyntaxError) {
            validationMsg.innerText = 'Invalid JSON: ' + e.message;
        } else {
            validationMsg.innerText = 'Render Error: ' + e.message;
        }
        validationMsg.className = 'error';
        console.error(e);
        overflowWarning.classList.remove('visible');
    }
}

// Zoom Event Listeners
zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(currentZoom + 0.1, 3.0);
    applyZoom();
});

zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(currentZoom - 0.1, 0.1);
    applyZoom();
});

zoomResetBtn.addEventListener('click', () => {
    autoFitZoom();
});

// Save Functionality
window.saveSVG = function () {
    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) return;

    const svgString = svgElement.outerHTML;
    SaveSVG(svgString, 'label.svg')
        .then(() => {
            console.log('SVG Saved Successfully');
        })
        .catch((err) => {
            console.error('Save Failed:', err);
        });
};

saveBtn.addEventListener('click', window.saveSVG);

let isInternalUpdate = false;

// Input Event Listener for JSON validation (Visual only)
jsonInput.addEventListener('input', () => {
    if (isInternalUpdate) return;

    try {
        const data = JSON.parse(jsonInput.value);
        validationMsg.innerText = 'JSON Status: Valid';
        validationMsg.className = 'success';

        // Auto-reset horizontal scale to 100% on content change
        if (data.label_config && data.label_config.horizontal_scale !== 1.0) {
            data.label_config.horizontal_scale = 1.0;

            // Re-stringify with the reset scale
            isInternalUpdate = true;
            jsonInput.value = JSON.stringify(data, null, 4);
            isInternalUpdate = false;

            // Sync Slider UI
            scaleSlider.value = 100;
            scaleValueDisplay.innerText = "100";
        }
    } catch (e) {
        validationMsg.innerText = 'JSON Error: ' + e.message;
        validationMsg.className = 'error';
    }
});

// Apply button manual trigger
document.getElementById('apply-btn').addEventListener('click', () => updatePreview());

loadHorizontalBtn.addEventListener('click', () => {
    isInternalUpdate = true;
    jsonInput.value = JSON.stringify(initialData, null, 4);
    isInternalUpdate = false;
    scaleSlider.value = 100;
    scaleValueDisplay.innerText = "100";
    updatePreview();
});

loadVerticalBtn.addEventListener('click', () => {
    isInternalUpdate = true;
    jsonInput.value = JSON.stringify(verticalData, null, 4);
    isInternalUpdate = false;
    scaleSlider.value = 100;
    scaleValueDisplay.innerText = "100";
    updatePreview();
});

saveJsonBtn.addEventListener('click', () => {
    const data = jsonInput.value;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'food_label.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

loadJsonBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                JSON.parse(content); // Validate
                isInternalUpdate = true;
                jsonInput.value = content;
                isInternalUpdate = false;
                updatePreview();
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// Sync Slider: Update JSON text but DO NOT re-render
scaleSlider.addEventListener('input', (e) => {
    const scaleFactor = parseInt(e.target.value) / 100;
    scaleValueDisplay.innerText = e.target.value;

    try {
        const data = JSON.parse(jsonInput.value);
        if (!data.label_config) data.label_config = {};
        data.label_config.horizontal_scale = scaleFactor;

        isInternalUpdate = true;
        jsonInput.value = JSON.stringify(data, null, 4);
        isInternalUpdate = false;
    } catch (err) {
        console.error("Could not sync slider to JSON:", err);
    }
});

// Window resize listener to handle auto-fit
window.addEventListener('resize', () => {
    autoFitZoom();
});

// Wait for fonts to load before initial render
document.fonts.ready.then(() => {
    updatePreview(true);
});
