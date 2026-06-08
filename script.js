// ==========================================
// 1. ENGINE DE ÁUDIO (BEEP & SPEECH SYNTHESIS)
// ==========================================
var audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBeep() {
    initAudio();
    if (!audioCtx) return;
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

// ==========================================
// 2. CONTROLE DE NAVEGAÇÃO DE ABAS
// ==========================================
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
    if(tabName === 'check') btns[2].classList.add('active');
};

// ==========================================
// 3. MECÂNICA RADICULAR TOTEM
// ==========================================
var totemCycle = 5700; 
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
        if(arrows[keys[i]]) {
            arrows[keys[i]].classList.remove('active');
            arrows[keys[i]].classList.remove('warning');
        }
    }
    if(totemEl) totemEl.textContent = "0.0";
    if(totemBar) totemBar.style.transform = "scaleX(0)";
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
        if(arrows[keys[i]]) {
            arrows[keys[i]].classList.remove('active');
            arrows[keys[i]].classList.remove('warning');
        }
    }

    if(arrows[currentDirection]) {
        arrows[currentDirection].classList.add('active');
        if(isWarning) arrows[currentDirection].classList.add('warning');
    }

    if(totemEl) totemEl.textContent = (remaining / 1000).toFixed(1);
    if(totemBar) totemBar.style.transform = "scaleX(" + ((totemCycle - remaining) / totemCycle) + ")";
}

window.startTotem = function() {
    initAudio();
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

// ==========================================
// 4. MECÂNICA BOSS TIMER (1M 30S)
// ==========================================
var bossCycle = 90000; 
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
    
    if (currentCycle > bossLastReset) {
        if (bossLastReset !== -1) {
            playDoubleBeep();
            speak("Reiniciando");
        }
        bossLastReset = currentCycle;
        bossLastSpoken = -1;
    }

    if(bossEl) bossEl.textContent = formatTime(remaining);
    if(bossBar) bossBar.style.transform = "scaleX(" + ((bossCycle - remaining) / bossCycle) + ")";

    var secondsLeft = Math.ceil(remaining / 1000);

    if (remaining <= 10900) { 
        if(bossEl) {
            bossEl.style.color = "#ffcc00";
            bossEl.style.borderColor = "#ffcc00";
        }

        if (secondsLeft <= 10 && secondsLeft >= 0 && secondsLeft !== bossLastSpoken) {
            if (secondsLeft !== 0) {
                speak(secondsLeft.toString());
                if (secondsLeft <= 3) {
                    triggerBossFlash();
                }
            }
            bossLastSpoken = secondsLeft;
        }
    } else {
        if(bossEl) {
            bossEl.style.color = "#fff";
            bossEl.style.borderColor = "var(--border-color)";
        }
    }
}

window.startBoss = function() {
    initAudio();
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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.body.classList.remove('flash-red');
    if(bossEl) {
        bossEl.textContent = "01:30";
        bossEl.style.color = "#fff";
        bossEl.style.borderColor = "var(--border-color)";
    }
    if(bossBar) bossBar.style.transform = "scaleX(0)";
};

// ==========================================
// 5. MECÂNICA RARE CHECKER (AGENDAMENTO MANUAL)
// ==========================================
var rareInterval = null;
var rareSchedule = [];
var nextRareIndex = 0;

function generateScheduleFromInput(timeStr) {
    var schedule = [];
    var parts = timeStr.split(":");
    var baseHour = parseInt(parts[0], 10);
    var baseMin = parseInt(parts[1], 10);
    
    var now = new Date();
    
    // Instancia o timestamp inicial fixado no dia atual com a hora digitada
    var loopTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), baseHour, baseMin, 0, 0);
    
    // Adiciona os primeiros 10 minutos
    loopTime.setMinutes(loopTime.getMinutes() + 10);
    
    var currentDay = now.getDate();
    
    // Loop incremental de 10 em 10 minutos gerando os alvos até o dia virar
    while (loopTime.getDate() === currentDay) {
        var h = loopTime.getHours();
        var m = loopTime.getMinutes();
        var hStr = (h < 10 ? "0" : "") + h;
        var mStr = (m < 10 ? "0" : "") + m;
        
        schedule.push({
            timestamp: loopTime.getTime(),
            str: hStr + ":" + mStr
        });
        
        loopTime.setMinutes(loopTime.getMinutes() + 10);
    }
    return schedule;
}

function renderSchedule() {
    var container = document.getElementById('schedule-list');
    var nextDisplay = document.getElementById('next-check-time');
    if (!container || !nextDisplay) return;

    container.innerHTML = '';
    
    for (var i = 0; i < rareSchedule.length; i++) {
        var div = document.createElement('div');
        div.className = 'time-slot';
        if (i < nextRareIndex) div.classList.add('past');
        if (i === nextRareIndex) div.classList.add('active');
        div.textContent = rareSchedule[i].str;
        container.appendChild(div);
    }
    
    if (nextRareIndex < rareSchedule.length) {
        nextDisplay.textContent = rareSchedule[nextRareIndex].str;
        nextDisplay.classList.add('monitoring-active');
    } else {
        nextDisplay.textContent = "Fim do Dia";
        nextDisplay.classList.remove('monitoring-active');
    }
}

function checkRareTime() {
    if (nextRareIndex >= rareSchedule.length) {
        window.stopRareCheck();
        return;
    }

    var currentTime = Date.now();
    var nextTarget = rareSchedule[nextRareIndex];

    // Se o relógio do sistema atingir ou ultrapassar o carimbo de data/hora do alvo tático
    if (currentTime >= nextTarget.timestamp) {
        playDoubleBeep();
        speak("Checar boss"); 
        
        nextRareIndex++;
        renderSchedule();
    }
}

window.startRareCheck = function() {
    initAudio();
    
    var timeInput = document.getElementById('base-time').value;
    if (!timeInput) {
        alert("Informe o horário base (Ex: 11:00) para iniciar o monitoramento!");
        return;
    }

    window.stopRareCheck(); 

    // Executa e popula o array
    rareSchedule = generateScheduleFromInput(timeInput);
    
    // Varredura Tática: Avança automaticamente o index para ignorar horários que já passaram
    var currentTime = Date.now();
    nextRareIndex = 0;
    while (nextRareIndex < rareSchedule.length && rareSchedule[nextRareIndex].timestamp <= currentTime) {
        nextRareIndex++;
    }

    renderSchedule();
    rareInterval = setInterval(checkRareTime, 500); 
};

window.stopRareCheck = function() {
    clearInterval(rareInterval);
    rareSchedule = [];
    var nextDisplay = document.getElementById('next-check-time');
    var container = document.getElementById('schedule-list');
    if(nextDisplay) {
        nextDisplay.textContent = "--:--";
        nextDisplay.classList.remove('monitoring-active');
    }
    if(container) container.innerHTML = '';
};
