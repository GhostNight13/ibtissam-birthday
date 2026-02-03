/**
 * Heart Tree Animation - Redesign
 * Interaction: Start -> Falling Heart -> Fractal Tree -> Swipe -> Text
 */

const CONFIG = {
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    treeDuration: 12,     // Slightly slower growth for grandeur
    swipeDuration: 3.0,
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

// --- Optimization: Sprite Cache ---
const leafSprites = {};

function preRenderLeaves() {
    const size = 64;
    CONFIG.colors.leaves.forEach(color => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const oCtx = offCanvas.getContext('2d');
        oCtx.translate(size / 2, size / 2);
        oCtx.shadowColor = "rgba(0,0,0,0.3)";
        oCtx.shadowBlur = 5;
        oCtx.shadowOffsetX = 2;
        oCtx.shadowOffsetY = 2;
        oCtx.fillStyle = color;
        const s = 28 / 30;
        oCtx.beginPath();
        oCtx.moveTo(0, -10 * s);
        oCtx.bezierCurveTo(-15 * s, -25 * s, -35 * s, -5 * s, 0, 15 * s);
        oCtx.bezierCurveTo(35 * s, -5 * s, 15 * s, -25 * s, 0, -10 * s);
        oCtx.fill();
        leafSprites[color] = offCanvas;
    });
}

// --- Interaction State ---
const State = {
    WAITING: 0,
    FALLING: 1,
    GROWING: 2,
    SWIPED: 3
};

let currentState = State.WAITING;
let stateTime = 0; // Local time for current state

class FallingHeart {
    constructor(ctx, startX, startY) {
        this.ctx = ctx;
        this.x = startX;
        this.y = startY;
        this.vy = 0;
        this.gravity = 1500; // px/s^2
        this.finished = false;
        this.size = 60;
    }

    update(dt) {
        if (this.finished) return;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Ground hit
        if (this.y >= CONFIG.resolution.height - 50) {
            this.y = CONFIG.resolution.height - 50;
            this.finished = true;
            // Trigger Growth
            startGrowth(this.x, this.y);
        }
    }

    draw() {
        if (this.finished) return; // Disappears into ground
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.scale(this.size / 60, this.size / 60); // Scale 
        this.ctx.fillStyle = "#EC4899";

        // Heart Path (Simple)
        this.ctx.beginPath();
        const s = 1.5;
        this.ctx.moveTo(0, -10 * s);
        this.ctx.bezierCurveTo(-15 * s, -25 * s, -35 * s, -5 * s, 0, 15 * s);
        this.ctx.bezierCurveTo(35 * s, -5 * s, 15 * s, -25 * s, 0, -10 * s);
        this.ctx.fill();
        this.ctx.restore();
    }
}

class FractalBranch {
    constructor(ctx, startX, startY, angle, length, width, depth, maxDepth, startTime) {
        this.ctx = ctx;
        this.startX = startX;
        this.startY = startY;
        this.angle = angle;
        this.length = length;
        this.width = width;
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.startTime = startTime;

        // Growth duration depends on depth (trunk slows, twigs fast)
        this.duration = 1.2 - (depth * 0.1);
        if (this.duration < 0.4) this.duration = 0.4;

        this.currentLength = 0;
        this.children = [];
        this.leafless = (depth < maxDepth - 2); // Only leaves on outer branches

        this.spawnedChildren = false;
    }

    update(time) {
        if (time < this.startTime) return;

        const localTime = time - this.startTime;
        let t = Math.min(localTime / this.duration, 1);
        this.currentLength = this.length * Easing.easeOutQuad(t);

        // Spawn children when this branch is partially grown
        if (t > 0.6 && !this.spawnedChildren && this.depth < this.maxDepth) {
            this.spawnChildren();
            this.spawnedChildren = true;
        }

        this.children.forEach(c => c.update(time));
    }

    spawnChildren() {
        const endX = this.startX + Math.cos(this.angle) * this.length;
        const endY = this.startY + Math.sin(this.angle) * this.length;

        // Photo 4 style: Organic splits
        const count = 2 + Math.floor(Math.random() * 2); // 2 or 3 branches
        for (let i = 0; i < count; i++) {
            // Angle variation
            const angleOffset = (Math.random() - 0.5) * 1.2;
            const newAngle = this.angle + angleOffset;
            const newLength = this.length * (0.6 + Math.random() * 0.3); // Shorter
            const newWidth = this.width * 0.7;

            // Time offset for child
            const childStart = this.startTime + (this.duration * 0.5);

            this.children.push(new FractalBranch(this.ctx, endX, endY, newAngle, newLength, newWidth, this.depth + 1, this.maxDepth, childStart));
        }
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

        this.children.forEach(c => c.draw());
    }

