// AI commentary system
console.log("ai_commentary.js loaded");

let subtitleTimeoutId = null;
let pendingVoiceText = null;

const CommentLibrary = {
    game_start: [
        "Alright. Be bad.",
        "Go on. Flop.",
        "Show me failure.",
        "Let's waste talent.",
        "Okay. Ruin this.",
        "Try not to choke.",
        "Start badly.",
        "Disappoint me.",
        "Let's see the mess.",
        "Time for errors."
    ],

    fail_fast: [
        "Wow. Already?",
        "Fast collapse.",
        "That was brief.",
        "Speedrun shame.",
        "Instant failure.",
        "Excellent flop.",
        "Short run.",
        "Gone already?",
        "Tiny effort.",
        "That was quick."
    ],

    fail_high_score: [
        "And then you sold.",
        "All that for this?",
        "Strong run. Weak finish.",
        "Nice choke.",
        "So close. Cute.",
        "Hope expired.",
        "That hurt more.",
        "Almost mattered.",
        "Good run. Bad brain.",
        "Painfully throwy."
    ],

    normal_fail: [
        "Gravity wins.",
        "There it is.",
        "Classic.",
        "Bad choice.",
        "Very avoidable.",
        "Neat collapse.",
        "That was weak.",
        "Rough ending.",
        "Poor read.",
        "And down."
    ],

    fail_after_combo: [
        "Streak deleted.",
        "Momentum wasted.",
        "All that for nothing.",
        "Nice setup. Shame.",
        "Hope was temporary.",
        "Great streak. Terrible ending.",
        "Built that for this?",
        "Good rhythm. Bad brain.",
        "That fell apart.",
        "Competence expired."
    ],

    combo_streak: [
        "Oh. A streak.",
        "Suspiciously decent.",
        "Now you care?",
        "That's annoying.",
        "Fine. Keep going.",
        "Unexpected rhythm.",
        "Look at that.",
        "You found timing.",
        "Almost skilled.",
        "Mildly impressive."
    ],

    score_milestone: [
        "Still here?",
        "That's awkward.",
        "Progress. Sadly.",
        "Not dead yet.",
        "Annoyingly decent.",
        "You kept going.",
        "This got watchable.",
        "Well. Numbers.",
        "Still surviving.",
        "Fine. Continue."
    ],

    low_score_milestone: [
        "Tiny score.",
        "We're counting that?",
        "Big moment, huh?",
        "Modest numbers.",
        "Let's stay humble.",
        "That barely counts."
    ],

    high_score_milestone: [
        "Now that's rude.",
        "You're still going?",
        "Okay. That's real.",
        "This got serious.",
        "That's a number.",
        "Now I'm annoyed."
    ],

    close_call: [
        "Barely.",
        "Too close.",
        "Ugly save.",
        "One pixel off.",
        "Almost funny.",
        "That was grim.",
        "Lucky again.",
        "Close. Embarrassingly.",
        "Disaster pending.",
        "Nearly perfect. For me."
    ],

    moving_platform_land: [
        "Bold.",
        "Risky. Fine.",
        "Nice catch.",
        "That almost worked badly.",
        "Decent timing.",
        "Motion survived.",
        "Okay. Clean.",
        "You stuck that?",
        "Unexpectedly tidy.",
        "Barely elegant."
    ],

    fragile_land: [
        "That won't last.",
        "Move. Now.",
        "Bad platform.",
        "Trust issues.",
        "Temporary floor.",
        "Shaky choice.",
        "Fragile. Like the plan.",
        "This feels stupid.",
        "Quick feet.",
        "Don't linger."
    ],

    perfect_land: [
        "Clean.",
        "Sharp.",
        "Precise.",
        "Okay. Nice.",
        "That was crisp.",
        "Rare control.",
        "Proper landing.",
        "That had style.",
        "Fine. Good.",
        "Surprisingly exact."
    ],

    safe_landing: [
        "Safe. Boring.",
        "Routine.",
        "Functional.",
        "That worked.",
        "No drama.",
        "Very normal."
    ],

    comeback: [
        "Recovered. Somehow.",
        "Messy save.",
        "That should not work.",
        "Stolen survival.",
        "You got away with that.",
        "Lucky rebound."
    ],

    air_jump_denied: [
        "Air isn't solid.",
        "Nice theory.",
        "Physics said no.",
        "Try reality.",
        "Wrong genre.",
        "Cute attempt.",
        "Momentum disagrees.",
        "Not how jumping works.",
        "Gravity declines.",
        "Wishful thinking."
    ],

    confused_movement: [
        "Pick a side.",
        "Left or right?",
        "Commit.",
        "That was panic.",
        "Very decisive. Not.",
        "Interesting flailing.",
        "Bold indecision.",
        "You steering or twitching?",
        "Confusion detected.",
        "That had no plan."
    ],

    idle_banter: [
        "Thinking hard?",
        "Anytime now.",
        "Go on then.",
        "Planning excuses?",
        "Take your time.",
        "The floor waits.",
        "This your strategy?",
        "Stalling again?",
        "Confidence buffering.",
        "Move, genius."
    ],

    game_over: [
        "And scene.",
        "Cute ending.",
        "Career over.",
        "Messy finale.",
        "That wrapped itself.",
        "A predictable finish.",
        "Well. You tried.",
        "Gravity closes out.",
        "Bad ending.",
        "That your plan?"
    ]
};

