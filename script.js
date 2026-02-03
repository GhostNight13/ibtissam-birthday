/**
 * Heart Tree Animation - Refined Redesign
 * Interaction: Start -> Falling Heart -> Specific Tree Structure -> Swipe -> Text
 */

const CONFIG = {
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    treeDuration: 10,
    swipeDuration: 3.0,
    colors: {
        trunk: '#FFB6C1', // Pink trunk
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
let stateTime = 0;

// --- Falling Heart Logic ---
class FallingHeart {
    constructor(ctx, startX, startY) {
        this.ctx = ctx;
        this.x = startX;
        this.y = startY;
        this.vy = 0;
        this.gravity = 800; // Reduced gravity for visibility
        this.finished = false;
        this.size = 70; // Larger size
    }

    update(dt) {
        if (this.finished) return;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Ground hit logic
        const groundY = CONFIG.resolution.height - 20;
        if (this.y >= groundY) {
            this.y = groundY;
            this.finished = true;
            startGrowth(this.x, this.y);
        }
    }

    draw() {
        if (this.finished) return;
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.scale(this.size / 60, this.size / 60);
        this.ctx.fillStyle = "#FF69B4"; // Bright Hot Pink
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = "#FF69B4"; // Glow to make it visible

        // Heart Path
        this.ctx.beginPath();
        const s = 1.5;
        this.ctx.moveTo(0, -10 * s);
        this.ctx.bezierCurveTo(-15 * s, -25 * s, -35 * s, -5 * s, 0, 15 * s);
        this.ctx.bezierCurveTo(35 * s, -5 * s, 15 * s, -25 * s, 0, -10 * s);
        this.ctx.fill();
        this.ctx.restore();
    }
}

// --- Specific Tree Structure (Not Random) ---
// Matches the "Pink Tree" reference: Central trunk, symmetric-ish splits
class SpecificBranch {
    constructor(ctx, startX, startY, angle, length, width, startTime, parentDuration) {
        this.ctx = ctx;
        this.startX = startX;
        this.startY = startY;
        this.angle = angle;
        this.targetLength = length;
        this.width = width;
        this.startTime = startTime;
        this.duration = parentDuration || 1.5;

        this.currentLength = 0;
        this.children = [];
    }

    update(time) {
        if (time < this.startTime) return;
        let t = Math.min((time - this.startTime) / this.duration, 1);
        this.currentLength = this.targetLength * Easing.easeOutQuad(t);

        this.children.forEach(c => c.update(time));
    }

    draw() {
        if (this.currentLength <= 0.1) return;

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

    addChild(angleOffset, lengthFactor, widthFactor, delayFactor) {
        // Calculate start position for child based on FULL length of parent
        // (Simplified: children grow from end of parent)
        const endX = this.startX + Math.cos(this.angle) * this.targetLength;
        const endY = this.startY + Math.sin(this.angle) * this.targetLength;

        const newAngle = this.angle + angleOffset;
        const newLength = this.targetLength * lengthFactor;
        const newWidth = this.width * widthFactor;
        const newStartTime = this.startTime + (this.duration * delayFactor); // Start when parent is partially done

        const child = new SpecificBranch(this.ctx, endX, endY, newAngle, newLength, newWidth, newStartTime, this.duration * 0.8);
        this.children.push(child);
        return child;
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

        // Larger leaves to fill the heart shape better
        const targetSize = 32 + (Math.random() - 0.5) * 16;
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

        const startX = CONFIG.resolution.width * 0.15; // Further left to avoid tree
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
let rootBranch = null; // Should include children
let treeBranches = []; // Flat list for easier update if needed, or just root
let leaves = [];
let textTyper = null;
let lastTime = 0;

function init() {
    preRenderLeaves();
    document.getElementById('heart-trigger').addEventListener('click', onStartClick);
}

function onStartClick() {
    document.getElementById('start-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('canvas-container').style.opacity = '1';
    }, 500);

    currentState = State.FALLING;
    stateTime = 0;
    lastTime = performance.now();

    // Start falling from where the user clicked (Center)
    fallingHeart = new FallingHeart(ctx, canvas.width / 2, canvas.height / 2);

    loop();
}

function startGrowth(x, y) {
    currentState = State.GROWING;
    stateTime = 0;

    // --- Build Specific Tree Structure (Photo 2 style) ---
    // Single strong trunk, few major splits
    treeBranches = [];

    // Trunk
    const trunk = new SpecificBranch(ctx, x, y, -Math.PI / 2, 280, 50, 0, 1.5);
    treeBranches.push(trunk);

    // Level 1 Branches (The "V" shape)
    // Left Main
    const leftMain = trunk.addChild(-0.5, 0.7, 0.7, 0.6);
    // Right Main
    const rightMain = trunk.addChild(0.5, 0.7, 0.7, 0.6);
    // Center small
    const centerMain = trunk.addChild(0, 0.5, 0.6, 0.7);

    // Level 2 (Splits from Level 1)
    leftMain.addChild(-0.4, 0.7, 0.6, 0.6);
    leftMain.addChild(0.3, 0.6, 0.6, 0.6);

    rightMain.addChild(0.4, 0.7, 0.6, 0.6);
    rightMain.addChild(-0.3, 0.6, 0.6, 0.6);

    centerMain.addChild(-0.2, 0.7, 0.6, 0.6);
    centerMain.addChild(0.2, 0.7, 0.6, 0.6);


    // Leaves (Full Heart Shape - Photo 1)
    // Centered around the top of the trunk (adjusted for longer trunk)
    leaves = generateHeartLeaves(x, y - 700);

    // Text
    const textStart = CONFIG.treeDuration + CONFIG.swipeDuration;
    textTyper = new TextTyper(ctx, CONFIG.messages, textStart);
}

function generateHeartLeaves(cx, cy) {
    const arr = [];
    // High density to ensure "Full Tree" look
    const count = 1000;

    for (let i = 0; i < count; i++) {
        let valid = false, lx, ly;
        let attempts = 0;
        while (!valid && attempts < 200) {
            attempts++;
            let rx = (Math.random() - 0.5) * 1050; // Wide
            let ry = (Math.random() - 0.5) * 1050;

            let scale = 360; // Big Heart
            let nx = rx / scale;
            let ny = -ry / scale;
            ny += 0.3; // Shift heart shape relative to center

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
            const t = 2.0 + Math.random() * 5.0; // Fast pop in
            arr.push(new Leaf(ctx, lx, ly, color, t));
        }
    }
    return arr;
}


function render(dt) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stateTime += dt;

    if (currentState === State.FALLING) {
        if (fallingHeart) {
            fallingHeart.update(dt);
            fallingHeart.draw();
        }
    }

    if (currentState === State.GROWING) {
        let totalTime = stateTime;

        let swipeOffset = 0;
        if (totalTime > CONFIG.treeDuration) {
            let t = Math.min((totalTime - CONFIG.treeDuration) / CONFIG.swipeDuration, 1);
            let ease = Easing.easeInOutQuad(t);
            swipeOffset = (CONFIG.resolution.width * 0.25) * ease;
        }

        ctx.save();
        ctx.translate(swipeOffset, 0);

        // Draw Tree (Specific Structure)
        // Just drawing the root trunk will draw children recursively
        treeBranches.forEach(b => {
            b.update(stateTime);
            b.draw();
        });

        leaves.forEach(l => {
            l.update(stateTime);
            l.draw();
        });

        ctx.restore();

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

init();
console.log("Refined Redesign V2 (Visible Heart + Simple Tree) Ready.");
