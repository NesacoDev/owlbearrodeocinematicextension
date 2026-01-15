# 🐻 Extensão de Teste OWLbear - Hospedagem Local

Uma extensão simples do OWLbear hospedada localmente para fins de teste e desenvolvimento.

## 📋 Requisitos

- Python 3.6+
- OWLbear (qualquer versão recente)
- Navegador moderno (Chrome, Firefox, Edge, etc.)

## 🚀 Como Usar

### 1. Iniciar o Servidor

Abra um terminal (PowerShell, CMD ou outro) e execute:

```bash
cd c:\Users\Saimon\Downloads\owlbearextensaodecarregarsite\extension
python server.py
```

Você verá uma mensagem como:
```
📍 URL da Extensão: http://localhost:8765
⚙️  O servidor está rodando...
```

### 2. Adicionar a Extensão no OWLbear

1. Abra o **OWLbear** em seu navegador
2. Clique em **Extensões** (geralmente no menu superior)
3. Clique em **Adicionar Extensão Personalizada** ou similar
4. Cole a URL: `http://localhost:8765`
5. Pronto! A extensão está carregada

### 3. Usar a Extensão

A extensão inclui:
- **📝 Enviar Mensagem** - Prepare mensagens para enviar
- **🎲 Rolador de Dados** - Role dados D4, D6, D8, D10, D12 e D20
- **✅ Teste de Conexão** - Verifique se tudo está funcionando
- **ℹ️ Informações** - Veja detalhes da extensão
- **📋 Log de Atividades** - Acompanhe todas as ações

## 📁 Estrutura de Arquivos

```
extension/
├── index.html          # Interface da extensão
├── manifest.json       # Configuração da extensão
├── server.py           # Servidor HTTP
└── README.md           # Este arquivo
```

## ⚙️ Configuração

### Alterar a Porta

Se a porta 8765 já está em uso, edite `server.py`:

```python
PORT = 8765  # Altere para outra porta, ex: 8766
```

### Personalizar a Extensão

1. Edite `index.html` para alterar a interface
2. Edite `manifest.json` para mudar nome e descrição
3. Recarregue a extensão no OWLbear (F5 ou atualizar)

## 🔒 Segurança

- ⚠️ Este servidor é apenas para desenvolvimento/teste local
- Não use em produção ou em conexões da internet
- O servidor escuta apenas em `localhost:8765`

## 🐛 Troubleshooting

### Porta já em uso
```
Se receber erro "Address already in use":
- Altere PORT no server.py para 8766 ou outra
```

### CORS bloqueado
```
O servidor já inclui headers CORS
Se ainda tiver problemas, tente desabilitar extensões do navegador
```

### Extensão não carrega
```
1. Verifique se o servidor está rodando
2. Tente F5 ou atualizar a página do OWLbear
3. Verifique console (F12) para erros
```

## 📝 Desenvolvimento

Para adicionar mais funcionalidades:

1. Edite `index.html` - Adicione HTML/CSS/JavaScript
2. O servidor recarga automaticamente
3. Atualizar no OWLbear (F5)

### Exemplo: Adicionar novo botão

```html
<button onclick="myFunction()">Meu Botão</button>

<script>
function myFunction() {
    addLog('Meu botão foi clicado!');
}
</script>
```

## 🆘 Ajuda

- Documentação OWLbear: https://docs.owlbear.app/
- Python http.server: https://docs.python.org/3/library/http.server.html

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-14
