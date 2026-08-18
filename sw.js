// Service worker do QR Diaristas KN.
// Estratégia: para a página em si (navegação/HTML), sempre tenta buscar a versão mais nova
// direto da rede primeiro — só usa uma cópia guardada se estiver sem internet. Isso evita o
// problema de alguém ficar preso numa versão antiga do app.
//
// IMPORTANTE: sempre que fizer uma alteração no index.html e quiser garantir que todo mundo
// pegue a versão nova o quanto antes, aumente o número da CACHE_VERSION abaixo (ex: 'v2' -> 'v3').
// Isso força a limpeza da cópia antiga guardada no aparelho de cada pessoa.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `qr-diaristas-${CACHE_VERSION}`;

// Assim que o novo service worker termina de instalar, ele já assume o controle na hora,
// sem esperar todas as abas/instâncias do app fecharem primeiro.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ao ativar, apaga qualquer cache de uma versão anterior e passa a controlar as páginas
// abertas imediatamente (sem precisar de um segundo carregamento).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegação de página (abrir/recarregar o app): rede primeiro, cache só como reserva
  // se estiver offline. Garante que quem tem internet sempre vê a versão mais recente.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Outros arquivos (ícones, etc.): tenta a rede primeiro; se falhar (sem internet),
  // usa a cópia guardada.
  event.respondWith(
    fetch(req)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
