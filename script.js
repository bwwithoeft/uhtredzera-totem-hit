// ... (Mantenha o sistema de Audio e lógicas do Totem/Boss originais) ...

// --- TABS ATUALIZADO ---
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
    if(tabName === 'check') btns[2].classList.add('active'); // Novo botão
};


// --- LÓGICA DO RARE CHECKER ---
var rareInterval = null;
var rareSchedule = [];
var nextRareIndex = 0;

function generateSchedule(baseHour, baseMinute) {
    var schedule = [];
    var currentHour = baseHour;
    var currentMinute = baseMinute;

    // Inicia somando 10 minutos do horário base
    currentMinute += 10;
    if (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
    }

    // Calcula de 10 em 10 minutos até acabar o dia (23:50+)
    while (currentHour < 24) {
        var hStr = (currentHour < 10 ? "0" : "") + currentHour;
        var mStr = (currentMinute < 10 ? "0" : "") + currentMinute;
        schedule.push({ hour: currentHour, minute: currentMinute, str: hStr + ":" + mStr });

        currentMinute += 10;
        if (currentMinute >= 60) {
            currentMinute -= 60;
            currentHour += 1;
        }
    }
    return schedule;
}

function renderSchedule() {
    var container = document.getElementById('schedule-list');
    container.innerHTML = '';
    
    for (var i = 0; i < rareSchedule.length; i++) {
        var div = document.createElement('div');
        div.className = 'time-slot';
        if (i < nextRareIndex) div.classList.add('past');
        if (i === nextRareIndex) div.classList.add('active');
        div.textContent = rareSchedule[i].str;
        container.appendChild(div);
    }
    
    var nextDisplay = document.getElementById('next-check-time');
    if (nextRareIndex < rareSchedule.length) {
        nextDisplay.textContent = rareSchedule[nextRareIndex].str;
    } else {
        nextDisplay.textContent = "Finalizado";
    }
}

function checkRareTime() {
    if (nextRareIndex >= rareSchedule.length) {
        stopRareCheck();
        return;
    }

    var now = new Date();
    var next = rareSchedule[nextRareIndex];

    // Checa se a hora e o minuto bateram (no segundo 0 para não apitar repetido)
    if (now.getHours() === next.hour && now.getMinutes() === next.minute && now.getSeconds() === 0) {
        playDoubleBeep();
        speak("Checar boss."); // Alerta de áudio
        
        // Pula para o próximo horário
        nextRareIndex++;
        renderSchedule();
    } 
    // Caso o usuário abra a página e o tempo já tenha passado
    else if (now.getHours() > next.hour || (now.getHours() === next.hour && now.getMinutes() > next.minute)) {
        nextRareIndex++;
        renderSchedule();
    }
}

window.startRareCheck = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    var timeInput = document.getElementById('base-time').value;
    if (!timeInput) {
        alert("Informe o horário base!");
        return;
    }

    stopRareCheck(); // Limpa instâncias anteriores

    var parts = timeInput.split(":");
    rareSchedule = generateSchedule(parseInt(parts[0], 10), parseInt(parts[1], 10));
    
    // Encontra qual é o próximo índice válido baseado no relógio atual do PC
    var now = new Date();
    nextRareIndex = 0;
    while (nextRareIndex < rareSchedule.length) {
        var next = rareSchedule[nextRareIndex];
        if (now.getHours() < next.hour || (now.getHours() === next.hour && now.getMinutes() < next.minute)) {
            break;
        }
        nextRareIndex++;
    }

    renderSchedule();
    
    // Checa o relógio a cada segundo
    rareInterval = setInterval(checkRareTime, 1000); 
};

window.stopRareCheck = function() {
    clearInterval(rareInterval);
    rareSchedule = [];
    document.getElementById('next-check-time').textContent = "--:--";
    document.getElementById('schedule-list').innerHTML = '';
};
