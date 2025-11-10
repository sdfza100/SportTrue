// script.js
const canvas = document.getElementById('jerseyCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const CENTER_X = W / 2;
const BASE_Y = 50; // จุดเริ่มต้นในการวาดเสื้อ

// State Object
let jerseyState = {
    collar: 'round',
    pattern: 'solid',
    colors: {
        body: '#FFFFFF', pattern: '#0056A8', collar: '#CC0000', text: '#000000'
    },
    text: { name: 'GEMINI', number: '10' },
    logo: null,
    // ตำแหน่งเริ่มต้นของโลโก้
    logoProps: { x: CENTER_X - 50, y: 150, width: 100, height: 100, isDragging: false, offset: { x: 0, y: 0 } },
    customFont: 'Arial'
};

// --- ฟังก์ชันการวาดหลัก (Core Drawing Functions) ---

/** วาดรูปร่างเสื้อหลักและส่ง Path กลับมาสำหรับการ Clipping */
function drawBodyShape(ctx, color) {
    ctx.fillStyle = color;
    const bodyPath = new Path2D();
    
    // 1. จุดเริ่มต้น: คอเสื้อด้านซ้าย
    bodyPath.moveTo(CENTER_X - 70, BASE_Y + 40); 
    
    // 2. ไหล่ซ้ายและแขน
    bodyPath.bezierCurveTo(
        CENTER_X - 180, BASE_Y,      
        CENTER_X - 250, BASE_Y + 150, 
        CENTER_X - 200, BASE_Y + 250  // สิ้นสุดที่ปลายแขนซ้าย
    );
    
    // 3. ด้านข้างซ้าย
    bodyPath.lineTo(CENTER_X - 150, H - 150); 

    // 4. ชายเสื้อด้านล่าง (โค้งเล็กน้อย)
    bodyPath.quadraticCurveTo(
        CENTER_X, H - 100, 
        CENTER_X + 150, H - 150 // สิ้นสุดที่ชายเสื้อด้านขวา
    );
    
    // 5. ด้านข้างขวา
    bodyPath.lineTo(CENTER_X + 200, BASE_Y + 250);

    // 6. แขนขวาและไหล่
    bodyPath.bezierCurveTo(
        CENTER_X + 250, BASE_Y + 150, 
        CENTER_X + 180, BASE_Y,      
        CENTER_X + 70, BASE_Y + 40   // สิ้นสุดที่คอเสื้อด้านขวา
    );

    // 7. ปิด Path (สำคัญมากเพื่อให้ fill สีได้)
    bodyPath.closePath();

    ctx.fill(bodyPath);
    return bodyPath;
}

/** วาดลวดลายบนตัวเสื้อ */
function drawPattern(ctx, patternStyle, patternColor, bodyPath) {
    if (patternStyle === 'solid') return;

    ctx.save();
    ctx.clip(bodyPath); // จำกัดการวาดด้วยรูปร่างเสื้อ
    ctx.fillStyle = patternColor;

    if (patternStyle === 'stripes') {
        const stripeWidth = 20;
        const gap = 10;
        // วาดลายทางแนวตั้งภายในขอบเขตเสื้อ
        for (let x = CENTER_X - 200; x < CENTER_X + 200; x += (stripeWidth + gap)) {
            ctx.fillRect(x, BASE_Y, stripeWidth, H - BASE_Y);
        }
    } else if (patternStyle === 'checkered') {
        const squareSize = 30;
        // วาดลายตารางภายในขอบเขตเสื้อ
        for (let r = BASE_Y; r < H; r += squareSize) {
            for (let c = CENTER_X - 250; c < CENTER_X + 250; c += squareSize) {
                if (((r - BASE_Y) / squareSize + (c - CENTER_X + 250) / squareSize) % 2 === 0) {
                    ctx.fillRect(c, r, squareSize, squareSize);
                }
            }
        }
    }
    ctx.restore();
}

/** วาดคอเสื้อ 4 แบบ */
function drawCollar(ctx, style, color) {
    ctx.fillStyle = color;
    const neckTopY = BASE_Y + 30;
    const neckWidth = 60; 

    ctx.beginPath();
    
    if (style === 'round') {
        ctx.arc(CENTER_X, neckTopY, neckWidth / 2 + 5, 0, Math.PI * 2, false);
    } else if (style === 'vneck') {
        ctx.moveTo(CENTER_X - neckWidth / 2, neckTopY);
        ctx.lineTo(CENTER_X, neckTopY + 20); 
        ctx.lineTo(CENTER_X + neckWidth / 2, neckTopY);
        ctx.closePath();
    } else if (style === 'polo') {
        ctx.fillRect(CENTER_X - 10, neckTopY, 20, 30); // แถบกระดุม
        ctx.moveTo(CENTER_X - 5, neckTopY);
        ctx.lineTo(CENTER_X - 50, neckTopY - 10);
        ctx.lineTo(CENTER_X - 50, neckTopY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(CENTER_X + 5, neckTopY);
        ctx.lineTo(CENTER_X + 50, neckTopY - 10);
        ctx.lineTo(CENTER_X + 50, neckTopY + 20);
        ctx.closePath();
    } else if (style === 'mandarin') {
        ctx.rect(CENTER_X - neckWidth / 2 - 5, neckTopY - 5, neckWidth + 10, 15);
    }

    ctx.fill();
}

/** วาดชื่อและหมายเลข (ด้านหลังเสื้อ) */
function drawText(ctx, textState, textColor, fontName) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    
    // หมายเลข
    ctx.font = `bold 120px ${fontName}, sans-serif`; 
    ctx.fillText(textState.number, CENTER_X, H - 250);
    
    // ชื่อ
    ctx.font = `35px ${fontName}, sans-serif`;
    ctx.fillText(textState.name, CENTER_X, H - 320);
}

/** วาดโลโก้ */
function drawLogo(ctx, logo, props) {
    if (logo) {
        ctx.drawImage(logo, props.x, props.y, props.width, props.height);
    }
}

/** ฟังก์ชันรวม: วาด Canvas ใหม่ทั้งหมด */
function drawJersey() {
    ctx.clearRect(0, 0, W, H); 
    const bodyPath = drawBodyShape(ctx, jerseyState.colors.body);
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern, bodyPath);
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar);
    drawText(ctx, jerseyState.text, jerseyState.colors.text, jerseyState.customFont);
    drawLogo(ctx, jerseyState.logo, jerseyState.logoProps);
}

