import './style.css'
import OBR from '@owlbear-rodeo/sdk'

const BROADCAST_CHANNEL = "com.saimon.video-sync"
const MODAL_ID = "video-player-modal"
// Usar a mesma origem da extensão (5173) ao invés de 8766
const VIDEO_SERVER_URL = ""

document.querySelector('#app').innerHTML = `
  <div class="shell">
    <h1>🎬 Player de Vídeo Global</h1>
    <p class="subtitle">Carregue um vídeo local e reproduza em tela grande.</p>

    <div class="panel">
      <label for="file">Arquivo de vídeo (local)</label>
      <input id="file" type="file" accept="video/*">
      <div class="actions">
        <button id="btnPlay" disabled>Play em Tela Grande</button>
        <button id="btnStop" class="secondary" disabled>Parar</button>
      </div>
      <div id="status" class="status">Aguardando SDK...</div>
      <div id="roleInfo" class="role-info"></div>
    </div>
  </div>

  <div id="overlay" class="overlay" aria-hidden="true">
    <button class="close-btn" id="closeOverlay">Fechar</button>
    <button class="play-interaction" id="playInteraction">▶️ Clique para Assistir (Com Som)</button>
    <video id="video" playsinline muted preload="auto"></video>
  </div>

  <div id="ngrokBackdrop" class="ngrok-backdrop" aria-hidden="true"></div>
  <div id="ngrokPopup" class="ngrok-popup" aria-hidden="true">
    <h2>Gostaria de usar a extensão exclusiva do nosso rpg?</h2>
    <p>Para liberar o acesso, abra o link do servidor e clique em "Visit Site".</p>
    <div class="ngrok-actions">
      <button id="ngrokOpen">Abrir link</button>
      <button id="ngrokReload" class="secondary">Recarregar</button>
      <button id="ngrokDismiss" class="secondary">Agora não</button>
    </div>
  </div>
`

const fileInput = document.getElementById('file')
const btnPlay = document.getElementById('btnPlay')
const btnStop = document.getElementById('btnStop')
const statusDiv = document.getElementById('status')
const roleInfo = document.getElementById('roleInfo')
const overlay = document.getElementById('overlay')
const videoEl = document.getElementById('video')
const closeOverlay = document.getElementById('closeOverlay')
const playInteraction = document.getElementById('playInteraction')
const ngrokBackdrop = document.getElementById('ngrokBackdrop')
const ngrokPopup = document.getElementById('ngrokPopup')
const ngrokOpen = document.getElementById('ngrokOpen')
const ngrokReload = document.getElementById('ngrokReload')
const ngrokDismiss = document.getElementById('ngrokDismiss')

let objectUrl = null
let isGM = false
let videoUrl = null
let currentFileName = ''
let isPlaying = false
let lastCommandTime = 0
let currentVideoUrl = ''
let userInteracted = false

const setStatus = (msg) => {
  statusDiv.textContent = msg
}

const showNgrokPopup = () => {
  ngrokBackdrop.style.display = 'block'
  ngrokPopup.style.display = 'block'
  ngrokBackdrop.setAttribute('aria-hidden', 'false')
  ngrokPopup.setAttribute('aria-hidden', 'false')
}

const hideNgrokPopup = () => {
  ngrokBackdrop.style.display = 'none'
  ngrokPopup.style.display = 'none'
  ngrokBackdrop.setAttribute('aria-hidden', 'true')
  ngrokPopup.setAttribute('aria-hidden', 'true')
}

const checkNgrokAccess = async () => {
  const key = 'ngrok-visit-site-confirmed'
  if (localStorage.getItem(key) === 'true') return

  try {
    const resp = await fetch(`${window.location.origin}/`, {
      credentials: 'include',
      cache: 'no-store'
    })
    const text = await resp.text()

    // Heurística: detectar página de aviso do ngrok
    if (/ngrok/i.test(text) && /visit site|browser warning|continue/i.test(text)) {
      showNgrokPopup()
    }
  } catch (err) {
    console.warn('⚠️ Falha ao verificar aviso do ngrok:', err)
  }
}

