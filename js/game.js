console.log("game.js loaded");

// 游戏全局状态
const GameState = {
    canvas: null,
    ctx: null,
    isRunning: false,
    score: 0,
    highScore: 0,
    gameLoopId: null,
    lastTime: 0,
    cameraY: 0,
    maxHeight: 0
};

// 游戏配置
const GameConfig = {
    gravity: 12.5,
    jumpForce: 6.5,
    playerSpeed: 3.4,
    platformGap: 1.5,
    platformWidth: 60,
    platformHeight: 15,
    cameraThreshold: 200
};

// 初始化游戏
function initGame() {
    GameState.canvas = document.getElementById('gameCanvas');
    GameState.ctx = GameState.canvas.getContext('2d');

    const container = document.getElementById('game-container');
    GameState.canvas.width = container.clientWidth;
    GameState.canvas.height = container.clientHeight;

    initPlayer();
    initPlatforms();
    initEvents();
    initAICommentary();
    initVoice();
    setupUIEvents();

    renderStartCat();

    console.log('Game initialized successfully!');
}

// 开始游戏
function startGame() {
    GameState.isRunning = true;
    GameState.score = 0;
    GameState.cameraY = 0;
    GameState.maxHeight = 0;

    resetPlayer();
    resetPlatforms();
    resetEvents();

    Player.isGrounded = true;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('score-display').textContent = 'Score: 0';
    document.getElementById('mobile-controls').style.opacity = '1';

    GameState.lastTime = performance.now();
    GameState.gameLoopId = requestAnimationFrame(gameLoop);

    console.log("trigger game_start comment");
    
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.resume();
        } catch (e) {
            console.warn('speech resume failed', e);
        }
    
}
    triggerAIComment('game_start');
}

// 游戏主循环
function gameLoop(timestamp) {
    if (!GameState.isRunning) return;
    
    const deltaTime = (timestamp - GameState.lastTime) / 1000; // 转换为秒
    GameState.lastTime = timestamp;
    
    // 更新游戏逻辑
    update(deltaTime);
    
    // 渲染游戏画面
    render();
    
    GameState.gameLoopId = requestAnimationFrame(gameLoop);
}

// 更新游戏逻辑
function update(deltaTime) {
    updatePlayer(deltaTime);
    updatePlatforms(deltaTime);
    updateEvents(deltaTime);
    updateAICommentary(deltaTime);
    updateCamera(deltaTime);
}

// 更新摄像头位置
function updateCamera(deltaTime) {
    // 计算玩家相对于摄像头的位置
    const relativePlayerY = Player.y - GameState.cameraY;
    
    // 如果玩家跳到屏幕上部，移动摄像头向上
    if (relativePlayerY < GameConfig.cameraThreshold && Player.velocityY < 0) {
        const targetCameraY = Player.y - GameConfig.cameraThreshold;
        
        // 平滑移动摄像头
        GameState.cameraY += (targetCameraY - GameState.cameraY) * 0.1;
        
        // 更新最大高度记录
        if (-GameState.cameraY > GameState.maxHeight) {
            GameState.maxHeight = -GameState.cameraY;
        }
    }
    
    // 当玩家向下掉落时，不移动摄像头向下，只允许向上移动
}

// 渲染游戏画面
function render() {
    const ctx = GameState.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, GameState.canvas.width, GameState.canvas.height);
    
    // 应用摄像头变换
    ctx.save();
    ctx.translate(0, -GameState.cameraY);
    
    // 渲染平台
    renderPlatforms();
    
    // 渲染玩家
    renderPlayer();
    
    // 恢复摄像头变换
    ctx.restore();
    
    // 渲染高度指示器（不随摄像头移动）
    renderHeightIndicator();
}

// 渲染高度指示器
function renderHeightIndicator() {
    const ctx = GameState.ctx;
    const meters = Math.floor(GameState.maxHeight / 100);

    ctx.fillStyle = '#d8d8d8';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`HEIGHT: ${meters}m`, 18, 26);

    const progressBarWidth = 100;
    const progressBarHeight = 8;
    const progress = Math.min(GameState.maxHeight / 2000, 1);

    // 背景槽
    ctx.fillStyle = '#6b7288';
    ctx.fillRect(18, 38, progressBarWidth, progressBarHeight);

    // 填充
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(18, 38, progressBarWidth * progress, progressBarHeight);

    // 黑边
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 38, progressBarWidth, progressBarHeight);
}

// 游戏结束
function gameOver() {
    GameState.isRunning = false;
    cancelAnimationFrame(GameState.gameLoopId);
    
    // 更新最高分
    if (GameState.score > GameState.highScore) {
        GameState.highScore = GameState.score;
    }
    
    // 触发游戏结束AI评论
    triggerAIComment('game_over');
    
    // 设置最终分数到显示
    document.getElementById('final-score').textContent = GameState.score;
    
    // 延迟显示游戏结束界面，让AI说完最后的吐槽
    setTimeout(() => {
        const finalRoast = document.getElementById('ai-subtitle').textContent || "Gravity wins again.";
        document.getElementById('ai-final-roast').textContent = finalRoast;
        document.getElementById('game-over-screen').style.display = 'flex';
    }, 1500);
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);

