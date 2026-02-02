/**
 * Heart Tree Animation - Final Layout
 */

const CONFIG = {
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    treeDuration: 10,
    swipeDuration: 2.0,
    colors: {
        trunk: '#FFB6C1',
        leaves: [
            '#EC4899', '#F472B6', '#EF4444', '#FBBF24',
            '#FCD34D', '#F97316', '#FB923C', '#F87171'
        ],
        text: '#FFFFFF'
    },
    messages: [
        "Salam Ibtissam",
        "Joyeux anniversaire pour tes 20 ans",
        "Je t'aime",
        "Qu'Allah t'accorde tout le bonheur du monde\net qu'Il exauce toutes tes du'as",
        "Profite de ta journée et garde le sourire\ncar ton sourire est magnifique",
        "Je t'aime fort fort fort"
    ]
};

const Easing = {
    easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeOutBack: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};

// --- Classes ---

class Trunk {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.targetHeight = 440;
        this.baseWidth = 65;
        this.topWidth = 30;
        this.currentHeight = 0;
        this.progress = 0;
    }

    update(time) {
        const duration = 1.8;
        if (time >= 0) {
            let t = Math.min(time / duration, 1);
            this.progress = Easing.easeOutQuad(t);
            this.currentHeight = this.targetHeight * this.progress;
        }
    }

    draw() {
        if (this.currentHeight <= 0) return;
        this.ctx.fillStyle = CONFIG.colors.trunk;

        this.ctx.beginPath();
        this.ctx.moveTo(this.x - this.baseWidth / 2, this.y);
        this.ctx.lineTo(this.x + this.baseWidth / 2, this.y);

        const curTopW = this.baseWidth + (this.topWidth - this.baseWidth) * this.progress;

        this.ctx.lineTo(this.x + curTopW / 2, this.y - this.currentHeight);
        this.ctx.lineTo(this.x - curTopW / 2, this.y - this.currentHeight);

        this.ctx.closePath();
        this.ctx.fill();

        // Gradient
        const grad = this.ctx.createLinearGradient(this.x - 30, this.y, this.x + 30, this.y);
        grad.addColorStop(0, "rgba(0,0,0,0.1)");
        grad.addColorStop(0.5, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.1)");
        this.ctx.fillStyle = grad;
        this.ctx.fill();
    }

    getTopPosition() {
        return { x: this.x, y: this.y - this.targetHeight };
    }
}

class Branch {
    constructor(ctx, startX, startY, angle, length, width, startTime) {
        this.ctx = ctx;
        this.startX = startX;
        this.startY = startY;
        this.angle = angle;
        this.length = length;
        this.width = width;
        this.startTime = startTime;
        this.duration = 0.8;
        this.currentLength = 0;
        this.children = [];
    }

    update(time) {
        if (time < this.startTime) return;
        let t = Math.min((time - this.startTime) / this.duration, 1);
        this.currentLength = this.length * Easing.easeInOutQuad(t);
        this.children.forEach(child => child.update(time));
    }

    draw() {
        if (this.currentLength <= 0) return;
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        const endX = this.startX + Math.cos(this.angle) * this.currentLength;
        const endY = this.startY + Math.sin(this.angle) * this.currentLength;
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = CONFIG.colors.trunk;
        this.ctx.lineWidth = this.width;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        this.children.forEach(child => child.draw());
    }
}

class Leaf {
    constructor(ctx, x, y, color, startTime) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.color = color;
        this.startTime = startTime;

        this.baseSize = 28 + (Math.random() - 0.5) * 14;
        this.rotation = -90 * (Math.PI / 180);
        this.targetRotation = (Math.random() * 60 - 30) * (Math.PI / 180);

        this.opacity = 0;
        this.scale = 0;
        this.duration = 0.7;
    }

    update(time) {
        if (time < this.startTime) return;
        let t = Math.min((time - this.startTime) / this.duration, 1);
        let ease = Easing.easeOutBack(t);

        this.scale = ease;
        this.opacity = Math.min(t * 3, 1);

        const startRot = -90 * (Math.PI / 180);
        this.currentRotation = startRot + (this.targetRotation - startRot) * Math.min(t * 1.5, 1);
    }

    draw() {
        if (this.scale <= 0) return;
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.currentRotation);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.globalAlpha = this.opacity;
        this.ctx.fillStyle = this.color;

        this.ctx.shadowColor = "rgba(0,0,0,0.3)";
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        const s = this.baseSize / 30;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10 * s);
        this.ctx.bezierCurveTo(-15 * s, -25 * s, -35 * s, -5 * s, 0, 15 * s);
        this.ctx.bezierCurveTo(35 * s, -5 * s, 15 * s, -25 * s, 0, -10 * s);
        this.ctx.fill();

        this.ctx.restore();
    }
}

class Particle {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -(Math.random() * 0.8 + 0.2);
        this.life = 1.0;
        this.decay = 0.003 + Math.random() * 0.005;
        this.size = 2 + Math.random() * 3;
        this.color = '#FFD700';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx += (Math.random() - 0.5) * 0.05;
    }

    draw() {
        if (this.life <= 0) return;
        this.ctx.globalAlpha = this.life * 0.6;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.color;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }
}

