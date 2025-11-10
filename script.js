// script.js (ฉบับปรับปรุง)

const canvas = document.getElementById('jerseyCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const CENTER_X = W / 2;
const BASE_Y = 50; 

// State Object (เพิ่ม textProps)
let jerseyState = {
    collar: 'round',
    pattern: 'solid',
    colors: {
        body: '#FFFFFF', pattern: '#0056A8', collar: '#CC0000', text: '#000000'
    },
    text: { name: 'GEMINI', number: '10' },
    // **NEW:** ควบคุมตำแหน่ง/ขนาดของชื่อและเบอร์
    textProps: {
        name: { size: 35, y: H - 320 },
        number: { size: 120, y: H - 250 },
        x: CENTER_X 
    },
    logo: null,
    logoProps: { x: CENTER_X - 50, y: 150, width: 100, height: 100, isDragging: false, offset: { x: 0, y: 0 } },
    customFont: 'Arial'
};

// --- ฟังก์ชันการวาดหลัก (Core Drawing Functions) ---

/** วาดรูปร่างเสื้อหลัก (ปรับ Path ให้โค้งมนมากขึ้น) */
function drawBodyShape(ctx, color) {
    ctx.fillStyle = color;
    const bodyPath = new Path2D();
    
    // พิกัดปรับปรุงเพื่อให้ดูเป็นเสื้อกีฬามากขึ้น
    
    // 1. จุดเริ่มต้น: คอเสื้อด้านซ้าย
    bodyPath.moveTo(CENTER_X - 60, BASE_Y + 30); 
    
    // 2. ไหล่ซ้ายและแขน
    bodyPath.bezierCurveTo(
        CENTER_X - 160, BASE_Y - 10,      // Control Point 1 (ไหล่)
        CENTER_X - 220, BASE_Y + 120,    // Control Point 2 (โค้งแขน)
        CENTER_X - 180, BASE_Y + 220     // สิ้นสุดที่ปลายแขนซ้าย
    );
    
    // 3. ด้านข้างซ้าย
    bodyPath.lineTo(CENTER_X - 140, H - 100); 

    // 4. ชายเสื้อด้านล่าง (โค้งมน)
    bodyPath.quadraticCurveTo(
        CENTER_X, H - 80, 
        CENTER_X + 140, H - 100 // สิ้นสุดที่ชายเสื้อด้านขวา
    );
    
    // 5. ด้านข้างขวา
    bodyPath.lineTo(CENTER_X + 180, BASE_Y + 220);

    // 6. แขนขวาและไหล่
    bodyPath.bezierCurveTo(
        CENTER_X + 220, BASE_Y + 120, 
        CENTER_X + 160, BASE_Y - 10,      
        CENTER_X + 60, BASE_Y + 30   // สิ้นสุดที่คอเสื้อด้านขวา
    );

    bodyPath.closePath();
    ctx.fill(bodyPath);
    return bodyPath;
}

// ... (drawPattern, drawCollar, handleLogoUpload, downloadJersey - โค้ดเดิม) ...

/** วาดชื่อและหมายเลข (ใช้ textProps ใหม่) */
function drawText(ctx, textState, textColor, fontName, textProps) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    
    // หมายเลข
    ctx.font = `bold ${textProps.number.size}px ${fontName}, sans-serif`; 
    ctx.fillText(textState.number, textProps.x, textProps.number.y);
    
    // ชื่อ
    ctx.font = `${textProps.name.size}px ${fontName}, sans-serif`;
    ctx.fillText(textState.name, textProps.x, textProps.name.y);
}

/** ฟังก์ชันรวม: วาด Canvas ใหม่ทั้งหมด */
function drawJersey() {
    ctx.clearRect(0, 0, W, H); 
    const bodyPath = drawBodyShape(ctx, jerseyState.colors.body);
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern, bodyPath);
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar);
    
    // ส่ง textProps เข้าไป
    drawText(ctx, jerseyState.text, jerseyState.colors.text, jerseyState.customFont, jerseyState.textProps);
    
    drawLogo(ctx, jerseyState.logo, jerseyState.logoProps);
}

/** อัปเดต State จาก UI และเรียกวาดใหม่ (ต้องอัปเดตเพื่อรองรับ Input ใหม่) */
function updateStateAndRedraw() {
    // ... (ส่วนอัปเดต UI เดิม) ...
    jerseyState.collar = document.getElementById('collar-style').value;
    jerseyState.pattern = document.getElementById('pattern-style').value;
    jerseyState.colors.body = document.getElementById('body-color').value;
    jerseyState.colors.pattern = document.getElementById('pattern-color').value;
    jerseyState.colors.collar = document.getElementById('collar-color').value;
    jerseyState.colors.text = document.getElementById('text-color').value;
    jerseyState.text.name = document.getElementById('player-name').value.toUpperCase();
    jerseyState.text.number = document.getElementById('player-number').value;
    jerseyState.customFont = document.getElementById('current-font').value;

    // **NEW:** อัปเดตตำแหน่งและขนาดจาก Input ใหม่
    jerseyState.textProps.number.y = parseInt(document.getElementById('number-y').value) || H - 250;
    jerseyState.textProps.number.size = parseInt(document.getElementById('number-size').value) || 120;
    jerseyState.textProps.name.y = parseInt(document.getElementById('name-y').value) || H - 320;
    jerseyState.textProps.name.size = parseInt(document.getElementById('name-size').value) || 35;
    
    drawJersey();
}

// ... (setupEventListeners และโค้ดส่วนอื่นๆ) ...

// **หมายเหตุ:** ต้องมีการเรียก setupEventListeners() และ drawJersey() ที่ส่วนท้ายของไฟล์
