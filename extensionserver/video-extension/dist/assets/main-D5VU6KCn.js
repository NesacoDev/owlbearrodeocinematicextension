import{t as e}from"./lib-CEItrqmJ.js";var t=`com.saimon.video-sync`,n=`video-player-modal`,r=``;document.querySelector(`#app`).innerHTML=`
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
`;var i=document.getElementById(`file`),a=document.getElementById(`btnPlay`),o=document.getElementById(`btnStop`),s=document.getElementById(`status`),c=document.getElementById(`roleInfo`),l=document.getElementById(`overlay`),u=document.getElementById(`video`),d=document.getElementById(`closeOverlay`);document.getElementById(`playInteraction`);var f=document.getElementById(`ngrokBackdrop`),p=document.getElementById(`ngrokPopup`),m=document.getElementById(`ngrokOpen`),h=document.getElementById(`ngrokReload`),g=document.getElementById(`ngrokDismiss`),_=null,v=!1,y=null,b=``,x=!1,S=0,C=``,w=e=>{s.textContent=e},T=()=>{f.style.display=`block`,p.style.display=`block`,f.setAttribute(`aria-hidden`,`false`),p.setAttribute(`aria-hidden`,`false`)},E=()=>{f.style.display=`none`,p.style.display=`none`,f.setAttribute(`aria-hidden`,`true`),p.setAttribute(`aria-hidden`,`true`)},D=async()=>{if(localStorage.getItem(`ngrok-visit-site-confirmed`)!==`true`)try{let e=await(await fetch(`${window.location.origin}/`,{credentials:`include`,cache:`no-store`})).text();/ngrok/i.test(e)&&/visit site|browser warning|continue/i.test(e)&&T()}catch(e){console.warn(`⚠️ Falha ao verificar aviso do ngrok:`,e)}};m?.addEventListener(`click`,()=>{window.open(window.location.origin,`_blank`,`noopener`),localStorage.setItem(`ngrok-visit-site-confirmed`,`true`)}),h?.addEventListener(`click`,()=>{window.location.reload()}),g?.addEventListener(`click`,()=>{E()});var O=()=>{x=!1,u.pause(),u.removeAttribute(`src`),u.load(),_&&=(URL.revokeObjectURL(_),null),l.style.display=`none`,l.setAttribute(`aria-hidden`,`true`),a.disabled=!i.files.length,o.disabled=!0},k=async(t=null)=>{try{console.log(`📡 Abrindo modal para todos...`);let r=t?`/modal.html?video=${encodeURIComponent(t)}`:`/modal.html`;await e.modal.open({id:n,url:r,fullScreen:!0,disablePointerEvents:!1}),console.log(`✓ Modal aberto com URL:`,r)}catch(e){console.warn(`Não foi possível abrir modal:`,e)}};i.addEventListener(`change`,async()=>{O();let e=i.files?.[0];if(!e){w(`Selecione um arquivo de vídeo.`);return}w(`📤 Enviando vídeo ao servidor...`);let t=new FormData;t.append(`video`,e);try{let n=await fetch(`${r}/api/video-upload`,{method:`POST`,body:t});if(!n.ok)throw Error(`Erro no servidor: ${n.status}`);y=(await n.json()).videoUrl,b=e.name,_=URL.createObjectURL(e),u.src=_,a.disabled=!v,w(`✅ Pronto: ${e.name} (${(e.size/1024/1024).toFixed(1)} MB)`),console.log(`✅ URL do vídeo: ${y}`)}catch(e){console.error(`Erro ao enviar:`,e),w(`❌ Erro ao enviar: ${e.message}`)}}),a.addEventListener(`click`,async()=>{if(!v){w(`⚠️ Apenas o mestre pode controlar o vídeo.`);return}if(!y){w(`Selecione um vídeo antes de tocar.`);return}l.style.display=`flex`,l.setAttribute(`aria-hidden`,`false`),o.disabled=!1,await k(y),console.log(`⏳ Aguardando modal carregar (3s)...`),await new Promise(e=>setTimeout(e,3e3));try{let n=`${r}${y}`;console.log(`📡 Enviando comando de play com URL: ${n}`),await e.broadcast.sendMessage(t,{action:`play`,videoUrl:n,videoName:b,timestamp:0},{destination:`ALL`}),w(`📡 Transmitindo comando para todos os jogadores...`)}catch(e){console.error(`Erro ao transmitir:`,e),w(`Erro ao transmitir comando.`)}});var A=()=>{v&&x&&(x=!1,e.broadcast.sendMessage(t,{action:`stop`},{destination:`ALL`}).catch(e=>console.error(`Erro ao parar:`,e)))};o.addEventListener(`click`,()=>{if(!v){w(`⚠️ Apenas o mestre pode parar o vídeo.`);return}A()}),d.addEventListener(`click`,()=>{if(!v){w(`⚠️ Apenas o mestre pode fechar o vídeo.`);return}A()}),u.addEventListener(`ended`,()=>{v&&A()}),window.addEventListener(`beforeunload`,()=>{O()});var j=()=>{e.broadcast.onMessage(t,async e=>{let{action:t,videoUrl:n,videoName:r,timestamp:i}=e.data;if(console.log(`📡 Recebido comando:`,t,n),t===`play`&&n){let e=Date.now();if(e-S<500){console.log(`⏸️  Ignorando comando duplicado (debounce)`);return}if(S=e,x&&C===n){console.log(`⏸️  Já está tocando este vídeo, ignorando`);return}x=!0,C=n,await k(n),w(`📡 Modal aberto, transmitindo vídeo...`)}else if(t===`stop`){let e=Date.now();if(e-S<300){console.log(`⏸️  Ignorando stop duplicado (debounce)`);return}S=e,x=!1,C=``,O(),w(v?`Vídeo parado.`:`O mestre parou o vídeo.`)}})};e.onReady(async()=>{console.log(`OWLbear SDK pronto!`),D();let t=await e.player.getRole();v=t===`GM`,v?(c.textContent=`👑 Você é o Mestre - Controles habilitados`,c.style.color=`#4CAF50`,i.disabled=!1,w(`Selecione um arquivo de vídeo.`)):(c.textContent=`👤 Você é um Jogador - Aguardando comandos do mestre`,c.style.color=`#FF9800`,i.disabled=!0,a.disabled=!0,w(`Aguardando o mestre iniciar o vídeo...`)),j(),console.log(`✅ Iniciado como: ${t}`)});