ngrokOpen?.addEventListener('click', () => {
  window.open(window.location.origin, '_blank', 'noopener')
  localStorage.setItem('ngrok-visit-site-confirmed', 'true')
})

ngrokReload?.addEventListener('click', () => {
  window.location.reload()
})

ngrokDismiss?.addEventListener('click', () => {
  hideNgrokPopup()
})

const cleanupVideo = () => {
  isPlaying = false
  videoEl.pause()
  videoEl.removeAttribute('src')
  videoEl.load()
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  overlay.style.display = 'none'
  overlay.setAttribute('aria-hidden', 'true')
  btnPlay.disabled = !fileInput.files.length
  btnStop.disabled = true
}

const openModalForAll = async (videoUrl = null) => {
  try {
    console.log('📡 Abrindo modal para todos...')
    
    // Construir URL com parâmetro se houver vídeo
    const modalUrl = videoUrl ? `/modal.html?video=${encodeURIComponent(videoUrl)}` : '/modal.html'
    
    // Abrir modal localmente
    await OBR.modal.open({
      id: MODAL_ID,
      url: modalUrl,
      fullScreen: true,
      disablePointerEvents: false
    })
    
    console.log('✓ Modal aberto com URL:', modalUrl)
  } catch (err) {
    console.warn('Não foi possível abrir modal:', err)
  }
}

