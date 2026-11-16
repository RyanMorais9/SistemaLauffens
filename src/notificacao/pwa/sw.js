const CACHE = "lauffens-notificacoes-v2";
const ARQUIVOS = ["/notificacoes/ativar", "/notificacoes/push-client.js", "/notificacoes/manifest.webmanifest", "/notificacoes/lauffens-logo.jpeg"];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(chave => chave.startsWith("lauffens-notificacoes-") && chave !== CACHE).map(chave => caches.delete(chave)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);
    if (event.request.method !== "GET" || url.origin !== self.location.origin || !ARQUIVOS.includes(url.pathname)) return;
    event.respondWith(fetch(event.request).catch(() => caches.match(url.pathname)));
});

self.addEventListener("push", event => {
    const aviso = event.data.json();
    event.waitUntil(self.registration.showNotification(aviso.titulo, {
        body: aviso.mensagem,
        icon: "/notificacoes/lauffens-logo.jpeg",
        tag: `notificacao-${aviso.notf_id}`,
        data: { url: "/notificacoes/ativar" },
    }));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async abas => {
        const url = new URL("/notificacoes/ativar", self.location.origin).href;
        const aba = abas.find(item => item.url === url);
        if (aba) return aba.focus();
        return self.clients.openWindow(url);
    }));
});