// --- การจัดการ Event Listeners และ Logic ---

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

    // คำนวณพิกัดบน Canvas
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function isInsideLogo(pos) {
    const p = jerseyState.logoProps;
    return jerseyState.logo && 
           pos.x > p.x && pos.x < p.x + p.width &&
           pos.y > p.y && pos.y < p.y + p.height;
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
    
    drawJersey();
}

function handleEnd() {
    jerseyState.logoProps.isDragging = false;
    canvas.style.cursor = 'default';
}


/** ตั้งค่า Event Listeners ทั้งหมด */
function setupEventListeners() {
    // UI Controls 
    document.querySelectorAll('#controls-area input, #controls-area select').forEach(control => {
        if (control.type !== 'file') {
            control.addEventListener('input', updateStateAndRedraw);
        }
    });

    // Logo & Font Upload
    document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
    document.getElementById('font-upload').addEventListener('change', handleFontUpload);
    document.getElementById('current-font').addEventListener('change', updateStateAndRedraw);

    // Download Button
    document.getElementById('download-btn').addEventListener('click', downloadJersey);

    // Canvas Drag-and-Drop (Mouse & Touch)
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseout', handleEnd); 
    
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);
}

// เริ่มต้นเว็บไซต์
setupEventListeners();
drawJersey();
