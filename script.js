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
// ตำแหน่งศูนย์กลางของเสื้อด้านหน้า (X=150)
const FRONT_CENTER_X = CANVAS_CENTER_X - SHIRT_CENTER_OFFSET; 

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
        x: 0 
    },
    logo: null,
    // x, y ที่นี่คือตำแหน่งสัมบูรณ์บน Canvas
    logoProps: { x: FRONT_CENTER_X - 50, y: 150, width: 100, height: 100, isDragging: false, offset: { x: 0, y: 0 } },
    customFont: 'Arial'
};

// --- ฟังก์ชันการวาดหลัก (Core Drawing Functions) ---

/** วาดรูปร่างเสื้อหลัก (ปรับ Path ให้รับ offsetX) */
function drawBodyShape(ctx, color, offsetX) {
    ctx.fillStyle = color;
    const bodyPath = new Path2D();
    
    const X = offsetX; 
    
    bodyPath.moveTo(X - 60, BASE_Y + 30); 
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
function drawPattern(ctx, patternStyle, patternColor, bodyPath, offsetX) {
    if (patternStyle === 'solid') return;

    ctx.save();
    ctx.clip(bodyPath); 
    ctx.fillStyle = patternColor;
    const X = offsetX;

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

        ctx.fillStyle = patternColor;
        ctx.fillRect(X - graphicWidth - offset, BASE_Y, graphicWidth, H);
        ctx.fillRect(X + offset, BASE_Y, graphicWidth, H);

        ctx.fillStyle = secondaryColor;
        
        ctx.beginPath();
        ctx.moveTo(X - graphicWidth - offset, BASE_Y);
        ctx.lineTo(X - offset, BASE_Y + 100);
        ctx.lineTo(X - graphicWidth - offset, BASE_Y + 150);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(X + offset, BASE_Y + 50);
        ctx.lineTo(X + graphicWidth + offset, BASE_Y + 150);
        ctx.lineTo(X + graphicWidth + offset, BASE_Y + 50);
        ctx.fill();
    }
    
    ctx.restore();
}

/** วาดคอเสื้อ 4 แบบ (ปรับให้รับ offsetX) */
function drawCollar(ctx, style, color, offsetX) {
    ctx.fillStyle = color;
    const neckTopY = BASE_Y + 30;
    const neckWidth = 60; 
    const X = offsetX;

    ctx.beginPath();
    
    if (style === 'round') {
        ctx.arc(X, neckTopY, neckWidth / 2 + 5, 0, Math.PI * 2, false);
    } else if (style === 'vneck') {
        ctx.moveTo(X - neckWidth / 2, neckTopY);
        ctx.lineTo(X, neckTopY + 20); 
        ctx.lineTo(X + neckWidth / 2, neckTopY);
        ctx.closePath();
    } else if (style === 'polo') {
        // วาดป้ายกระดุม (Placket)
        ctx.fillRect(X - 10, neckTopY, 20, 30); 
        // วาดปกเสื้อ
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
function drawText(ctx, textState, textColor, fontName, textProps, offsetX, isBackView) {
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
function drawLogo(ctx, logo, props) {
    if (logo) {
        // ตำแหน่งโลโก้ถูกเก็บแบบสัมบูรณ์ใน props.x และ props.y
        ctx.drawImage(logo, props.x, props.y, props.width, props.height);
    }
}


/** ฟังก์ชันรวม: วาด Canvas ใหม่ทั้งหมด (แบ่งครึ่ง) */
function drawJersey() {
    ctx.clearRect(0, 0, W, H); 
    
    // ----------------------------------------------------
    // A. วาดมุมมองด้านหน้า (Left Half)
    // ----------------------------------------------------
    const FRONT_CENTER_X_DRAW = CANVAS_CENTER_X - SHIRT_CENTER_OFFSET; // X=150
    
    const frontBodyPath = drawBodyShape(ctx, jerseyState.colors.body, FRONT_CENTER_X_DRAW);
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern, frontBodyPath, FRONT_CENTER_X_DRAW);
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar, FRONT_CENTER_X_DRAW);
    
    // วาดโลโก้ (ด้านหน้า)
    drawLogo(ctx, jerseyState.logo, jerseyState.logoProps); 
    
    // วาดหมายเลขเล็กๆ ด้านหน้า (isBackView = false)
    drawText(ctx, jerseyState.text, jerseyState.colors.text, jerseyState.customFont, jerseyState.textProps, FRONT_CENTER_X_DRAW, false);


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

/** อัปเดต State จาก UI และเรียกวาดใหม่ */
function updateStateAndRedraw() {
    jerseyState.collar = document.getElementById('collar-style').value;
    jerseyState.pattern = document.getElementById('pattern-style').value;
    jerseyState.colors.body = document.getElementById('body-color').value;
    jerseyState.colors.pattern = document.getElementById('pattern-color').value;
    jerseyState.colors.collar = document.getElementById('collar-color').value;
    jerseyState.colors.text = document.getElementById('text-color').value;
    jerseyState.text.name = document.getElementById('player-name').value.toUpperCase();
    jerseyState.text.number = document.getElementById('player-number').value;
    jerseyState.customFont = document.getElementById('current-font').value;

    // ต้องใช้ ?.value เพื่อจัดการเมื่อ element ยังไม่โหลด (หรือกรณีที่แก้ไข HTML ไม่สมบูรณ์)
    jerseyState.textProps.number.y = parseInt(document.getElementById('number-y')?.value) || H - 250;
    jerseyState.textProps.number.size = parseInt(document.getElementById('number-size')?.value) || 120;
    jerseyState.textProps.name.y = parseInt(document.getElementById('name-y')?.value) || H - 320;
    jerseyState.textProps.name.size = parseInt(document.getElementById('name-size')?.value) || 35;
    
    drawJersey();
}

/** จัดการการอัปโหลดโลโก้ */
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                jerseyState.logo = img;
                jerseyState.logoProps.width = 100; 
                jerseyState.logoProps.height = (100 / img.width) * img.height; 
                // ตั้งตำแหน่งเริ่มต้นให้อยู่ตรงกลางเสื้อด้านหน้า (X=150)
                jerseyState.logoProps.x = FRONT_CENTER_X - (jerseyState.logoProps.width / 2);
                drawJersey();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

/** จัดการการอัปโหลดฟอนต์ */
function handleFontUpload(event) {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.ttf') || file.name.endsWith('.otf'))) {
        const fontName = file.name.replace(/\.[^/.]+$/, "");
        const fontUrl = URL.createObjectURL(file);
        
        const customFont = new FontFace(fontName, `url(${fontUrl})`);
        customFont.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            const select = document.getElementById('current-font');
            const newOption = new Option(fontName, fontName);
            select.add(newOption);
            select.value = fontName;
            jerseyState.customFont = fontName;
            updateStateAndRedraw();
        }).catch(error => {
            console.error('Font loading failed:', error);
            alert('ไม่สามารถโหลดไฟล์ฟอนต์ได้');
        });
    }
}

