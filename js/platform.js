// 平台数组
let platforms = [];
let lastPlatformY = 0;

// 初始化平台
function initPlatforms() {
    platforms = [];
    lastPlatformY = 500;
    
    // 创建底部的起始平台
    const startPlatform = {
        x: 150,
        y: 550,
        width: 100,
        height: 20,
        type: 'normal',
        velocityX: 0
    };
    platforms.push(startPlatform);
    
    // 在玩家上方创建初始平台，确保足够密集
    console.log('🔧 Initializing platforms...');
    for (let i = 0; i < 15; i++) {
        addNewPlatform();
    }
    console.log('✅ Total initial platforms:', platforms.length);
}

// 在顶部创建新平台
function addNewPlatform() {
    // 根据当前高度调整平台类型
    // const types = ['normal', 'normal', 'moving', 'fragile'];
    let type;
    
    // 根据高度动态调整平台类型分布
    const currentHeight = Math.abs(lastPlatformY);
    if (currentHeight < 600) {
        type = 'normal'; // 前期主要是普通平台
    } else if (currentHeight < 1400) {
        const pool = ['normal', 'normal', 'moving'];
        type = pool[Math.floor(Math.random() * pool.length)];
    } else {
        const pool = ['normal', 'moving', 'moving', 'fragile'];
        type = pool[Math.floor(Math.random() * pool.length)];
    }
    
    // 根据高度调整平台宽度
    let platformWidth = Math.max(38, 90 - Math.floor(currentHeight / 350) * 5);
    
    // 计算平台位置
    const horizontalGap = Math.random() * (GameState.canvas.width - platformWidth);
    const verticalGap = Math.random() * 80 + 85; // 85-190像素的垂直间距
    
    lastPlatformY -= verticalGap;
    
    const platform = {
        x: horizontalGap,
        y: lastPlatformY,
        width: platformWidth,
        height: 20,
        type: type,
        velocityX: type === 'moving' ? (Math.random() > 0.5 ? 3.8 : -3.8) : 0
    };
    
    platforms.push(platform);
    console.log('➕ Added new platform at Y:', lastPlatformY.toFixed(0), 'Total:', platforms.length);
}

// 更新平台系统
function updatePlatforms(deltaTime) {
    // 更新移动平台
    platforms.forEach(platform => {
        if (platform.type === 'moving') {
            platform.x += platform.velocityX;
            
            // 边界反弹
            if (platform.x <= 0 || platform.x >= GameState.canvas.width - platform.width) {
                platform.velocityX *= -1;
            }
        }
    });
    
    // 检测玩家与平台碰撞
    checkPlatformCollisions();
    
    // 管理平台生成和销毁
    managePlatformLifecycle();
}

// 检测玩家与所有平台的碰撞
function checkPlatformCollisions() {
    // 只检测玩家下落时的碰撞
    if (Player.velocityY > 0) {
        platforms.forEach((platform, index) => {
            if (checkPlayerPlatformCollision(platform)) {
                handlePlatformLanding(platform, index);
            }
        });
    }
}

// 单个平台碰撞检测
function checkPlayerPlatformCollision(platform) {
    // 玩家底部接近平台顶部
    const playerBottom = Player.y + Player.height;
    const platformTop = platform.y;
    
    // 垂直方向：玩家下落且接近平台
    const verticalMatch = (
        playerBottom >= platformTop - 15 && 
        playerBottom <= platformTop + 25
    );
    
    // 水平方向：玩家在平台范围内
    const horizontalMatch = (
        Player.x + Player.width > platform.x + 3 &&
        Player.x < platform.x + platform.width - 3
    );
    
    return verticalMatch && horizontalMatch;
}

