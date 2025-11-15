// متغيرات عامة
let currentImage = null;
let currentShape = 'circle';
let currentSize = 256;
let canvas = null;
let ctx = null;

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('previewCanvas');
    ctx = canvas.getContext('2d');
    
    // تحميل الوضع المحفوظ
    loadTheme();
    
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const themeToggle = document.getElementById('themeToggle');
    
    // تبديل الوضع
    themeToggle.addEventListener('click', toggleTheme);
    
    // رفع الصورة
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // زر تغيير الصورة
    const changeImageBtn = document.getElementById('changeImageBtn');
    changeImageBtn.addEventListener('click', () => fileInput.click());
    
    // اختيار الشكل
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentShape = btn.dataset.shape;
        });
    });
    
    // اختيار الحجم
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = parseInt(btn.dataset.size);
            document.getElementById('customWidth').value = currentSize;
            document.getElementById('customHeight').value = currentSize;
        });
    });
    
    // الحجم المخصص
    document.getElementById('customWidth').addEventListener('input', updateCustomSize);
    document.getElementById('customHeight').addEventListener('input', updateCustomSize);
    
    // تحويل الصورة
    convertBtn.addEventListener('click', convertImage);
    
    // تحميل الصورة
    downloadBtn.addEventListener('click', downloadImage);
}

// معالجة السحب والإفلات
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    e.currentTarget.style.background = isDark ? '#1e293b' : '#f0fdf4';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        loadImage(files[0]);
    }
}

// معالجة اختيار الملف
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
}

// تحميل الصورة
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            
            // عرض الصورة المرفوعة
            const uploadedImage = document.getElementById('uploadedImage');
            uploadedImage.src = e.target.result;
            document.getElementById('uploadedImageSection').style.display = 'block';
            
            // إخفاء منطقة الرفع
            document.getElementById('uploadSection').style.display = 'none';
            
            // إظهار قسم التحكم
            document.getElementById('controlsSection').style.display = 'block';
            document.getElementById('customWidth').value = currentSize;
            document.getElementById('customHeight').value = currentSize;
            
            // إخفاء قسم المعاينة إذا كان موجود
            document.getElementById('previewSection').style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// تحديث الحجم المخصص
function updateCustomSize() {
    const width = parseInt(document.getElementById('customWidth').value) || currentSize;
    const height = parseInt(document.getElementById('customHeight').value) || currentSize;
    currentSize = Math.max(width, height);
}

// استخراج اللون السائد من الصورة
function getDominantColor(image) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // تقليل حجم الصورة للتحليل السريع
    const sampleSize = 50;
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    tempCtx.drawImage(image, 0, 0, sampleSize, sampleSize);
    
    const imageData = tempCtx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    
    // حساب متوسط الألوان
    let r = 0, g = 0, b = 0, count = 0;
    
    // أخذ عينات من الصورة (كل 4 بكسل)
    for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// تحويل الصورة
function convertImage() {
    if (!currentImage) return;
    
    const keepAspectRatio = document.getElementById('keepAspectRatio').checked;
    const addPadding = document.getElementById('addPadding').checked;
    
    const width = parseInt(document.getElementById('customWidth').value) || currentSize;
    const height = parseInt(document.getElementById('customHeight').value) || currentSize;
    
    // تعيين حجم الكانفاس
    canvas.width = width;
    canvas.height = height;
    
    // حساب موضع وأبعاد الصورة
    let x = 0, y = 0, drawWidth = width, drawHeight = height;
    
    if (addPadding) {
        const padding = Math.min(width, height) * 0.1;
        x = padding;
        y = padding;
        drawWidth = width - (padding * 2);
        drawHeight = height - (padding * 2);
    }
    
    // حساب الأبعاد مع الحفاظ على نسبة العرض إلى الارتفاع
    if (keepAspectRatio) {
        const imageAspect = currentImage.width / currentImage.height;
        const drawAspect = drawWidth / drawHeight;
        
        if (imageAspect > drawAspect) {
            // الصورة أوسع - نضبط الارتفاع
            const newHeight = drawWidth / imageAspect;
            y = y + (drawHeight - newHeight) / 2;
            drawHeight = newHeight;
        } else {
            // الصورة أطول - نضبط العرض
            const newWidth = drawHeight * imageAspect;
            x = x + (drawWidth - newWidth) / 2;
            drawWidth = newWidth;
        }
    }
    
    // التحقق إذا كانت الصورة تحتاج خلفية (للأشكال الدائرية أو عندما تكون الصورة غير مربعة)
    // نحتاج خلفية إذا:
    // 1. الشكل دائري/سداسي/نجمة
    // 2. والصورة غير مربعة أو تم الحفاظ على نسبة العرض إلى الارتفاع
    // 3. وهناك مساحة فارغة حول الصورة
    const isCircularShape = currentShape === 'circle' || currentShape === 'hexagon' || currentShape === 'star';
    const hasEmptySpace = x > 0 || y > 0 || drawWidth < width || drawHeight < height;
    const needsBackground = isCircularShape && hasEmptySpace;
    
    // استخراج اللون السائد إذا كانت تحتاج خلفية
    let backgroundColor = null;
    if (needsBackground) {
        backgroundColor = getDominantColor(currentImage);
    }
    
    // مسح الكانفاس (شفاف)
    ctx.clearRect(0, 0, width, height);
    
    // إذا كان هناك خلفية، نرسمها أولاً داخل الشكل
    if (backgroundColor) {
        ctx.save();
        createShapePath(ctx, width, height, currentShape);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
    }
    
    // إنشاء المسار حسب الشكل وتطبيق clip
    createShapePath(ctx, width, height, currentShape);
    ctx.clip();
    
    // رسم الصورة
    ctx.drawImage(currentImage, x, y, drawWidth, drawHeight);
    
    // إظهار قسم المعاينة
    document.getElementById('previewSection').style.display = 'block';
}

// إنشاء مسار الشكل
function createShapePath(ctx, width, height, shape) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
    ctx.beginPath();
    
    switch(shape) {
        case 'circle':
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            break;
            
        case 'square':
            ctx.rect(0, 0, width, height);
            break;
            
        case 'rounded':
            const cornerRadius = Math.min(width, height) * 0.2;
            drawRoundedRect(ctx, 0, 0, width, height, cornerRadius);
            break;
            
        case 'hexagon':
            drawHexagon(ctx, centerX, centerY, radius);
            break;
            
        case 'star':
            drawStar(ctx, centerX, centerY, radius, 5);
            break;
    }
    
    ctx.closePath();
}

// رسم سداسي
function drawHexagon(ctx, x, y, radius) {
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
}

// رسم مستطيل مستدير
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

// رسم نجمة
function drawStar(ctx, x, y, radius, points) {
    const outerRadius = radius;
    const innerRadius = radius * 0.5;
    const angleStep = (Math.PI * 2) / (points * 2);
    
    for (let i = 0; i < points * 2; i++) {
        const angle = angleStep * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
}

// تحميل الصورة
function downloadImage() {
    const link = document.createElement('a');
    link.download = `image-${currentShape}-${currentSize}x${currentSize}.png`;
    // استخدام PNG مع دعم الشفافية
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// إدارة الوضع الداكن/الفاتح
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

