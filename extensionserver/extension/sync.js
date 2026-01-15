const fileInput = document.getElementById('file');
const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');
const statusDiv = document.getElementById('status');
const overlay = document.getElementById('overlay');
const videoEl = document.getElementById('video');
const closeOverlay = document.getElementById('closeOverlay');

let objectUrl = null;
let ws = null;
let isMaster = false;
let syncInterval = null;

function connectWS() {
    ws = new WebSocket('ws://localhost:8766');
    ws.onopen = () => {
        isMaster = confirm('Você é o mestre? Clique OK para mestre, Cancelar para jogador.');
        ws.send(JSON.stringify({type: 'register', role: isMaster ? 'master' : 'player'}));
        if (!isMaster) {
            ws.send(JSON.stringify({type: 'request_sync'}));
        }
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'sync') {
            const state = data.state;
            if (state.playing && objectUrl) {
                overlay.style.display = 'flex';
                overlay.setAttribute('aria-hidden', 'false');
                btnStop.disabled = false;
                videoEl.currentTime = state.currentTime;
                videoEl.play();
                setStatus('Sincronizado com o mestre.');
            } else if (!state.playing) {
                videoEl.pause();
                overlay.style.display = 'none';
                overlay.setAttribute('aria-hidden', 'true');
                btnStop.disabled = true;
                setStatus('Aguardando mestre iniciar.');
            }
        }
    };
    ws.onclose = () => {
        setStatus('Desconectado do servidor de sincronização.');
    };
}

connectWS();

const setStatus = (msg) => {
    statusDiv.textContent = msg;
};

const cleanupVideo = () => {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
    }
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    btnPlay.disabled = !fileInput.files.length;
    btnStop.disabled = true;
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
};

const stopPlayback = () => {
    cleanupVideo();
    setStatus('Playback interrompido.');
    if (ws && isMaster) {
        ws.send(JSON.stringify({type: 'update', playing: false, currentTime: 0}));
    }
};

fileInput.addEventListener('change', () => {
    cleanupVideo();
    const file = fileInput.files?.[0];
    if (!file) {
        setStatus('Selecione um arquivo de vídeo.');
        return;
    }
    objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;
    btnPlay.disabled = false;
    setStatus(`Pronto: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
});

btnPlay.addEventListener('click', async () => {
    if (!objectUrl) {
        setStatus('Selecione um vídeo antes de tocar.');
        return;
    }
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    btnStop.disabled = false;
    try {
        await videoEl.play();
        setStatus('Reproduzindo vídeo.');
        if (ws && isMaster) {
            ws.send(JSON.stringify({type: 'update', playing: true, currentTime: videoEl.currentTime}));
            syncInterval = setInterval(() => {
                ws.send(JSON.stringify({type: 'update', playing: true, currentTime: videoEl.currentTime}));
            }, 1000);
        }
    } catch (err) {
        setStatus('Não foi possível iniciar o play (gesto do usuário pode ser exigido).');
    }
});

btnStop.addEventListener('click', stopPlayback);
closeOverlay.addEventListener('click', stopPlayback);

videoEl.addEventListener('ended', () => {
    stopPlayback();
    setStatus('Vídeo concluído.');
});

window.addEventListener('beforeunload', () => {
    cleanupVideo();
});
