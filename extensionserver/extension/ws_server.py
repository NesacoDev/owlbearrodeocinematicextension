import asyncio
import websockets
import json

# Estado global do vídeo
video_state = {
    'playing': False,
    'currentTime': 0,
    'lastUpdate': 0,
    'master': None,
}
clients = set()

async def notify_state():
    if clients:
        message = json.dumps({'type': 'sync', 'state': video_state})
        await asyncio.gather(*(client.send(message) for client in clients))

async def handler(websocket, path):
    global video_state
    clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            if data['type'] == 'register':
                if data.get('role') == 'master':
                    video_state['master'] = websocket
            elif data['type'] == 'update':
                # Apenas o mestre pode atualizar
                if websocket == video_state['master']:
                    video_state['playing'] = data['playing']
                    video_state['currentTime'] = data['currentTime']
                    video_state['lastUpdate'] = asyncio.get_event_loop().time()
                    await notify_state()
            elif data['type'] == 'request_sync':
                await websocket.send(json.dumps({'type': 'sync', 'state': video_state}))
    except Exception:
        pass
    finally:
        clients.remove(websocket)
        if websocket == video_state.get('master'):
            video_state['master'] = None

start_server = websockets.serve(handler, 'localhost', 8766)

print('Servidor WebSocket rodando em ws://localhost:8766')
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
