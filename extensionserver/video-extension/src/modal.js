
console.log('[DEBUG] modal.js carregado')
import OBR from '@owlbear-rodeo/sdk'


const video = document.getElementById('video')
const soundBtn = document.getElementById('soundBtn')
const status = document.getElementById('status')
const playOverlay = document.getElementById('playOverlay')
console.log('[DEBUG] video:', video)
console.log('[DEBUG] soundBtn:', soundBtn)
console.log('[DEBUG] status:', status)
console.log('[DEBUG] playOverlay:', playOverlay)

// Botões GM
const gmControls = document.getElementById('gmControls')
const btnPauseResume = document.getElementById('btnPauseResume')
const btnSync = document.getElementById('btnSync')
const btnCloseAll = document.getElementById('btnCloseAll')

const BROADCAST_CHANNEL = "com.saimon.video-sync"
const MODAL_ID = "video-player-modal"
console.log('[DEBUG] BROADCAST_CHANNEL:', BROADCAST_CHANNEL)
console.log('[DEBUG] MODAL_ID:', MODAL_ID)

let isPlaying = false
let role = null

const applySyncAction = async (action, payload = {}) => {
  if (action === 'sync-pause') {
    console.log('⏸️ Pausando via sync')
    video.pause()
    if (typeof payload.currentTime === 'number' && Math.abs(video.currentTime - payload.currentTime) > 0.5) {
      video.currentTime = payload.currentTime
    }
    if (role === 'GM' && btnPauseResume) btnPauseResume.textContent = '▶️ Retomar Todos'
    return
  }

  if (action === 'sync-play') {
    console.log('▶️ Retomando via sync')
    if (typeof payload.currentTime === 'number' && Math.abs(video.currentTime - payload.currentTime) > 0.5) {
      video.currentTime = payload.currentTime
    }
    try {
      await video.play()
    } catch (err) {
      console.warn('⚠️ Falha ao retomar via sync:', err)
      playOverlay.style.display = 'flex'
    }
    if (role === 'GM' && btnPauseResume) btnPauseResume.textContent = '⏸️ Pausar Todos'
    return
  }

  if (action === 'sync-seek') {
    console.log('🔄 Sincronizando tempo:', payload.currentTime)
    if (typeof payload.currentTime === 'number') {
      video.currentTime = payload.currentTime
    }
    return
  }

  if (action === 'stop') {
    console.log('⏹️ Parando e fechando modal')
    video.pause()
    video.src = ''
    isPlaying = false
    playOverlay.style.display = 'none'

    try {
      await OBR.modal.close(MODAL_ID)
    } catch (err) {
      console.error('Erro ao fechar modal:', err)
    }
  }
}

const showStatus = (msg) => {
  status.textContent = msg
  status.style.display = 'block'
  setTimeout(() => {
    status.style.display = 'none'
  }, 3000)
}

soundBtn.addEventListener('click', () => {
  video.muted = false
  soundBtn.style.display = 'none'
  showStatus('🔊 Som ativado')
})

playOverlay.addEventListener('click', async () => {
  console.log('👆 Interação do usuário detectada')
  playOverlay.style.display = 'none'
  video.muted = false // Tenta já com som
  try {
    await video.play()
    soundBtn.style.display = 'none'
  } catch (err) {
    console.error('❌ Falha ao recuperar play:', err)
    video.muted = true
    await video.play()
    soundBtn.style.display = 'block'
  }
})



let currentVideoUrl = ''
const playVideo = async (videoUrl, videoName) => {
  console.log('[DEBUG] playVideo chamada', { videoUrl, videoName, currentVideoUrl, videoPaused: video.paused, videoSrc: video.src })
  if (currentVideoUrl === videoUrl && !video.paused) {
    console.log('[DEBUG] Ignorando play duplicado')
    return
  }
  currentVideoUrl = videoUrl
  video.src = videoUrl
  video.muted = true
  console.log('[DEBUG] Antes do play: video.src', video.src, 'video.muted', video.muted)
  try {
    console.log('[DEBUG] Chamando video.play()...')
    const playPromise = await video.play()
    console.log('[DEBUG] video.play() resolvido:', playPromise)
    showStatus(`🎬 ${videoName || 'Vídeo'}`)
    isPlaying = true
    setTimeout(() => {
      if (video.paused) {
        console.warn('[DEBUG] Vídeo pausou (possível bloqueio de autoplay)')
        soundBtn.style.display = 'block'
        showStatus('🔊 Clique para liberar o som')
      } else {
        console.log('[DEBUG] Vídeo está tocando normalmente após play')
      }
    }, 300)
  } catch (err) {
    console.error('[DEBUG] Erro ao tocar vídeo no modal:', err)
    if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
      console.warn('[DEBUG] Play bloqueado ou interrompido')
      soundBtn.style.display = 'block'
      showStatus('🔊 Clique para liberar o som')
      setLocked(true)
    } else {
      showStatus('⚠️ Erro ao reproduzir')
    }
  }
}

