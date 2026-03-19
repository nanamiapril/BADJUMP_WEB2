// 玩家状态
const Player = {
    x: 200,
    y: 500,
    width: 24,
    height: 28,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    isGrounded: false,
    jumpCount: 0,
    color: '#ff6b6b',
    direction: 1, // 1 = right, -1 = left
    moveLeft: false,
    moveRight: false,
    boost: false
};

// 初始化玩家
function initPlayer() {
    Player.x = 200;
    Player.y = 500;
    Player.velocityX = 0;
    Player.velocityY = 0;
    Player.isJumping = false;
    Player.isGrounded = false;
    Player.jumpCount = 0;
    Player.direction = 1;
    Player.moveLeft = false;
    Player.moveRight = false;
    Player.boost = false;
    Player.width = 24;
    Player.height = 28;

    // 绑定输入事件
    setupInputHandling();
}

// 设置输入处理
let inputInitialized = false;
function setupInputHandling() {
    if (inputInitialized) return;
    inputInitialized = true;
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            playerJump();
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            Player.moveLeft = true;
        }

        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            Player.moveRight = true;
        }

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            Player.boost = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            Player.moveLeft = false;
        }

        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            Player.moveRight = false;
        }

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            Player.boost = false;
        }
    });

    // 触摸事件（移动端）
    document.getElementById('gameCanvas').addEventListener('touchstart', (e) => {
        e.preventDefault();
        playerJump();
    });

    // 鼠标点击事件
    document.getElementById('gameCanvas').addEventListener('click', () => {
        playerJump();
    });

    //移动端点击事件
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');

    if (leftBtn) {
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Player.moveLeft = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            Player.moveLeft = false;
        });
        leftBtn.addEventListener('mousedown', () => {
            Player.moveLeft = true;
        });
        leftBtn.addEventListener('mouseup', () => {
            Player.moveLeft = false;
        });
        leftBtn.addEventListener('mouseleave', () => {
            Player.moveLeft = false;
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Player.moveRight = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            Player.moveRight = false;
        });
        rightBtn.addEventListener('mousedown', () => {
            Player.moveRight = true;
        });
        rightBtn.addEventListener('mouseup', () => {
            Player.moveRight = false;
        });
        rightBtn.addEventListener('mouseleave', () => {
            Player.moveRight = false;
        });
    }

    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playerJump();
        });
        jumpBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            playerJump();
        });
    }
}

// 玩家跳跃
function playerJump() {
    if (!GameState.isRunning) return;

    if (!Player.isGrounded) {
        triggerAIComment('air_jump_denied');
        return;
    }

    Player.velocityY = -GameConfig.jumpForce * 12;
    Player.isJumping = true;
    Player.isGrounded = false;

    triggerEvent('player_jump');
}

// 更新玩家状态
function updatePlayer(deltaTime) {
    const baseSpeed = GameConfig.playerSpeed;
    const moveSpeed = Player.boost ? baseSpeed * 2 : baseSpeed * 1.6;
    const autoSpeed = Player.boost ? baseSpeed * 1.2 : baseSpeed;

    // 玩家控制优先
    if (Player.moveLeft && !Player.moveRight) {
        Player.x -= moveSpeed;
        Player.direction = -1;

    } else if (Player.moveRight && !Player.moveLeft) {
        Player.x += moveSpeed;
        Player.direction = 1;

    } else {
        // 没有输入时自动移动
        Player.x += autoSpeed * Player.direction;
    }

    // 边界处理
    if (Player.x <= 0) {
        Player.x = 0;
        Player.direction = 1;
    } else if (Player.x >= GameState.canvas.width - Player.width) {
        Player.x = GameState.canvas.width - Player.width;
        Player.direction = -1;
    }

    // 应用重力
    Player.velocityY += GameConfig.gravity * deltaTime * 10;
    Player.y += Player.velocityY * deltaTime * 10;

    // 检查是否掉出屏幕底部（考虑摄像头位置）
    const cameraBottom = GameState.canvas.height + GameState.cameraY;
    if (Player.y > cameraBottom) {
        triggerEvent('player_fall');
        gameOver();
    }

    // 左右乱晃吐槽
    if (Player.moveLeft && Player.moveRight) {
        triggerAIComment("confused_movement");
    }
}

// 渲染玩家
function drawPixelCat(ctx, x, y, scale = 4, tailSwing = 0, earDrop = 0) {
    const p = scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    /* ===== 头（大） ===== */
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(x + p*2, y, p*6, p*4);

    /* ===== 耳朵 ===== */
    ctx.fillRect(x + p*2, y - p + earDrop, p*2, p);
    ctx.fillRect(x + p*6, y - p + earDrop, p*2, p);

    /* ===== 眼睛 ===== */
    ctx.fillStyle = "#000";
    ctx.fillRect(x + p*3, y + p, p, p);
    ctx.fillRect(x + p*6, y + p, p, p);

    /* ===== 嘴 ===== */
    ctx.fillRect(x + p*4, y + p*2, p, p);

    /* ===== 身体（小） ===== */
    ctx.fillStyle = "#e6b800";
    ctx.fillRect(x + p*3, y + p*4, p*4, p*2);

    /* ===== 腿 ===== */
    ctx.fillRect(x + p*3, y + p*6, p, p);
    ctx.fillRect(x + p*6, y + p*6, p, p);

    /* ===== 尾巴 ===== */
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(x + p*7, y + p*4 + tailSwing, p*2, p);

    ctx.restore();
}

function renderPlayer() {
    const ctx = GameState.ctx;
    const x = Player.x;
    const y = Player.y;

    let earDrop = 0;
    if (Player.velocityY > 2) {
        earDrop = 1;
    }

    const tailOffset = Math.sin(Date.now() * 0.02) * 2;

    drawPixelCat(ctx, x, y, 4, tailOffset, earDrop);
}

function renderStartCat() {
    const canvas = document.getElementById('start-cat-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 让开始页猫居中一点
    const tailOffset = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
    drawPixelCat(ctx, 16, 20, 6, tailOffset, 0);

    requestAnimationFrame(renderStartCat);
}

// 重置玩家状态
function resetPlayer() {
    Player.x = 200;
    Player.y = 500;
    Player.velocityX = 0;
    Player.velocityY = 0;
    Player.isJumping = false;
    Player.isGrounded = false;
    Player.jumpCount = 0;
    Player.direction = 1;
    Player.moveLeft = false;
    Player.moveRight = false;
    Player.boost = false;
    Player.width = 24;
    Player.height = 28;

}