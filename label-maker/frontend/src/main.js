import './style.css';
import { SaveSVG } from '../wailsjs/go/main/App';
import { Renderer } from './renderer';

const jsonInput = document.getElementById('json-input');
const svgContainer = document.getElementById('svg-container');
const saveBtn = document.getElementById('save-btn');
const validationMsg = document.getElementById('validation-msg');
const overflowWarning = document.getElementById('overflow-warning');

// Initial Sample Data (Complex with Nutrition)
const initialData = {
    label_config: {
        width: 150,
        height: 120,
        nutrition_mode: "bottom", // bottom | left | right
        global_padding: 5,
        border_thickness: 0.5,
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

    } catch (e) {
        validationMsg.innerText = 'Invalid JSON: ' + e.message;
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

// Wait for fonts to load before initial render
document.fonts.ready.then(() => {
    updatePreview();
});