// Escutar comandos de broadcast

OBR.onReady(async () => {
  console.log('player entrou!');
  console.log('[DEBUG] OBR.onReady chamado')
  console.log('Modal de vídeo pronto!')

  // 1. Detectar se é GM e mostrar painel
  role = await OBR.player.getRole()
  if (role === 'GM') {
    gmControls.style.display = 'flex'
    console.log('👑 Modo GM ativado: controles visíveis')
  } else {
    console.log('[DEBUG] Modo PLAYER')
    // Só solicita sync na primeira carga da página
    if (window.__videoSyncFirstLoad !== true) {
      window.__videoSyncFirstLoad = true;
      // Flag para saber se o vídeo já tocou
      window.__videoHasPlayed = false;
      video.addEventListener('playing', () => {
        window.__videoHasPlayed = true;
        console.log('[DEBUG] Evento playing: vídeo tocou, não solicitará mais sync');
      });
      video.addEventListener('timeupdate', () => {
        if (video.currentTime > 0 && !window.__videoHasPlayed) {
          window.__videoHasPlayed = true;
          console.log('[DEBUG] Evento timeupdate: vídeo tocou, não solicitará mais sync');
        }
      });
      let syncTries = 0;
      const requestSync = async () => {
        if (window.__videoHasPlayed) {
          console.log('[DEBUG] Vídeo já tocou, parando tentativas de sync');
          return;
        }
        if (syncTries >= 8) return;
        syncTries++;
        console.log('[DEBUG] Solicitando estado do GM para sincronizar (tentativa', syncTries, ')');
        await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, { action: 'state-request' });
        setTimeout(requestSync, 1000);
      };
      requestSync();
    }
  }

  // 2. Logic de controles do GM
  if (btnPauseResume) {
    btnPauseResume.addEventListener('click', async () => {
      const action = video.paused ? 'sync-play' : 'sync-pause'
      const currentTime = video.currentTime
      console.log(`👑 GM enviando ${action} em ${currentTime}s`)

      // Aplicar localmente primeiro (GM)
      await applySyncAction(action, { currentTime, videoUrl: video.src })

      // Enviar para todos os jogadores
      await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, {
        action,
        currentTime,
        videoUrl: video.src
      })
    })
  }

  if (btnCloseAll) {
    btnCloseAll.addEventListener('click', async () => {
      console.log('👑 GM encerrando vídeo para todos')
      await applySyncAction('stop')
      await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, { action: 'stop' })
    })
  }
  
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
       console.log('👑 GM forçando sincronia')
       await applySyncAction('sync-seek', { currentTime: video.currentTime })
       await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, {
        action: 'sync-seek',
        currentTime: video.currentTime
      })
    })
  }
  
  // Verificar se há vídeo na URL (autoplay imediato)
  const urlParams = new URLSearchParams(window.location.search)
  const autoVideoUrl = urlParams.get('video')
  
  if (autoVideoUrl) {
    console.log('[DEBUG] Autoplay via URL detectado:', autoVideoUrl)
    // Pequeno delay para garantir carregamento do DOM
    setTimeout(() => {
      console.log('[DEBUG] Executando playVideo via autoplay URL')
      playVideo(autoVideoUrl, 'Vídeo')
    }, 500)
  }

  OBR.broadcast.onMessage(BROADCAST_CHANNEL, async (event) => {
    console.log('[DEBUG] Broadcast recebido:', event)
    const { action, videoUrl, videoName } = event.data
    
    if (action === 'play' && videoUrl) {
      console.log('[DEBUG] Recebido comando play via broadcast')
      playVideo(videoUrl, videoName)
    }

    if (action === 'state-request' && role === 'GM') {
      // GM responde com o estado atual
      console.log('[DEBUG] GM recebeu state-request, enviando state-response')
      await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, {
        action: 'state-response',
        videoUrl: currentVideoUrl,
        currentTime: video.currentTime,
        isPlaying: !video.paused && !!video.src,
        isPaused: video.paused && !!video.src
      });
    }

    if (action === 'state-response' && role !== 'GM') {
      // Player recebe o estado do GM e sincroniza
      console.log('[DEBUG] Player recebeu state-response, sincronizando')
      if (event.data && event.data.videoUrl) {
        playVideo(event.data.videoUrl, event.data.videoName || 'Vídeo')
        if (typeof event.data.currentTime === 'number') {
          setTimeout(() => {
            video.currentTime = event.data.currentTime;
          }, 300);
        }
      }
    }

    if (action === 'sync-pause' || action === 'sync-play' || action === 'sync-seek' || action === 'stop') {
      console.log('[DEBUG] Recebido comando de sync/stop via broadcast:', action)
      await applySyncAction(action, event.data)
    }
  });
});
