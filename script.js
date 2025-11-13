document.addEventListener('DOMContentLoaded', () => {

    // --- 1. การตั้งค่าเบื้องต้น ---
    const canvas = document.getElementById('jerseyCanvas');
    const ctx = canvas.getContext('2d');

    // อ้างอิง DOM Elements
    const controls = {
        collarSelect: document.getElementById('collarSelect'),
        patternSelect: document.getElementById('patternSelect'),
        baseColor: document.getElementById('baseColor'),
        patternColor: document.getElementById('patternColor'),
        collarColor: document.getElementById('collarColor'),
        logoUpload: document.getElementById('logoUpload'),
        playerName: document.getElementById('playerName'),
        playerNumber: document.getElementById('playerNumber'),
        textColor: document.getElementById('textColor'),
        fontUpload: document.getElementById('fontUpload'),
        fontSelect: document.getElementById('fontSelect'),
    };

    // สถานะ (State) ของการออกแบบทั้งหมด
    let state = {
        baseColor: '#FFFFFF',
        pattern: 'solid',
        patternColor: '#FF0000',
        collar: 'round',
        collarColor: '#000000',
        logo: null, // จะเก็บ Image object
        logoPos: { x: 250, y: 450 },
        logoSize: { width: 80, height: 80 },
        playerName: 'PLAYER',
        playerNumber: '10',
        textColor: '#000000',
        fontFamily: 'Arial',
        loadedFonts: {}, // เก็บชื่อฟอนต์ที่โหลดแล้ว
    };

    // ตัวแปรสำหรับการลาก-วาง และปรับขนาด
    let isDragging = false;
    let isResizing = false;
    let dragStart = { x: 0, y: 0 };
    const resizeHandleSize = 10; // ขนาดของจุดปรับขนาด

    // --- 2. ฟังก์ชันหลักในการวาด (Render Function) ---

    function drawJersey() {
        // ล้าง Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- วาดตัวเสื้อ (Base Shape) ---
        // เราจะวาดทรงเสื้อ (ด้านหลัง) แล้ว clip เพื่อให้ลายอยู่แค่ในเสื้อ
        ctx.save();
        drawJerseyShape();
        ctx.fillStyle = state.baseColor;
        ctx.fill();
        ctx.clip(); // **สำคัญ: จำกัดพื้นที่วาดหลังจากนี้ให้อยู่ในทรงเสื้อ**

        // --- วาดลาย (Pattern) ---
        drawPattern();
        
        ctx.restore(); // **สำคัญ: ยกเลิกการ clip**
        
        // --- วาดคอเสื้อ (Collar) ---
        // วาดทับบนตัวเสื้อ
        drawCollar();

        // --- วาดชื่อและหมายเลข ---
        drawText();

        // --- วาดโลโก้ ---
        if (state.logo) {
            ctx.drawImage(
                state.logo,
                state.logoPos.x - state.logoSize.width / 2,
                state.logoPos.y - state.logoSize.height / 2,
                state.logoSize.width,
                state.logoSize.height
            );
            // วาดจุดปรับขนาด (Resize Handle)
            ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
            ctx.fillRect(
                state.logoPos.x + state.logoSize.width / 2 - resizeHandleSize / 2,
                state.logoPos.y + state.logoSize.height / 2 - resizeHandleSize / 2,
                resizeHandleSize,
                resizeHandleSize
            );
        }
    }

    // --- 3. ฟังก์ชันช่วยวาด (Drawing Helpers) ---

    function drawJerseyShape() {
        // 
        // นี่คือพิกัด (path) ของทรงเสื้อด้านหลังแบบง่ายๆ
        ctx.beginPath();
        ctx.moveTo(120, 50);  // ไหล่ซ้าย
        ctx.lineTo(180, 80);  // แขนซ้าย (เริ่ม)
        ctx.lineTo(170, 140); // ใต้แขนซ้าย
        ctx.lineTo(190, 550); // ชายเสื้อซ้าย
        ctx.lineTo(310, 550); // ชายเสื้อขวา
        ctx.lineTo(330, 140); // ใต้แขนขวา
        ctx.lineTo(320, 80);  // แขนขวา (เริ่ม)
        ctx.lineTo(380, 50);  // ไหล่ขวา
        ctx.quadraticCurveTo(250, 20, 120, 50); // ส่วนโค้งคอด้านหลัง
        ctx.closePath();
    }

    function drawPattern() {
        ctx.fillStyle = state.patternColor;
        const w = canvas.width;
        const h = canvas.height;

        switch (state.pattern) {
            case 'stripes':
                // ลายทางแนวตั้ง
                for (let i = 0; i < w; i += 40) {
                    ctx.fillRect(i, 0, 20, h);
                }
                break;
            case 'checkers':
                // ลายตาราง
                for (let y = 0; y < h; y += 20) {
                    for (let x = 0; x < w; x += 20) {
                        if ((x / 20 + y / 20) % 2 === 0) {
                            ctx.fillRect(x, y, 20, 20);
                        }
                    }
                }
                break;
            case 'digital':
                // ลายดิจิทัล (สุ่มสี่เหลี่ยมเล็กๆ)
                for (let i = 0; i < 1000; i++) {
                    ctx.fillRect(Math.random() * w, Math.random() * h, 10, 10);
                }
                break;
            case 'solid':
            default:
                // ไม่ต้องทำอะไร (สีพื้นถูกวาดไปแล้ว)
                break;
        }
    }

    function drawCollar() {
        ctx.fillStyle = state.collarColor;
        ctx.strokeStyle = state.collarColor;
        ctx.lineWidth = 4;

        ctx.beginPath();
        switch (state.collar) {
            case 'v-neck':
                ctx.moveTo(210, 35);
                ctx.lineTo(250, 70);
                ctx.lineTo(290, 35);
                ctx.stroke();
                break;
            case 'polo':
                ctx.fillRect(210, 30, 80, 10); // ปก
                ctx.beginPath();
                ctx.moveTo(220, 40);
                ctx.lineTo(250, 65);
                ctx.lineTo(280, 40);
                ctx.stroke();
                break;
            case 'mandarin':
                ctx.fillRect(210, 30, 80, 15); // ปกตั้ง
                break;
            case 'round':
            default:
                ctx.arc(250, 35, 40, 0, Math.PI, false); // คอกลม (ครึ่งวงกลม)
                ctx.stroke();
                break;
        }
    }

    function drawText() {
        ctx.fillStyle = state.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // วาดชื่อ
        ctx.font = `bold 40px "${state.fontFamily}"`; // ใช้ฟอนต์จาก state
        ctx.fillText(state.playerName.toUpperCase(), 250, 120);

        // วาดหมายเลข
        ctx.font = `bold 120px "${state.fontFamily}"`; // ใช้ฟอนต์จาก state
        ctx.fillText(state.playerNumber, 250, 220);
    }

    // --- 4. Event Listeners (การเชื่อมต่อ Controls กับ State) ---

    // ฟังก์ชันทั่วไปสำหรับอัปเดต state และวาดใหม่
    function updateState(key, value) {
        state[key] = value;
        drawJersey();
    }

    // เชื่อมต่อ Controls
    controls.collarSelect.addEventListener('change', (e) => updateState('collar', e.target.value));
    controls.patternSelect.addEventListener('change', (e) => updateState('pattern', e.target.value));
    controls.baseColor.addEventListener('input', (e) => updateState('baseColor', e.target.value));
    controls.patternColor.addEventListener('input', (e) => updateState('patternColor', e.target.value));
    controls.collarColor.addEventListener('input', (e) => updateState('collarColor', e.target.value));
    controls.playerName.addEventListener('input', (e) => updateState('playerName', e.target.value));
    controls.playerNumber.addEventListener('input', (e) => updateState('playerNumber', e.target.value));
    controls.textColor.addEventListener('input', (e) => updateState('textColor', e.target.value));
    controls.fontSelect.addEventListener('change', (e) => updateState('fontFamily', e.target.value));

    // --- 5. การจัดการไฟล์ (โลโก้ และ ฟอนต์) ---

    // การอัปโหลดโลโก้
    controls.logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    state.logo = img;
                    // ตั้งค่าเริ่มต้นของโลโก้
                    state.logoSize = { width: 80, height: (img.height / img.width) * 80 };
                    state.logoPos = { x: 250, y: 350 }; // ตำแหน่งกลางๆ ด้านล่าง
                    drawJersey();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // **การอัปโหลดฟอนต์ (ขั้นสูง)**
    controls.fontUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fontName = file.name.split('.').slice(0, -1).join('.'); // เอาชื่อไฟล์ (ไม่เอานามสกุล)
        
        // ตรวจสอบว่าเคยโหลดฟอนต์นี้หรือยัง
        if (state.loadedFonts[fontName]) {
            controls.fontSelect.value = fontName;
            updateState('fontFamily', fontName);
            return;
        }

        try {
            const fontData = await file.arrayBuffer(); // อ่านไฟล์เป็น ArrayBuffer
            
            // สร้าง FontFace object
            const fontFace = new FontFace(fontName, fontData);
            
            // โหลดและเพิ่มฟอนต์เข้าไปใน document
            await fontFace.load();
            document.fonts.add(fontFace);

            // เพิ่มฟอนต์นี้ใน state และ dropdown
            state.loadedFonts[fontName] = true;
            const option = document.createElement('option');
            option.value = fontName;
            option.text = fontName;
            controls.fontSelect.appendChild(option);

            // เลือกใช้ฟอนต์ใหม่ทันที
            controls.fontSelect.value = fontName;
            updateState('fontFamily', fontName);

        } catch (err) {
            console.error('ไม่สามารถโหลดฟอนต์ได้:', err);
            alert('เกิดข้อผิดพลาดในการโหลดฟอนต์');
        }
    });


    // --- 6. การจัดการ Canvas Interaction (ลาก-วาง, ปรับขนาด) ---

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function isClickOnLogo(pos) {
        if (!state.logo) return false;
        const halfW = state.logoSize.width / 2;
        const halfH = state.logoSize.height / 2;
        return (
            pos.x >= state.logoPos.x - halfW && pos.x <= state.logoPos.x + halfW &&
            pos.y >= state.logoPos.y - halfH && pos.y <= state.logoPos.y + halfH
        );
    }

    function isClickOnResizeHandle(pos) {
        if (!state.logo) return false;
        const handleX = state.logoPos.x + state.logoSize.width / 2 - resizeHandleSize / 2;
        const handleY = state.logoPos.y + state.logoSize.height / 2 - resizeHandleSize / 2;
        return (
            pos.x >= handleX && pos.x <= handleX + resizeHandleSize &&
            pos.y >= handleY && pos.y <= handleY + resizeHandleSize
        );
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        
        if (isClickOnResizeHandle(pos)) {
            isResizing = true;
            isDragging = false;
            dragStart = pos;
            canvas.style.cursor = 'se-resize';
        } else if (isClickOnLogo(pos)) {
            isDragging = true;
            isResizing = false;
            dragStart = { x: pos.x - state.logoPos.x, y: pos.y - state.logoPos.y };
            canvas.style.cursor = 'move';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (isDragging) {
            state.logoPos.x = pos.x - dragStart.x;
            state.logoPos.y = pos.y - dragStart.y;
            drawJersey();
        } else if (isResizing) {
            // คำนวณขนาดใหม่โดยคงอัตราส่วน
            const deltaX = pos.x - dragStart.x;
            const deltaY = pos.y - dragStart.y;
            
            // ใช้ค่าที่เปลี่ยนแปลงมากที่สุดในการปรับขนาด
            const delta = Math.max(deltaX, deltaY); 
            const originalAspectRatio = state.logo.height / state.logo.width;
            
            state.logoSize.width += delta;
            state.logoSize.height = state.logoSize.width * originalAspectRatio;

            // อัปเดต dragStart ไปยังตำแหน่งปัจจุบัน
            dragStart = pos; 
            drawJersey();
        } else {
            // เปลี่ยน cursor เมื่อ hover
            if (isClickOnResizeHandle(pos)) {
                canvas.style.cursor = 'se-resize';
            } else if (isClickOnLogo(pos)) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        canvas.style.cursor = 'default';
    });
    
    canvas.addEventListener('mouseout', () => {
        isDragging = false;
        isResizing = false;
        canvas.style.cursor = 'default';
    });

    // --- 7. เริ่มต้นวาดครั้งแรก ---
    drawJersey();

});