class TextTyper {
    constructor(ctx, messages, startTime) {
        this.ctx = ctx;
        this.messages = messages;
        this.startTime = startTime;
        this.lines = [];

        // Position Left side (approx 25-30% of width)
        const startX = CONFIG.resolution.width * 0.25;
        const startY = 320;
        const lineHeight = 75;
        let currentY = startY;

        let accumulatedTime = startTime;

        this.messages.forEach((msg, index) => {
            const subLines = msg.split('\n');
            subLines.forEach(subLine => {
                const duration = subLine.length * 0.04 + 0.3; // Faster typing

                this.lines.push({
                    text: subLine,
                    x: startX,
                    y: currentY,
                    startT: accumulatedTime,
                    duration: duration
                });

                currentY += lineHeight;
                accumulatedTime += duration + 0.2;
            });
            currentY += 25;
        });

        this.maxTime = accumulatedTime + 5;
    }

    draw(time) {
        if (time < this.startTime) return;

        this.ctx.save();
        this.ctx.font = "500 45px 'Outfit', sans-serif";
        this.ctx.textAlign = "left"; // Align left

        this.lines.forEach(line => {
            if (time >= line.startT) {
                const elapsed = time - line.startT;
                const charCount = Math.floor(elapsed / 0.04);
                const textToShow = line.text.substring(0, charCount);

                this.ctx.fillStyle = CONFIG.colors.text;
                this.ctx.globalAlpha = 1;

                if (line.text.includes("fort fort fort")) {
                    this.ctx.font = "bold 55px 'Outfit', sans-serif";
                    this.ctx.fillStyle = "#EC4899";
                } else {
                    this.ctx.font = "500 45px 'Outfit', sans-serif";
                    this.ctx.fillStyle = "#FFFFFF";
                }

                this.ctx.fillText(textToShow, line.x - 200, line.y); // Shift left a bit more to fit
            }
        });
        this.ctx.restore();
    }
}

// --- Main ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.resolution.width;
canvas.height = CONFIG.resolution.height;

let currentTime = 0;
let isPlaying = true;

let trunk;
let branches = [];
let leaves = [];
let particles = [];
let textTyper;

function initScene() {
    currentTime = 0;

    // Tree starts in Center
    trunk = new Trunk(ctx, canvas.width / 2, canvas.height);
    const top = trunk.getTopPosition();

    branches = [];
    const addBranch = (x, y, a, l, w, t) => branches.push(new Branch(ctx, x, y, a, l, w, t));

    addBranch(top.x, top.y, -Math.PI / 2 - 0.6, 144, 24, 0.5);
    addBranch(top.x, top.y, -Math.PI / 2 + 0.6, 144, 24, 0.5);
    addBranch(top.x, top.y, -Math.PI / 2, 108, 24, 0.6);

    // Heart center
    leaves = generateLeaves(top.x, top.y - 200);

    particles = [];

    // Text starts after swipe
    const textStartTime = CONFIG.treeDuration + CONFIG.swipeDuration;
    textTyper = new TextTyper(ctx, CONFIG.messages, textStartTime);
}

function generateLeaves(cx, cy) {
    const arr = [];
    const count = 750;

    for (let i = 0; i < count; i++) {
        let valid = false, lx, ly;
        let attempts = 0;
        while (!valid && attempts < 200) {
            attempts++;
            let rx = (Math.random() - 0.5) * 950;
            let ry = (Math.random() - 0.5) * 950;

            let scale = 300;
            let nx = rx / scale;
            let ny = -ry / scale;
            ny += 0.3;

            let x_check = nx * 1.1;
            let y_check = ny;

            let eq = Math.pow(x_check * x_check + y_check * y_check - 1, 3) - (x_check * x_check * Math.pow(y_check, 3));

            if (eq <= 0) {
                valid = true;
                lx = cx + rx;
                ly = cy + ry;
            }
        }
        if (valid) {
            const color = CONFIG.colors.leaves[Math.floor(Math.random() * CONFIG.colors.leaves.length)];
            const t = 1.2 + Math.random() * 3.8;
            arr.push(new Leaf(ctx, lx, ly, color, t));
        }
    }
    return arr;
}

function render(time) {
    // 1. Calculate Swipe Offset (To the RIGHT)
    // Canvas Width = 1920
    // Center = 960
    // Target = 960 + 480 (Quarter width) = 1440
    let swipeOffset = 0;
    if (time > CONFIG.treeDuration) {
        let t = Math.min((time - CONFIG.treeDuration) / CONFIG.swipeDuration, 1);
        let ease = Easing.easeInOutQuad(t);
        // Move Right by 25% of width
        swipeOffset = (CONFIG.resolution.width * 0.25) * ease;
    }

    // Background Black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Tree Phase (Swiped)
    ctx.save();
    ctx.translate(swipeOffset, 0); // Translate positive X

    trunk.update(time);
    trunk.draw();
    branches.forEach(b => { b.update(time); b.draw(); });
    leaves.forEach(l => { l.update(time); l.draw(); });

    // Particles attached to tree space? Or global? 
    // Let's attach them to tree space so they move with it
    if (time > 1.0) {
        if (Math.random() < 0.15) {
            particles.push(new Particle(ctx, canvas.width / 2 + (Math.random() - 0.5) * 900, canvas.height / 2 + (Math.random() - 0.5) * 800));
        }
        particles.forEach((p, index) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(index, 1);
        });
    }

    ctx.restore();

    // Draw Text Phase
    // Text does NOT move. Used global coord.
    textTyper.draw(time);
}

// Auto-play loop
function loop() {
    if (!isPlaying) return;

    let now = performance.now();
    let dt = (now - lastTime) / 1000;
    lastTime = now;

    if (dt > 0.1) dt = 0.1;

    currentTime += dt;
    render(currentTime);

    requestAnimationFrame(loop);
}

let lastTime = performance.now();
initScene();
loop();
console.log("Layout v2 initialized.");
