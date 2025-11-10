// script.js (ฉบับสมบูรณ์: แสดงด้านหน้าและด้านหลังพร้อมกัน)
const canvas = document.getElementById('jerseyCanvas');
// ตรวจสอบความพร้อมของ Canvas
if (!canvas) {
    console.error("Canvas element not found!");
    throw new Error("Canvas element 'jerseyCanvas' is missing from index.html."); 
}

const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
// ตำแหน่งศูนย์กลางของ Canvas
const CANVAS_CENTER_X = W / 2;
// ตำแหน่งศูนย์กลางของเสื้อแต่ละตัว (X=150 และ X=450)
const SHIRT_CENTER_OFFSET = W / 4; 
const BASE_Y = 50; 

// State Object (ปรับค่าเริ่มต้นสำหรับเสื้อโปโลลายกราฟิก)
let jerseyState = {
    collar: 'polo',
    pattern: 'graphic',
    colors: {
        body: '#FFFFFF',
        pattern: '#0056A8',
        collar: '#34A0FF',
        text: '#000000'
    },
    text: { name: 'GEMINI', number: '10' },
    textProps: {
        name: { size: 35, y: H - 320 },
        number: { size: 120, y: H - 250 },
        x: 0 // X-coordinate จะถูกกำหนดโดย OFFSET ใน drawJersey
    },
    logo: null,
    // ตำแหน่งโลโก้จะสัมพันธ์กับจุดศูนย์กลางของเสื้อด้านหน้าเท่านั้น
    logoProps: { x: 0, y: 150, width: 100, height: 100, isDragging: false, isResizing: false, offset: { x: 0, y: 0 } },
    customFont: 'Arial'
};

// --- ฟังก์ชันการวาดหลัก (Core Drawing Functions) ---

/** วาดรูปร่างเสื้อหลัก (ปรับ Path ให้รับ offsetX) */
function drawBodyShape(ctx, color, offsetX) { // <--- เพิ่ม offsetX
    ctx.fillStyle = color;
    const bodyPath = new Path2D();
    
    // พิกัดทั้งหมดจะถูกเลื่อนด้วย offsetX
    const X = offsetX; 
    
    // 1. จุดเริ่มต้น: คอเสื้อด้านซ้าย
    bodyPath.moveTo(X - 60, BASE_Y + 30); 
    
    // 2. ไหล่ซ้ายและแขน
    bodyPath.bezierCurveTo(
        X - 160, BASE_Y - 10,      
        X - 220, BASE_Y + 120,    
        X - 180, BASE_Y + 220      
    );
    bodyPath.lineTo(X - 140, H - 100); 
    bodyPath.quadraticCurveTo(
        X, H - 80, 
        X + 140, H - 100 
    );
    bodyPath.lineTo(X + 180, BASE_Y + 220);
    bodyPath.bezierCurveTo(
        X + 220, BASE_Y + 120, 
        X + 160, BASE_Y - 10,      
        X + 60, BASE_Y + 30   
    );

    bodyPath.closePath();
    ctx.fill(bodyPath);
    return bodyPath;
}

