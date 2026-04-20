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

// Initial Sample Data (Complex with Nutrition)
const initialData = {
    label_config: {
        width: 150,
        height: 120,
        nutrition_mode: "bottom", // bottom | left | right
        global_padding: 5,
        cell_padding: 1.5,
        border_thickness: 0.5,
        horizontal_scale: 1.0,
        font_family: "NanumGothic"
    },
    main_table: {
        cells: [
            { type: "info", header: "제품명", content: "커클랜드 시그니춰 유기농 발사믹 식초", order_locked: true, no_break: true },
            { type: "info", header: "식품유형", content: "발효식초(초산 6% v/v%)", order_locked: true, no_break: true },
            { type: "info", header: "내용량", content: "1L", order_locked: true, no_break: false },
            { type: "info", header: "원산지", content: "이탈리아", order_locked: true, no_break: false },
            { type: "placeholder", label: "HACCP 마크", width: 20, height: 20 }
        ]
    },
    nutrition_facts: {
        width: 80,
        height: 40,
        data: {
            entries: {
                "열량": "100kcal",
                "나트륨": "10mg (1%)",
                "탄수화물": "20g (6%)",
                "당류": "15g (15%)",
                "당알콜": "2g"
            }
        }
    }
};

jsonInput.value = JSON.stringify(initialData, null, 4);

// Rendering Logic
function updatePreview() {
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

        console.log(`Render complete. Main FS: ${result.mainFontSize}pt, Nutrition FS: ${result.nutritionFontSize}pt`);

        // Sync Slider with JSON (if horizontal_scale exists)
        if (data.label_config && data.label_config.horizontal_scale !== undefined) {
            const scalePct = Math.round(data.label_config.horizontal_scale * 100);
            scaleSlider.value = scalePct;
            scaleValueDisplay.innerText = scalePct;
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

// Save Functionality
window.saveSVG = function() {
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
jsonInput.addEventListener('input', updatePreview);

// Slider Sync: Update JSON when slider moves
scaleSlider.addEventListener('input', (e) => {
    const scaleFactor = parseInt(e.target.value) / 100;
    scaleValueDisplay.innerText = e.target.value;
    
    try {
        const data = JSON.parse(jsonInput.value);
        if (!data.label_config) data.label_config = {};
        data.label_config.horizontal_scale = scaleFactor;
        jsonInput.value = JSON.stringify(data, null, 4);
        updatePreview();
    } catch (err) {
        console.error("Could not sync slider to JSON:", err);
    }
});

// Wait for fonts to load before initial render
document.fonts.ready.then(() => {
    updatePreview();
});