fileInput.addEventListener('change', async () => {
  cleanupVideo()
  const file = fileInput.files?.[0]
  if (!file) {
    setStatus('Selecione um arquivo de vídeo.')
    return
  }
  
  setStatus('📤 Enviando vídeo ao servidor...')
  
  // Criar FormData para upload
  const formData = new FormData()
  formData.append('video', file)
  
  try {
    const response = await fetch(`${VIDEO_SERVER_URL}/api/video-upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Erro no servidor: ${response.status}`)
    }
    
    const data = await response.json()
    videoUrl = data.videoUrl
    currentFileName = file.name
    
    // Carregar preview localmente
    objectUrl = URL.createObjectURL(file)
    videoEl.src = objectUrl
    
    btnPlay.disabled = !isGM
    setStatus(`✅ Pronto: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`✅ URL do vídeo: ${videoUrl}`)
  } catch (err) {
    console.error('Erro ao enviar:', err)
    setStatus(`❌ Erro ao enviar: ${err.message}`)
  }
})

btnPlay.addEventListener('click', async () => {
  if (!isGM) {
    setStatus('⚠️ Apenas o mestre pode controlar o vídeo.')
    return
  }
  
  if (!videoUrl) {
    setStatus('Selecione um vídeo antes de tocar.')
    return
  }
  
  overlay.style.display = 'flex'
  overlay.setAttribute('aria-hidden', 'false')
  btnStop.disabled = false
  
  // Abrir modal para todos os jogadores JÁ COM A URL
  await openModalForAll(videoUrl)
  
  // Aguardar 3s para modal.js carregar completamente antes de enviar broadcast
  console.log('⏳ Aguardando modal carregar (3s)...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Enviar comando de play com URL do servidor
  try {
    const fullVideoUrl = `${VIDEO_SERVER_URL}${videoUrl}`
    console.log(`📡 Enviando comando de play com URL: ${fullVideoUrl}`)
    
    await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, {
      action: 'play',
      videoUrl: fullVideoUrl,
      videoName: currentFileName,
      timestamp: 0
    }, { destination: 'ALL' })
    
    setStatus('📡 Transmitindo comando para todos os jogadores...')
  } catch (err) {
    console.error('Erro ao transmitir:', err)
    setStatus('Erro ao transmitir comando.')
  }
})

const stopPlayback = () => {
  if (isGM && isPlaying) {
    isPlaying = false
    // GM envia comando de parar para todos
    OBR.broadcast.sendMessage(BROADCAST_CHANNEL, {
      action: 'stop'
    }, { destination: 'ALL' }).catch(err => console.error('Erro ao parar:', err))
  }
}

btnStop.addEventListener('click', () => {
  if (!isGM) {
    setStatus('⚠️ Apenas o mestre pode parar o vídeo.')
    return
  }
  stopPlayback()
})

closeOverlay.addEventListener('click', () => {
  if (!isGM) {
    setStatus('⚠️ Apenas o mestre pode fechar o vídeo.')
    return
  }
  stopPlayback()
})

videoEl.addEventListener('ended', () => {
  if (isGM) {
    stopPlayback()
  }
})

window.addEventListener('beforeunload', () => {
  cleanupVideo()
})

// Configurar listeners de broadcast
const setupBroadcastListeners = () => {
  OBR.broadcast.onMessage(BROADCAST_CHANNEL, async (event) => {
    const { action, videoUrl: msgVideoUrl, videoName, timestamp } = event.data
    
    console.log('📡 Recebido comando:', action, msgVideoUrl)
    
    if (action === 'play' && msgVideoUrl) {
      // Debounce: ignorar comandos muito rápidos
      const now = Date.now()
      if (now - lastCommandTime < 500) {
        console.log('⏸️  Ignorando comando duplicado (debounce)')
        return
      }
      lastCommandTime = now
      
      // Evitar conflitos: não fazer play se já está tocando A MESMA URL
      if (isPlaying && currentVideoUrl === msgVideoUrl) {
        console.log('⏸️  Já está tocando este vídeo, ignorando')
        return
      }
      
      isPlaying = true
      currentVideoUrl = msgVideoUrl
      
      // Abrir modal fullscreen para TODOS passando a URL
      await openModalForAll(msgVideoUrl)
      
      // O modal vai escutar o broadcast e tocar o vídeo
      setStatus(`📡 Modal aberto, transmitindo vídeo...`)
      
    } else if (action === 'stop') {
      // Debounce para stop também
      const now = Date.now()
      if (now - lastCommandTime < 300) {
        console.log('⏸️  Ignorando stop duplicado (debounce)')
        return
      }
      lastCommandTime = now
      
      // Todos param o vídeo
      isPlaying = false
      currentVideoUrl = ''
      cleanupVideo()
      setStatus(isGM ? 'Vídeo parado.' : 'O mestre parou o vídeo.')
    }
  })
}

// Inicializar quando SDK estiver pronto
OBR.onReady(async () => {
  console.log('OWLbear SDK pronto!')
  checkNgrokAccess()
  
  // Verificar se é GM
  const role = await OBR.player.getRole()
  isGM = (role === 'GM')
  
  if (isGM) {
    roleInfo.textContent = '👑 Você é o Mestre - Controles habilitados'
    roleInfo.style.color = '#4CAF50'
    fileInput.disabled = false
    setStatus('Selecione um arquivo de vídeo.')
  } else {
    roleInfo.textContent = '👤 Você é um Jogador - Aguardando comandos do mestre'
    roleInfo.style.color = '#FF9800'
    fileInput.disabled = true
    btnPlay.disabled = true
    setStatus('Aguardando o mestre iniciar o vídeo...')
  }
  
  // Configurar listeners
  setupBroadcastListeners()
  
  console.log(`✅ Iniciado como: ${role}`)

  // Se for player, checar se GM está tocando vídeo
  if (!isGM) {
    // Solicitar estado do GM
    await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, { action: 'state-request' })

    // Listener temporário para resposta do GM
    const handleStateResponse = async (event) => {
      const { action, videoUrl: gmVideoUrl, isPlaying: gmIsPlaying } = event.data || {}
      if (action === 'state-response' && gmIsPlaying && gmVideoUrl) {
        // Se o player não está vendo o vídeo
        if (!isPlaying || currentVideoUrl !== gmVideoUrl) {
          console.log('[SYNC] GM está tocando vídeo, player não está vendo. Abrindo/sincronizando...')
          isPlaying = true
          currentVideoUrl = gmVideoUrl
          await openModalForAll(gmVideoUrl)
          setStatus('🔄 Sincronizado com o mestre!')
        }
      }
      // Remove listener após primeira resposta
      OBR.broadcast.offMessage(BROADCAST_CHANNEL, handleStateResponse)
    }
    OBR.broadcast.onMessage(BROADCAST_CHANNEL, handleStateResponse)
  }
})
