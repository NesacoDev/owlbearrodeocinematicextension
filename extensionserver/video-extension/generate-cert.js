import { generateKeyPairSync } from 'crypto'
import { writeFileSync } from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certPath = path.join(__dirname, 'cert.pem')
const keyPath = path.join(__dirname, 'key.pem')

// Tentar usar OpenSSL se disponível
console.log('🔐 Tentando gerar certificado auto-assinado...')

try {
  // Verificar se OpenSSL está disponível
  const result = spawnSync('openssl', ['version'], { encoding: 'utf8' })
  
  if (result.status === 0) {
    console.log('✅ OpenSSL encontrado, gerando certificado...')
    const cmd = spawnSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048',
      '-keyout', keyPath,
      '-out', certPath,
      '-days', '365',
      '-nodes',
      '-subj', '/CN=localhost'
    ], { encoding: 'utf8', shell: true })
    
    if (cmd.status === 0) {
      console.log('✅ Certificado gerado com sucesso!')
    } else {
      throw new Error('OpenSSL falhou')
    }
  } else {
    throw new Error('OpenSSL não disponível')
  }
} catch (err) {
  console.log('❌ OpenSSL não disponível, usando Node.js puro (autoplay pode não funcionar)')
  console.log('   Para HTTPS completo, instale OpenSSL: https://slproweb.com/products/Win32OpenSSL.html')
}
