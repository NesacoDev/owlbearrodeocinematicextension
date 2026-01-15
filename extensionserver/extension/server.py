#!/usr/bin/env python3
"""
Servidor HTTP simples para hospedar a extensão OWLbear localmente
Acesse em: http://localhost:8765
"""

import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs

PORT = 8765
EXTENSION_DIR = os.path.dirname(os.path.abspath(__file__))

class ExtensionHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Se for a raiz, serve o index.html
        if path == '/' or path == '':
            self.path = '/index.html'
        
        # Definir MIME types corretos
        if path.endswith('.json'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            with open(os.path.join(EXTENSION_DIR, path.lstrip('/')), 'rb') as f:
                self.wfile.write(f.read())
        else:
            return super().do_GET()
    
    def end_headers(self):
        """Adicionar headers CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Formatar logs"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    """Iniciar o servidor"""
    os.chdir(EXTENSION_DIR)
    
    with socketserver.TCPServer(("", PORT), ExtensionHandler) as httpd:
        print(f"""
╔════════════════════════════════════════════════════════════╗
║     🐻 Servidor de Extensão OWLbear em Execução 🐻        ║
╚════════════════════════════════════════════════════════════╝

📍 URL da Extensão: http://localhost:{PORT}
📁 Diretório: {EXTENSION_DIR}

🔗 Para usar a extensão no OWLbear:
   1. Abra o OWLbear
   2. Vá até Extensões
   3. Adicione uma extensão personalizada
   4. Use a URL: http://localhost:{PORT}

⚙️  O servidor está rodando...
   Pressione CTRL+C para parar

════════════════════════════════════════════════════════════
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Servidor encerrado!")

if __name__ == '__main__':
    run_server()
