// --- AUDIO SYSTEM (BEEP + VOZ) ---
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
    osc.stop(audioCtx.currentTime + 0.15);
}

function playDoubleBeep() {
    playBeep();
    setTimeout(playBeep, 200);
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        var msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'pt-BR';
        msg.rate = 1.3;
        msg.volume = 1.0;
        window.speechSynthesis.speak(msg);
    }
}

// --- TABS ---
window.switchTab = function(tabName) {
    var tabs = document.querySelectorAll('.tab-content');
    var btns = document.querySelectorAll('.tab-btn');

    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
    }
    
    document.getElementById('tab-' + tabName).classList.add('active');
    
    if(tabName === 'totem') btns[0].classList.add('active');
    if(tabName === 'boss') btns[1].classList.add('active');
};

// --- LÓGICA DO TOTEM ---
var totemCycle = 5800; 
var sequence = ['north', 'right', 'south', 'left'];
var totemStart = null;
var totemInterval = null;
var totemRunning = false;
var totemLastBeep = -1;

var totemEl = document.getElementById('totem-countdown');
var totemBar = document.getElementById('totem-progress');
var arrows = {
    north: document.getElementById('north'),
    right: document.getElementById('right'),
    south: document.getElementById('south'),
    left: document.getElementById('left')
};

function resetTotemVisuals() {
    var keys = Object.keys(arrows);
    for(var i=0; i<keys.length; i++) {
        arrows[keys[i]].classList.remove('active');
        arrows[keys[i]].classList.remove('warning');
    }
    totemEl.textContent = "0.0";
    totemBar.style.transform = "scaleX(0)";
}

function updateTotem() {
    var now = Date.now();
    var elapsed = now - totemStart;
    var remaining = totemCycle - (elapsed % totemCycle);
    var totalCycles = Math.floor(elapsed / totemCycle);
    var currentDirection = sequence[totalCycles % 4];
    var isWarning = remaining <= 1000;

    if (isWarning && totemLastBeep !== totalCycles) {
        playBeep();
        totemLastBeep = totalCycles;
    }

    var keys = Object.keys(arrows);
    for(var i=0; i<keys.length; i++) {
        arrows[keys[i]].classList.remove('active');
        arrows[keys[i]].classList.remove('warning');
    }

    if(arrows[currentDirection]) {
        arrows[currentDirection].classList.add('active');
        if(isWarning) arrows[currentDirection].classList.add('warning');
    }

    totemEl.textContent = (remaining / 1000).toFixed(1);
    totemBar.style.transform = "scaleX(" + ((totemCycle - remaining) / totemCycle) + ")";
}

window.startTotem = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (totemRunning) stopTotem();
    totemRunning = true;
    totemStart = Date.now();
    totemLastBeep = -1;
    totemInterval = setInterval(updateTotem, 50);
};

window.stopTotem = function() {
    totemRunning = false;
    clearInterval(totemInterval);
    resetTotemVisuals();
};

// --- LÓGICA DO BOSS ---
var bossCycle = 90000; // 1m 30s
var bossStart = null;
var bossInterval = null;
var bossRunning = false;
var bossLastReset = -1;
var bossLastSpoken = -1; 

var bossEl = document.getElementById('boss-countdown');
var bossBar = document.getElementById('boss-progress');

function formatTime(ms) {
    var totalSeconds = Math.ceil(ms / 1000);
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

function triggerBossFlash() {
    document.body.classList.add('flash-red');
    setTimeout(function() {
        document.body.classList.remove('flash-red');
    }, 300);
}

function updateBoss() {
    var now = Date.now();
    var elapsed = now - bossStart;
    var remaining = bossCycle - (elapsed % bossCycle);
    var currentCycle = Math.floor(elapsed / bossCycle);
    
    // Reset automático
    if (currentCycle > bossLastReset) {
        if (bossLastReset !== -1) {
            playDoubleBeep();
            speak("Reiniciando");
        }
        bossLastReset = currentCycle;
        bossLastSpoken = -1;
    }

    // Visual
    bossEl.textContent = formatTime(remaining);
    bossBar.style.transform = "scaleX(" + ((bossCycle - remaining) / bossCycle) + ")";

    // Lógica Áudio/Visual
    var secondsLeft = Math.ceil(remaining / 1000);

    if (remaining <= 10900) { 
        bossEl.style.color = "#ffcc00";
        bossEl.style.borderColor = "#ffcc00";

        if (secondsLeft <= 10 && secondsLeft >= 0 && secondsLeft !== bossLastSpoken) {
            if (secondsLeft !== 0) {
                speak(secondsLeft.toString());
                
                // PISCA TELA NO 3, 2, 1
                if (secondsLeft <= 3) {
                    triggerBossFlash();
                }
            }
            bossLastSpoken = secondsLeft;
        }
    } else {
        bossEl.style.color = "#fff";
        bossEl.style.borderColor = "#444";
    }
}

window.startBoss = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (bossRunning) stopBoss();
    bossRunning = true;
    bossStart = Date.now();
    bossLastReset = -1;
    bossLastSpoken = -1;
    
    updateBoss();
    bossInterval = setInterval(updateBoss, 100);
};

window.stopBoss = function() {
    bossRunning = false;
    clearInterval(bossInterval);
    window.speechSynthesis.cancel();
    document.body.classList.remove('flash-red');
    bossEl.textContent = "01:30";
    bossBar.style.transform = "scaleX(0)";
    bossEl.style.color = "#fff";
    bossEl.style.borderColor = "#444";

};

