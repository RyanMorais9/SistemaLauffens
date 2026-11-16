self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(chaves => Promise.all(
        chaves.filter(chave => chave.startsWith("lauffens-notificacoes-"))
            .map(chave => caches.delete(chave))
    )).then(() => self.clients.claim()));
});

self.addEventListener("push", event => {
    const aviso = event.data.json();
    event.waitUntil(self.registration.showNotification(aviso.titulo, {
        body: aviso.mensagem,
        icon: "/notificacoes/lauffens-logo.jpeg",
        tag: `notificacao-${aviso.notf_id}`,
    }));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async abas => {
        const aba = abas.find(item => new URL(item.url).origin === self.location.origin);
        if (aba) return aba.focus();
    }));
});