    // Collect all end points for leaves
    getEndPoints(arr) {
        if (this.children.length === 0 || this.depth > this.maxDepth - 3) {
            const endX = this.startX + Math.cos(this.angle) * this.currentLength;
            const endY = this.startY + Math.sin(this.angle) * this.currentLength;
            arr.push({ x: endX, y: endY });
        }
        this.children.forEach(c => c.getEndPoints(arr));
    }
}


class Leaf {
    constructor(ctx, x, y, color, startTime) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.color = color;
        this.startTime = startTime;
        this.sprite = leafSprites[color];

        const targetSize = 28 + (Math.random() - 0.5) * 14;
        this.scaleMult = targetSize / 28;

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

        this.scale = ease * this.scaleMult;
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
        this.ctx.drawImage(this.sprite, -32, -32);
        this.ctx.restore();
    }
}

class TextTyper {
    constructor(ctx, messages, startTime) {
        this.ctx = ctx;
        this.messages = messages;
        this.startTime = startTime;
        this.lines = [];

        const startX = CONFIG.resolution.width * 0.25;
        const startY = 320;
        const lineHeight = 75;
        let currentY = startY;
        let accumulatedTime = startTime;

        this.messages.forEach((msg, index) => {
            const subLines = msg.split('\n');
            subLines.forEach(subLine => {
                const duration = subLine.length * 0.04 + 0.3;
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
    }

    draw(time) {
        if (time < this.startTime) return;
        this.ctx.save();
        this.ctx.font = "500 45px 'Outfit', sans-serif";
        this.ctx.textAlign = "left";

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
                this.ctx.fillText(textToShow, line.x - 200, line.y);
            }
        });
        this.ctx.restore();
    }
}

// --- Main Variables ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = CONFIG.resolution.width;
canvas.height = CONFIG.resolution.height;

let fallingHeart = null;
let rootBranch = null;
let leaves = [];
let textTyper = null;
let lastTime = 0;

function init() {
    preRenderLeaves();

    // Listen for start interaction
    document.getElementById('heart-trigger').addEventListener('click', onStartClick);
}

function onStartClick() {
    // Hide UI
    document.getElementById('start-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('canvas-container').style.opacity = '1';
    }, 500);

    // Start Canvas Animation
    currentState = State.FALLING;
    stateTime = 0;
    lastTime = performance.now();

    // Initialize Falling Heart (Center of screen initially)
    fallingHeart = new FallingHeart(ctx, canvas.width / 2, canvas.height / 2);

    loop();
}

function startGrowth(x, y) {
    currentState = State.GROWING;
    stateTime = 0;

    // Fractal Tree: Start Branch (Trunk)
    // -90 deg is UP
    rootBranch = new FractalBranch(ctx, x, y, -Math.PI / 2, 160, 45, 0, 7, 0);

    // Generate Leaves (Heart Shape)
    // We pre-calculate positions but only show them after some time
    leaves = generateHeartLeaves(x, y - 500); // 500px up is approx visual center of tree

    // Text starts later
    const textStart = CONFIG.treeDuration + CONFIG.swipeDuration;
    textTyper = new TextTyper(ctx, CONFIG.messages, textStart);
}

function generateHeartLeaves(cx, cy) {
    const arr = [];
    const count = 900;

    for (let i = 0; i < count; i++) {
        let valid = false, lx, ly;
        let attempts = 0;
        while (!valid && attempts < 200) {
            attempts++;
            let rx = (Math.random() - 0.5) * 950;
            let ry = (Math.random() - 0.5) * 950;
            let scale = 320;
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
            const t = 3.0 + Math.random() * 6.0; // Leaves appear gradually from 3s to 9s
            arr.push(new Leaf(ctx, lx, ly, color, t));
        }
    }
    return arr;
}


function render(dt) {
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stateTime += dt;

    // --- State Logic ---
    if (currentState === State.FALLING) {
        if (fallingHeart) {
            fallingHeart.update(dt);
            fallingHeart.draw();
        }
    }

    if (currentState === State.GROWING) {
        // Calculate Swipe
        let totalTime = stateTime;

        let swipeOffset = 0;
        if (totalTime > CONFIG.treeDuration) {
            let t = Math.min((totalTime - CONFIG.treeDuration) / CONFIG.swipeDuration, 1);
            let ease = Easing.easeInOutQuad(t);
            swipeOffset = (CONFIG.resolution.width * 0.25) * ease;
        }

        ctx.save();
        ctx.translate(swipeOffset, 0);

        if (rootBranch) {
            rootBranch.update(stateTime);
            rootBranch.draw();
        }

        leaves.forEach(l => {
            l.update(stateTime);
            l.draw();
        });

        ctx.restore();

        // Text (No swipe transform)
        if (textTyper) {
            textTyper.draw(stateTime);
        }
    }
}

function loop() {
    let now = performance.now();
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.1) dt = 0.1;

    render(dt);
    requestAnimationFrame(loop);
}

// Start
init();
console.log("Redesign Interactive V1 Ready.");
