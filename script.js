// script.js

const canvas = document.getElementById('jerseyCanvas');
const ctx = canvas.getContext('2d');
const controls = {
    collarStyle: document.getElementById('collar-style'),
    patternStyle: document.getElementById('pattern-style'),
    bodyColor: document.getElementById('body-color'),
    patternColor: document.getElementById('pattern-color'),
    collarColor: document.getElementById('collar-color'),
    playerName: document.getElementById('player-name'),
    playerNumber: document.getElementById('player-number'),
    textColor: document.getElementById('text-color'),
    // ... อื่นๆ
};

let jerseyState = {
    // กำหนดค่าเริ่มต้น
    collar: controls.collarStyle.value,
    pattern: controls.patternStyle.value,
    colors: {
        body: controls.bodyColor.value,
        pattern: controls.patternColor.value,
        collar: controls.collarColor.value,
        text: controls.textColor.value
    },
    text: { name: '', number: '' },
    logo: null, // โลโก้ที่อัปโหลด (Image object หรือ null)
    logoProps: { x: 50, y: 50, width: 100, height: 100, isDragging: false, isResizing: false, offset: { x: 0, y: 0 } },
    customFont: 'Arial' // ฟอนต์ปัจจุบัน
};

// 1. ฟังก์ชันวาดเสื้อหลัก (ต้องมีการวาดรูปร่างเสื้อ, คอเสื้อ, ลาย)
function drawJersey() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1.1 วาดรูปร่างเสื้อพื้นฐาน
    // (ใช้ Path2D หรือชุดคำสั่ง lineTo/arcTo เพื่อวาดรูปร่าง 2 มิติของเสื้อ)
    drawBodyShape(ctx, canvas.width / 2, canvas.height / 2, jerseyState.colors.body);
    
    // 1.2 วาดลายเสื้อ (Pattern)
    drawPattern(ctx, jerseyState.pattern, jerseyState.colors.pattern);
    
    // 1.3 วาดคอเสื้อ (Collar - วาดทับ)
    drawCollar(ctx, jerseyState.collar, jerseyState.colors.collar);

    // 1.4 วาดชื่อและหมายเลข (ด้านหลัง)
    // สำหรับเสื้อด้านหน้า 2D อาจวาดแค่หมายเลขเล็กๆ ด้านหน้า หรือสมมติเป็นมุมมองด้านหลัง
    drawText(ctx, jerseyState.text.name, jerseyState.text.number, jerseyState.colors.text, jerseyState.customFont);

    // 1.5 วาดโลโก้ (ถ้ามี)
    if (jerseyState.logo) {
        ctx.drawImage(
            jerseyState.logo, 
            jerseyState.logoProps.x, 
            jerseyState.logoProps.y, 
            jerseyState.logoProps.width, 
            jerseyState.logoProps.height
        );
        // อัปเดตตำแหน่ง HTML Control Overlay
        updateLogoControls();
    }
}

// 2. การจัดการ Event Listener
function setupEventListeners() {
    // 2.1 Event สำหรับการเปลี่ยนแปลงทั่วไป (สี, คอ, ลาย, ชื่อ, หมายเลข)
    Object.values(controls).forEach(control => {
        control.addEventListener('input', updateStateAndRedraw);
    });

    function updateStateAndRedraw() {
        jerseyState.collar = controls.collarStyle.value;
        jerseyState.pattern = controls.patternStyle.value;
        jerseyState.colors.body = controls.bodyColor.value;
        jerseyState.colors.pattern = controls.patternColor.value;
        jerseyState.colors.collar = controls.collarColor.value;
        jerseyState.colors.text = controls.textColor.value;
        jerseyState.text.name = controls.playerName.value.toUpperCase();
        jerseyState.text.number = controls.playerNumber.value;
        jerseyState.customFont = document.getElementById('current-font').value;
        drawJersey();
    }

    // 2.2 โลโก้: อัปโหลดและแสดงผล (Image Upload & Draw)
    document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
    // ... (ฟังก์ชัน handleLogoUpload จะใช้ FileReader และ Image() object)

    // 2.3 โลโก้: Drag-and-Drop & Resize (ต้องใช้ Mouse/Touch Event บน Canvas)
    // ต้องมีฟังก์ชัน `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
    // เพื่อตรวจสอบว่าคลิกถูกโลโก้ หรือถูกปุ่มปรับขนาด (Resize Handle) แล้วอัปเดต jerseyState.logoProps
    // การคำนวณ Drag/Resize บน Canvas ต้องสัมพันธ์กับตำแหน่งของ canvas element
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    // ... (และสำหรับ Touch Events)

    // 2.4 ฟอนต์: อัปโหลดฟอนต์ขั้นสูง (Font Loading API)
    document.getElementById('font-upload').addEventListener('change', handleFontUpload);
    document.getElementById('current-font').addEventListener('change', updateStateAndRedraw);
    
    // ... (ฟังก์ชัน handleFontUpload จะใช้ FontFace API)

    // 2.5 ปุ่มดาวน์โหลด
    document.getElementById('download-btn').addEventListener('click', downloadJersey);
}

// 3. ฟังก์ชันการจัดการฟอนต์ (.ttf/.otf)
function handleFontUpload(event) {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.ttf') || file.name.endsWith('.otf'))) {
        const fontName = file.name.replace(/\.[^/.]+$/, ""); // ชื่อฟอนต์จากชื่อไฟล์
        const fontUrl = URL.createObjectURL(file);
        
        // **ใช้ FontFace API**
        const customFont = new FontFace(fontName, `url(${fontUrl})`);
        customFont.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            // เพิ่มฟอนต์ใน Dropdown
            const select = document.getElementById('current-font');
            const newOption = new Option(fontName, fontName);
            select.add(newOption);
            select.value = fontName; // เลือกฟอนต์ที่เพิ่งโหลด
            jerseyState.customFont = fontName;
            drawJersey(); // วาดใหม่ด้วยฟอนต์ใหม่
        }).catch(error => {
            console.error('Font loading failed:', error);
            alert('ไม่สามารถโหลดไฟล์ฟอนต์ได้');
        });
    }
}

// 4. ฟังก์ชันสำหรับการวาดรูปร่างต่าง ๆ (ต้องสร้าง Path ของรูปทรงต่าง ๆ ขึ้นมา)
// ตัวอย่าง: การวาดคอเสื้อ (Collar)
function drawCollar(ctx, style, color) {
    ctx.save();
    ctx.fillStyle = color;
    // ... (โค้ดสำหรับวาด Path ของคอเสื้อแต่ละแบบ)
    switch(style) {
        case 'round':
            // วาด Path สำหรับคอกลม
            break;
        case 'vneck':
            // วาด Path สำหรับคอวี
            break;
        case 'polo':
            // วาด Path สำหรับคอปกโปโล
            break;
        case 'mandarin':
            // วาด Path สำหรับคอปกจีน/ตั้ง
            break;
    }
    ctx.fill();
    ctx.restore();
}

// ... ฟังก์ชัน drawBodyShape, drawPattern, drawText, handleLogoUpload, updateLogoControls, 
// ... handleMouseDown, handleMouseMove, handleMouseUp, downloadJersey

// เริ่มต้น
setupEventListeners();
// วาดเสื้อครั้งแรกด้วยค่าเริ่มต้น
// เนื่องจากไม่มีรูปภาพเสื้อต้นแบบ คุณต้องวาดรูปร่างเสื้อฟุตบอล 2D ด้วย Path บน Canvas เอง 
//  
drawJersey();