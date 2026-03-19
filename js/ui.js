// 设置UI事件
function setupUIEvents() {
    // 开始按钮
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // 重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', startGame);
    
    // 分享按钮
    document.getElementById('share-btn').addEventListener('click', shareResult);
}

// 分享结果
function shareResult() {
    const score = GameState.score;
    const finalRoast = document.getElementById('ai-final-roast').textContent;
    
    // 创建分享文本
    const shareText = `I just scored ${score} in BADJUMP! The AI said: "${finalRoast}" 🎮`;
    
    // 尝试使用Web Share API
    if (navigator.share) {
        navigator.share({
            title: 'BADJUMP Score',
            text: shareText,
            url: window.location.href
        }).catch(console.error);
    } else {
        // 回退到复制到剪贴板
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Score copied to clipboard!');
        }).catch(() => {
            alert('Share text: ' + shareText);
        });
    }
}