const AIState = {
    lastCommentTime: 0,
    commentInterval: 4200,
    currentPersonality: 'mean_snarky',
    lastCommentText: '',
    lastCommentType: '',
    recentComments: [],
    recentTypes: [],
    recentLimit: 12
};

const VoiceState = {
    enabled: false,
    unlocked: false,
    voice: null,
    rate: 0.96,
    pitch: 0.92,
    volume: 0.9
};

function initVoice() {
    if (!('speechSynthesis' in window)) {
        console.warn('TTS not supported in this browser.');
        VoiceState.enabled = false;
        VoiceState.unlocked = false;
        return;
    }

    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        console.log('voices loaded:', voices);

        const preferredVoice =
            voices.find(v => v.lang === 'en-GB') ||
            voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang && v.lang.startsWith('en'));

        VoiceState.voice = preferredVoice || null;

        if (!VoiceState.voice) {
            console.warn('No English voice found. Browser default voice will be used.');
        }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function unlockVoice() {
    if (!('speechSynthesis' in window)) {
        console.warn('TTS not supported in this browser.');
        return;
    }

    if (VoiceState.unlocked) return;

    VoiceState.enabled = true;
    VoiceState.unlocked = true;

    try {
        const unlockUtterance = new SpeechSynthesisUtterance(' ');
        unlockUtterance.volume = 0;
        unlockUtterance.rate = 1;
        unlockUtterance.pitch = 1;

        if (VoiceState.voice) {
            unlockUtterance.voice = VoiceState.voice;
        }

        window.speechSynthesis.speak(unlockUtterance);
        console.log('Voice unlocked');
    } catch (err) {
        console.warn('Voice unlock failed:', err);
    }
}

function bindVoiceUnlock() {
    const unlockOnce = () => {
        unlockVoice();

        document.removeEventListener('touchstart', unlockOnce);
        document.removeEventListener('click', unlockOnce);
        document.removeEventListener('keydown', unlockOnce);
    };

    document.addEventListener('touchstart', unlockOnce, { passive: true });
    document.addEventListener('click', unlockOnce);
    document.addEventListener('keydown', unlockOnce);
}

function speakAIComment(text) {
    if (!text) return;
    if (!('speechSynthesis' in window)) return;
    if (!VoiceState.enabled || !VoiceState.unlocked) return;

    try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            pendingVoiceText = text;
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = VoiceState.rate;
        utterance.pitch = VoiceState.pitch;
        utterance.volume = VoiceState.volume;

        if (VoiceState.voice) {
            utterance.voice = VoiceState.voice;
        }

        utterance.onend = () => {
            if (pendingVoiceText) {
                const nextText = pendingVoiceText;
                pendingVoiceText = null;
                speakAIComment(nextText);
            }
        };

        utterance.onerror = (e) => {
            console.warn('Speech error:', e);
            pendingVoiceText = null;
        };

        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.warn('speakAIComment failed:', err);
    }
}

function initAICommentary() {
    AIState.lastCommentTime = 0;
    AIState.commentInterval = 4200;
    AIState.currentPersonality = 'mean_snarky';
    AIState.lastCommentText = '';
    AIState.lastCommentType = '';
    AIState.recentComments = [];
    AIState.recentTypes = [];
}

function pushRecent(arr, value, limit) {
    arr.push(value);
    if (arr.length > limit) arr.shift();
}