// 处理平台着陆
function handlePlatformLanding(platform, index) {
    Player.y = platform.y - Player.height;
    Player.velocityY = 0;
    Player.isJumping = false;
    Player.isGrounded = true;

    const playerCenter = Player.x + Player.width / 2;
    const platformCenter = platform.x + platform.width / 2;
    const centerOffset = Math.abs(playerCenter - platformCenter);
    const normalizedOffset = centerOffset / (platform.width / 2);

    let landingQuality = 'normal';

    if (normalizedOffset < 0.2) {
        landingQuality = 'perfect';
    } else if (normalizedOffset > 0.75) {
        landingQuality = 'close';
    }

    triggerEvent('player_land', {
        platformType: platform.type,
        platformIndex: index,
        landingQuality: landingQuality
    });

    GameState.score += 1;
    updateScoreDisplay();

    if (GameState.score % 5 === 0) {
        triggerEvent('score_milestone', { score: GameState.score });
    }

    if (platform.type === 'fragile') {
        setTimeout(() => {
            const currentIndex = platforms.indexOf(platform);
            if (currentIndex !== -1) {
                platforms.splice(currentIndex, 1);
                triggerEvent('fragile_break');
            }
        }, 500);
    }
}
    
    // 加分
    GameState.score += 1;
    updateScoreDisplay();
    
    // 触发特定事件
    if (GameState.score % 5 === 0) {
        triggerEvent('score_milestone', { score: GameState.score });
    }
    
    // 处理易碎平台
    if (platform.type === 'fragile') {
        // 给玩家一点时间跳跃，然后平台消失
        setTimeout(() => {
            const currentIndex = platforms.indexOf(platform);
            if (currentIndex !== -1) {
                platforms.splice(currentIndex, 1);
                triggerEvent('fragile_break');
            }
        }, 500); // 500ms后消失
    }


// 关键修复：管理平台生成和销毁
function managePlatformLifecycle() {
    const cameraTop = GameState.cameraY;
    const cameraBottom = GameState.canvas.height + GameState.cameraY;
    
    // 移除屏幕底部的平台
    const platformsBefore = platforms.length;
    platforms = platforms.filter(platform => {
        // 如果平台完全超出屏幕底部，移除
        if (platform.y > cameraBottom + 200) {
            return false;
        }
        return true;
    });
    
    const platformsRemoved = platformsBefore - platforms.length;
    if (platformsRemoved > 0) {
        console.log('➖ Removed', platformsRemoved, 'platforms from bottom');
        // 为移除的平台补充新平台
        for (let i = 0; i < platformsRemoved; i++) {
            addNewPlatform();
        }
    }
    
    // 确保始终有足够的平台在玩家上方
    const topmostPlatformY = platforms.length > 0 ? 
        Math.min(...platforms.map(p => p.y)) : cameraTop;
    
    // 计算需要在顶部补充的平台数量
    const requiredPlatformsAbove = 8;
    let platformsAbove = platforms.filter(platform => platform.y <= cameraTop - 50).length;
    
    console.log('Platforms above camera:', platformsAbove, 'Required:', requiredPlatformsAbove);
    
    while (platformsAbove < requiredPlatformsAbove) {
        addNewPlatform();
        platformsAbove++;
    }
}

// 渲染平台
function renderPlatforms() {
    const ctx = GameState.ctx;

    platforms.forEach(platform => {
        let fillColor = '#52c7c1';
        let borderColor = '#1f8f7d';
        let shadowColor = '#2caaa2';

        if (platform.type === 'moving') {
            fillColor = '#63d6cf';
            borderColor = '#278f88';
            shadowColor = '#3cb8b0';
        } else if (platform.type === 'fragile') {
            fillColor = '#f0bf4c';
            borderColor = '#9c6a10';
            shadowColor = '#d79f28';
        }

        // 主体
        ctx.fillStyle = fillColor;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // 上高光边
        ctx.fillStyle = shadowColor;
        ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 4);

        // 外边框
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

        if (platform.type === 'fragile') {
            ctx.strokeStyle = '#7a3f00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(platform.x + 10, platform.y + 4);
            ctx.lineTo(platform.x + platform.width - 10, platform.y + platform.height - 4);
            ctx.moveTo(platform.x + platform.width - 10, platform.y + 4);
            ctx.lineTo(platform.x + 10, platform.y + platform.height - 4);
            ctx.stroke();
        }
    });
}

// 重置平台系统
function resetPlatforms() {
    initPlatforms();
}

// 更新分数显示
function updateScoreDisplay() {
    document.getElementById('score-display').textContent = `Score: ${GameState.score}`;
}