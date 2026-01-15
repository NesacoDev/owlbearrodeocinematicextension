import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import https from 'https'
import http from 'http'
import selfsigned from 'selfsigned'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT_HTTP = 8766
const PORT_HTTPS = 8767

// Armazenar arquivo em memória
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } })

// CORS permissivo
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Range'],
  credentials: false
}))

app.use(express.json())

// Armazenar vídeo atual
let currentVideoBuffer = null
let currentVideoName = 'video'
let currentVideoMime = 'video/mp4'

// Receber upload de vídeo
app.post('/api/video-upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo recebido' })
  }

  currentVideoBuffer = req.file.buffer
  currentVideoName = req.file.originalname
  currentVideoMime = req.file.mimetype

  console.log(`✅ Vídeo recebido: ${currentVideoName} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`)

  res.json({
    success: true,
    videoUrl: `/api/video`,
    name: currentVideoName,
    size: req.file.size
  })
})

// Servir vídeo com suporte a range requests (streaming)
app.get('/api/video', (req, res) => {
  if (!currentVideoBuffer) {
    return res.status(404).json({ error: 'Nenhum vídeo carregado' })
  }

  const fileSize = currentVideoBuffer.length
  const range = req.headers.range

  if (range) {
    // Suportar range requests para streaming
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

    if (start >= fileSize || end >= fileSize) {
      res.status(416).send(`Range Not Satisfiable\n${start}, ${end}, ${fileSize}`)
      return
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': currentVideoMime,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    })
    res.end(currentVideoBuffer.slice(start, end + 1))
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': currentVideoMime,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    })
    res.end(currentVideoBuffer)
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    videoLoaded: !!currentVideoBuffer,
    videoName: currentVideoName,
    videoSize: currentVideoBuffer ? currentVideoBuffer.length : 0
  })
})

// Servir arquivos estáticos (manifesto)
app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'public')))

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), { maxAge: 0 })
})

// Iniciar servidor HTTP
http.createServer(app).listen(PORT_HTTP, () => {
  console.log(`🎬 Servidor HTTP rodando em http://localhost:${PORT_HTTP}`)
  console.log(`📡 Upload: POST http://localhost:${PORT_HTTP}/api/video-upload`)
  console.log(`▶️  Stream: http://localhost:${PORT_HTTP}/api/video`)
})

// Também iniciar HTTPS
const certPath = path.join(__dirname, 'cert.pem')
const keyPath = path.join(__dirname, 'key.pem')

const startHTTPSServer = () => {
  // Verificar se certificados já existem
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
      https.createServer(options, app).listen(PORT_HTTPS, () => {
        console.log(`🔐 Servidor HTTPS rodando em https://localhost:${PORT_HTTPS}`)
        console.log(`📡 Upload: POST https://localhost:${PORT_HTTPS}/api/video-upload`)
        console.log(`▶️  Stream: https://localhost:${PORT_HTTPS}/api/video`)
      })
      return
    } catch (err) {
      console.log('📌 Erro ao ler certificados:', err.message)
    }
  }
  
  // Gerar novos certificados
  console.log('🔐 Gerando certificado auto-assinado...')
  try {
    const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 })
    
    if (!pems || !pems.private || !pems.cert) {
      throw new Error('Falha ao gerar certificado')
    }
    
    fs.writeFileSync(keyPath, pems.private, 'utf8')
    fs.writeFileSync(certPath, pems.cert, 'utf8')
    
    const options = {
      key: pems.private,
      cert: pems.cert
    }
    
    https.createServer(options, app).listen(PORT_HTTPS, () => {
      console.log(`🔐 Servidor HTTPS rodando em https://localhost:${PORT_HTTPS}`)
      console.log(`📡 Upload: POST https://localhost:${PORT_HTTPS}/api/video-upload`)
      console.log(`▶️  Stream: https://localhost:${PORT_HTTPS}/api/video`)
    })
  } catch (err) {
    console.log('❌ Erro ao gerar certificado:', err.message)
    console.log('   HTTPS desabilitado - usando HTTP apenas')
  }
}

startHTTPSServer()

console.log(`✅ Use https://localhost:5173/manifest.json no OWLbear`)