/** วาดลวดลายบนตัวเสื้อ (ปรับให้รับ offsetX) */
function drawPattern(ctx, patternStyle, patternColor, bodyPath, offsetX) { // <--- เพิ่ม offsetX
    if (patternStyle === 'solid') return;

    ctx.save();
    ctx.clip(bodyPath); 
    ctx.fillStyle = patternColor;
    const X = offsetX;
    
    // NOTE: พิกัดในลายต้องสัมพันธ์กับ X (CENTER_X ของเสื้อแต่ละตัว)

    if (patternStyle === 'stripes') {
        const stripeWidth = 20;
        const gap = 10;
        for (let x = X - 200; x < X + 200; x += (stripeWidth + gap)) {
            ctx.fillRect(x, BASE_Y, stripeWidth, H - BASE_Y);
        }
    } else if (patternStyle === 'checkered') {
        const squareSize = 30;
        for (let r = BASE_Y; r < H; r += squareSize) {
            for (let c = X - 250; c < X + 250; c += squareSize) {
                if (((r - BASE_Y) / squareSize + (c - X + 250) / squareSize) % 2 === 0) {
                    ctx.fillRect(c, r, squareSize, squareSize);
                }
            }
        }
    } else if (patternStyle === 'graphic') { 
        const graphicWidth = 100;
        const offset = 20;
        const secondaryColor = '#34A0FF'; 

        // แถบแนวตั้งด้านซ้าย (สีหลัก)
        ctx.fillStyle = patternColor;
        ctx.fillRect(X - graphicWidth - offset, BASE_Y, graphicWidth, H);
        
        // แถบแนวตั้งด้านขวา (สีหลัก)
        ctx.fillRect(X + offset, BASE_Y, graphicWidth, H);

        // สามเหลี่ยมตัดขวาง (จำลองลายกราฟิก)
        ctx.fillStyle = secondaryColor;
        
        ctx.beginPath();
        // สามเหลี่ยมด้านซ้าย
        ctx.moveTo(X - graphicWidth - offset, BASE_Y);
        ctx.lineTo(X - offset, BASE_Y + 100);
        ctx.lineTo(X - graphicWidth - offset, BASE_Y + 150);
        ctx.fill();

        ctx.beginPath();
        // สามเหลี่ยมด้านขวา
        ctx.moveTo(X + offset, BASE_Y + 50);
        ctx.lineTo(X + graphicWidth + offset, BASE_Y + 150);
        ctx.lineTo(X + graphicWidth + offset, BASE_Y + 50);
        ctx.fill();
    }
    
    ctx.restore();
}

/** วาดคอเสื้อ 4 แบบ (ปรับให้รับ offsetX) */
function drawCollar(ctx, style, color, offsetX) { // <--- เพิ่ม offsetX
    ctx.fillStyle = color;
    const neckTopY = BASE_Y + 30;
    const neckWidth = 60; 
    const X = offsetX; // ใช้ X ที่มีการเลื่อน

    ctx.beginPath();
    
    if (style === 'round') {
        ctx.arc(X, neckTopY, neckWidth / 2 + 5, 0, Math.PI * 2, false);
    } else if (style === 'vneck') {
        ctx.moveTo(X - neckWidth / 2, neckTopY);
        ctx.lineTo(X, neckTopY + 20); 
        ctx.lineTo(X + neckWidth / 2, neckTopY);
        ctx.closePath();
    } else if (style === 'polo') {
        ctx.fillRect(X - 10, neckTopY, 20, 30); 
        ctx.moveTo(X - 5, neckTopY);
        ctx.lineTo(X - 50, neckTopY - 10);
        ctx.lineTo(X - 50, neckTopY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(X + 5, neckTopY);
        ctx.lineTo(X + 50, neckTopY - 10);
        ctx.lineTo(X + 50, neckTopY + 20);
        ctx.closePath();
    } else if (style === 'mandarin') {
        ctx.rect(X - neckWidth / 2 - 5, neckTopY - 5, neckWidth + 10, 15);
    }

    ctx.fill();
}

/** วาดชื่อและหมายเลข (ปรับให้รับ offsetX และ isBackView) */
function drawText(ctx, textState, textColor, fontName, textProps, offsetX, isBackView) { // <--- เพิ่ม offsetX, isBackView
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    
    const X = offsetX;

    if (isBackView) {
        // --- มุมมองด้านหลัง: ชื่อและเบอร์ขนาดใหญ่ ---
        
        ctx.font = `bold ${textProps.number.size}px ${fontName}, sans-serif`; 
        ctx.fillText(textState.number, X, textProps.number.y);
        
        ctx.font = `${textProps.name.size}px ${fontName}, sans-serif`;
        ctx.fillText(textState.name, X, textProps.name.y);
    } else {
        // --- มุมมองด้านหน้า: หมายเลขเล็กๆ ใต้คอเสื้อ ---
        ctx.font = `bold 20px ${fontName}, sans-serif`; 
        ctx.fillText(textState.number, X, BASE_Y + 70);
    }
}

/** วาดโลโก้ (ปรับให้รับ offsetX และใช้ตำแหน่งที่ผู้ใช้กำหนด) */
function drawLogo(ctx, logo, props, offsetX) { // <--- เพิ่ม offsetX
    if (logo) {
        // ตำแหน่งโลโก้ถูกกำหนดโดยผู้ใช้เทียบกับจุดศูนย์กลางของเสื้อด้านหน้า
        // FRONT_OFFSET (150) - CANVAS_CENTER (300) = -150
        // เราต้องชดเชยค่านี้เมื่อวาด
        const adjustedX = props.x + (offsetX - SHIRT_CENTER_OFFSET);
        ctx.drawImage(logo, adjustedX, props.y, props.width, props.height);
    }
}


/** ฟังก์ชันรวม: วาด Canvas ใหม่ทั้งหมด (แบ่งครึ่ง) */
function drawJersey() {
    ctx.clearRect(0, 0, W, H); 
    
    // ----------------------------------------------------
    // A. วาดมุมมองด้านหน้า (Left Half)
    // ----------------------------------------------------
    const FRONT_CENTER_X = CANVAS_CENTER_X - SHIRT_CENTER_OFFSET; // X=150
    
    const frontBodyPath = drawBodyShape(ctx, jerseyState.colors.body, FRONT_CENTER_X);
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern, frontBodyPath, FRONT_CENTER_X);
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar, FRONT_CENTER_X);
    
    // วาดโลโก้ (ด้านหน้า)
    drawLogo(ctx, jerseyState.logo, jerseyState.logoProps, FRONT_CENTER_X); 
    
    // วาดหมายเลขเล็กๆ ด้านหน้า (isBackView = false)
    drawText(ctx, jerseyState.text, jerseyState.colors.text, jerseyState.customFont, jerseyState.textProps, FRONT_CENTER_X, false);


    // ----------------------------------------------------
    // B. วาดมุมมองด้านหลัง (Right Half)
    // ----------------------------------------------------
    const BACK_CENTER_X = CANVAS_CENTER_X + SHIRT_CENTER_OFFSET; // X=450
    
    const backBodyPath = drawBodyShape(ctx, jerseyState.colors.body, BACK_CENTER_X);
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern, backBodyPath, BACK_CENTER_X);
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar, BACK_CENTER_X);
    
    // วาดชื่อ/เบอร์ (ด้านหลัง)
    drawText(ctx, jerseyState.text, jerseyState.colors.text, jerseyState.customFont, jerseyState.textProps, BACK_CENTER_X, true);

    // ----------------------------------------------------
    // C. วาดเส้นแบ่งตรงกลาง (เพื่อความชัดเจน)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_CENTER_X, 0);
    ctx.lineTo(CANVAS_CENTER_X, H);
    ctx.stroke();
}

