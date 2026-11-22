self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
    const aviso = event.data ? event.data.json() : {};
    event.waitUntil(self.registration.showNotification(aviso.titulo || "Lauffens", {
        body: aviso.mensagem || "Você recebeu uma nova notificação",
        icon: new URL("lauffens-logo.jpeg", self.registration.scope).href,
        tag: `notificacao-${aviso.notf_id || "aviso"}`
    }));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const destino = new URL("?tela=notificacoes", self.registration.scope).href;
    event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async abas => {
        const aba = abas.find(item => item.url.startsWith(self.registration.scope));
        if (aba) {
            aba.postMessage({ tipo: "abrir-notificacoes" });
            return aba.focus();
        }
        return self.clients.openWindow(destino);
    }));
});