/** ฟังก์ชันดาวน์โหลด */
function downloadJersey() {
    const dataURL = canvas.toDataURL('image/png'); 
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'jersey-design.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- การจัดการโลโก้ (Drag-and-Drop) ---

function getMousePos(e) {
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
    
    return jerseyState.logo && 
           // ตรวจสอบว่าพิกัดเมาส์อยู่ในพื้นที่การวาดโลโก้หรือไม่
           pos.x > p.x && pos.x < p.x + p.width &&
           pos.y > p.y && pos.y < p.y + p.height &&
           // ตรวจสอบให้แน่ใจว่าคลิกอยู่ในพื้นที่เสื้อด้านหน้าเท่านั้น (X < CANVAS_CENTER_X)
           pos.x < CANVAS_CENTER_X; 
}

function handleStart(e) {
    e.preventDefault();

    const mousePos = getMousePos(e);
    if (isInsideLogo(mousePos)) {
        jerseyState.logoProps.isDragging = true;
        jerseyState.logoProps.offset.x = mousePos.x - jerseyState.logoProps.x;
        jerseyState.logoProps.offset.y = mousePos.y - jerseyState.logoProps.y;
        canvas.style.cursor = 'grabbing';
    }
}

function handleMove(e) {
    if (!jerseyState.logoProps.isDragging) return;
    e.preventDefault();
    
    const mousePos = getMousePos(e);
    const p = jerseyState.logoProps;

    p.x = mousePos.x - p.offset.x;
    p.y = mousePos.y - p.offset.y;

    // จำกัดขอบเขตให้อยู่ในพื้นที่เสื้อด้านหน้า
    const minX = FRONT_CENTER_X - 150; // ขอบซ้ายสุดของเสื้อ (150 - 150)
    const maxX = CANVAS_CENTER_X - p.width; // ขอบขวาสุดของพื้นที่ด้านหน้า
    
    p.x = Math.max(minX, Math.min(p.x, maxX));
    
    drawJersey();
}

function handleEnd() {
    jerseyState.logoProps.isDragging = false;
    canvas.style.cursor = 'default';
}


/** ตั้งค่า Event Listeners ทั้งหมด */
function setupEventListeners() {
    // ผูก Event Controls
    document.querySelectorAll('#controls-area input, #controls-area select').forEach(control => {
        if (control.type !== 'file') {
            control.addEventListener('input', updateStateAndRedraw);
        }
    });

    // Logo & Font Upload
    document.getElementById('logo-upload')?.addEventListener('change', handleLogoUpload);
    document.getElementById('font-upload')?.addEventListener('change', handleFontUpload);

    // Download Button
    document.getElementById('download-btn')?.addEventListener('click', downloadJersey);

    // Canvas Drag-and-Drop (Mouse & Touch)
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseout', handleEnd); 
    
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);
}

// เริ่มต้นเว็บไซต์ (โค้ดนี้ต้องอยู่ท้ายไฟล์)
setupEventListeners();
drawJersey();