// ... (โค้ด updateStateAndRedraw, handleLogoUpload, handleFontUpload, downloadJersey เดิม) ...

// --- การจัดการโลโก้ (Drag-and-Drop) ---

function getMousePos(e) {
    // ... (โค้ดเดิม) ...
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// ตรวจสอบว่าคลิกโดนโลโก้ในส่วนด้านหน้าหรือไม่
function isInsideLogo(pos) {
    const p = jerseyState.logoProps;
    // ปรับพิกัดโลโก้ให้สัมพันธ์กับตำแหน่งที่มันถูกวาด (ด้านหน้า)
    const adjustedX = p.x + (CANVAS_CENTER_X - SHIRT_CENTER_OFFSET);
    
    return jerseyState.logo && 
           // ตรวจสอบว่าพิกัดเมาส์อยู่ในพื้นที่การวาดโลโก้หรือไม่
           pos.x > adjustedX && pos.x < adjustedX + p.width &&
           pos.y > p.y && pos.y < p.y + p.height &&
           // ตรวจสอบให้แน่ใจว่าคลิกอยู่ในพื้นที่เสื้อด้านหน้าเท่านั้น
           pos.x < CANVAS_CENTER_X; 
}


// handleStart, handleMove, handleEnd logics เหมือนเดิม 
// **NOTE:** โลโก้จะถูกลากได้เฉพาะในพื้นที่ด้านหน้าเท่านั้น (x < W/2) 
// แต่ต้องปรับตำแหน่ง p.x/p.y ใน handleMove ให้สัมพันธ์กับพิกัดจริงของโลโก้

// ... (โค้ด handleStart, handleMove, handleEnd และ setupEventListeners เดิม) ...

// เริ่มต้นเว็บไซต์ (โค้ดนี้ต้องอยู่ท้ายไฟล์)
setupEventListeners();
drawJersey();
