// Event history
let eventHistory = [];
let currentCombo = 0;
let lastLandTime = 0;
let lastFallTime = 0;
let hasTriggeredFirstMilestone = false;

// 初始化事件系统
function initEvents() {
    eventHistory = [];
    currentCombo = 0;
    lastLandTime = 0;
    lastFallTime = 0;
    hasTriggeredFirstMilestone = false;
}

// 触发事件
function triggerEvent(eventName, data = {}) {
    const timestamp = Date.now();

    const event = {
        type: eventName,
        timestamp: timestamp,
        data: data
    };

    eventHistory.push(event);
    processEvent(event);
}

// 处理事件
function processEvent(event) {
    switch (event.type) {
        case 'player_jump':
            handleJumpEvent(event);
            break;

        case 'player_land':
            handleLandEvent(event);
            break;

        case 'player_fall':
            handleFallEvent(event);
            break;

        case 'score_milestone':
            handleMilestoneEvent(event);
            break;

        case 'fragile_break':
            handleFragileBreakEvent(event);
            break;
    }
}

// 处理跳跃事件
function handleJumpEvent(event) {
    // 这里先预留，不主动吐槽，避免太吵
}

// 处理落地事件
function handleLandEvent(event) {
    const currentTime = Date.now();
    const timeSinceLastLand = currentTime - lastLandTime;
    const timeSinceLastFall = currentTime - lastFallTime;

    // ===== comeback：刚摔过不久又重新落到平台上 =====
    // 用于“差点完蛋又续命”的时刻
    if (lastFallTime > 0 && timeSinceLastFall < 1800) {
        triggerAIComment('comeback');
    }

    // ===== combo streak =====
    if (timeSinceLastLand < 1000) {
        currentCombo++;

        if (currentCombo >= 3) {
            triggerAIComment('combo_streak', { count: currentCombo });
        }
    } else {
        currentCombo = 0;
    }

    lastLandTime = currentTime;

    if (!event.data) return;

    const { platformType, landingQuality } = event.data;

    // ===== 落点质量优先级最高 =====
    if (landingQuality === 'perfect') {
        triggerAIComment('perfect_land');
        return;
    }

    if (landingQuality === 'close') {
        triggerAIComment('close_call');
        return;
    }

    // ===== 特殊平台 =====
    if (platformType === 'moving') {
        triggerAIComment('moving_platform_land');
        return;
    }

    if (platformType === 'fragile') {
        triggerAIComment('fragile_land');
        return;
    }

    // ===== 普通安全落地 =====
    // 普通平台 / 正常落地 / 没有更特殊的情况时，偶尔说一句
    if (Math.random() < 0.35) {
        triggerAIComment('safe_landing');
    }
}

// 处理掉落事件
function handleFallEvent(event) {
    const currentTime = Date.now();
    const timeSinceLastLand = currentTime - lastLandTime;

    lastFallTime = currentTime;

    if (GameState.score <= 2 || timeSinceLastLand < 500) {
        triggerAIComment('fail_fast');
        return;
    }

    if (currentCombo >= 3) {
        triggerAIComment('fail_after_combo');
        return;
    }

    if (GameState.score >= 12) {
        triggerAIComment('fail_high_score', { score: GameState.score });
        return;
    }

    triggerAIComment('normal_fail');
}

// 处理分数里程碑
function handleMilestoneEvent(event) {
    if (!event.data || typeof event.data.score !== 'number') return;

    const score = event.data.score;

    // 第一次 milestone 稍微保守一点
    if (!hasTriggeredFirstMilestone) {
        hasTriggeredFirstMilestone = true;

        if (score < 15) {
            triggerAIComment('low_score_milestone', { score });
        } else {
            triggerAIComment('high_score_milestone', { score });
        }
        return;
    }

    // 后续里程碑按分数段区分
    if (score < 15) {
        triggerAIComment('low_score_milestone', { score });
    } else if (score >= 15) {
        triggerAIComment('high_score_milestone', { score });
    } else {
        triggerAIComment('score_milestone', { score });
    }
}

// 处理易碎平台断裂
function handleFragileBreakEvent(event) {
    triggerAIComment('close_call');
}

// 更新事件系统
function updateEvents(deltaTime) {
    // 预留后续复杂事件逻辑
}

// 重置事件系统
function resetEvents() {
    eventHistory = [];
    currentCombo = 0;
    lastLandTime = 0;
    lastFallTime = 0;
    hasTriggeredFirstMilestone = false;
}