function getCommentCandidates(commentType) {
    const comments = CommentLibrary[commentType];
    if (!comments || comments.length === 0) return [];

    let candidates = comments.filter(comment =>
        comment !== AIState.lastCommentText &&
        !AIState.recentComments.includes(comment)
    );

    if (candidates.length === 0) {
        candidates = comments.filter(comment => comment !== AIState.lastCommentText);
    }

    if (candidates.length === 0) {
        candidates = comments;
    }

    return candidates;
}

function addFlavor(text) {
    const prefixes = [
        "",
        "",
        "",
        "Oh. ",
        "Right. ",
        "Sure. "
    ];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return prefix + text;
}

function triggerAIComment(commentType, data = {}) {
    const currentTime = Date.now();

    if (currentTime - AIState.lastCommentTime < AIState.commentInterval) {
        return;
    }

    const comments = CommentLibrary[commentType];
    if (!comments || comments.length === 0) return;

    const sameTypeTooMuch =
        AIState.recentTypes.length >= 2 &&
        AIState.recentTypes[AIState.recentTypes.length - 1] === commentType &&
        AIState.recentTypes[AIState.recentTypes.length - 2] === commentType;

    if (sameTypeTooMuch) return;

    let availableComments = comments.filter(comment =>
        comment !== AIState.lastCommentText &&
        !AIState.recentComments.includes(comment)
    );

    if (availableComments.length === 0) {
        availableComments = comments.filter(comment => comment !== AIState.lastCommentText);
    }

    if (availableComments.length === 0) {
        availableComments = comments;
    }

    const randomIndex = Math.floor(Math.random() * availableComments.length);
    let comment = availableComments[randomIndex];

    comment = personalizeComment(comment, commentType, data);
    comment = addFlavor(comment);

    displayAIComment(comment);

    AIState.lastCommentTime = currentTime;
    AIState.lastCommentText = comment;
    AIState.lastCommentType = commentType;

    pushRecent(AIState.recentComments, comment, AIState.recentLimit);
    pushRecent(AIState.recentTypes, commentType, 6);
}

function personalizeComment(comment, commentType, data = {}) {
    if (commentType === 'score_milestone' && data.score) {
        if (data.score >= 20 && Math.random() < 0.2) {
            return `${data.score}. Annoying.`;
        }
        if (data.score < 20 && Math.random() < 0.2) {
            return `${data.score}. Tiny.`;
        }
    }

    if (commentType === 'fail_high_score' && data.score && Math.random() < 0.18) {
        return `${data.score}, then that?`;
    }

    if (commentType === 'combo_streak' && data.count && Math.random() < 0.18) {
        return `${data.count} in a row. Weird.`;
    }

    return comment;
}

function displayAIComment(comment) {
    const subtitleElement = document.getElementById('ai-subtitle');
    const avatarElement = document.getElementById('ai-avatar');

    if (subtitleTimeoutId) {
        clearTimeout(subtitleTimeoutId);
        subtitleTimeoutId = null;
    }

    if (subtitleElement) {
        subtitleElement.textContent = comment;
        subtitleElement.style.opacity = '1';
    }

    speakAIComment(comment);

    if (avatarElement) {
        const faces = ['[+_+]', '[>_<]', '[@_@]', '[^_^]', '[¬_¬]', '[o_o]'];
        avatarElement.textContent = faces[Math.floor(Math.random() * faces.length)];
        avatarElement.style.transform = 'translateY(-2px)';
    }

    const displayDuration = Math.max(1800, Math.min(3200, comment.length * 85));

    subtitleTimeoutId = setTimeout(() => {
        if (subtitleElement) {
            subtitleElement.style.opacity = '0';
        }

        if (avatarElement) {
            avatarElement.textContent = '[-_-]';
            avatarElement.style.transform = 'translateY(0)';
        }

        subtitleTimeoutId = null;
    }, displayDuration);
}

function updateAICommentary(deltaTime) {
    // reserved for future pacing logic
}

function addRandomComment() {
    triggerAIComment('idle_banter');
}

setInterval(() => {
    if (typeof GameState === 'undefined') return;
    if (!GameState.isRunning) return;
    if (!('speechSynthesis' in window)) return;
    if (!VoiceState.enabled || !VoiceState.unlocked) return;
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;

    const randomChance = Math.random();
    if (randomChance < 0.12) {
        triggerAIComment('idle_banter');
    }
}, 18000);

document.addEventListener('visibilitychange', () => {
    if (document.hidden && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        pendingVoiceText = null;
    }
});

initVoice();
bindVoiceUnlock();
initAICommentary();

document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-voice-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            unlockVoice();
            setTimeout(() => {
                speakAIComment('Testing AI voice.');
            }, 200);
        });
    }
});