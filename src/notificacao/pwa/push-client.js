let token;
let usuarioId;
let chavePublica;
let registro;
let atualizacao;
const elemento = id => document.getElementById(id);

function informar(texto) { elemento("mensagem").textContent = texto; }

async function chamarApi(caminho, options = {}) {
    const response = await fetch(caminho, {
        ...options,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) sair();
        throw new Error(body.erro || "Não foi possível concluir a operação.");
    }
    return body;
}

function sair() {
    token = undefined;
    usuarioId = undefined;
    clearInterval(atualizacao);
    elemento("avisos").replaceChildren();
    elemento("central").hidden = true;
    elemento("login-form").hidden = false;
    informar("Entre para consultar seus avisos. Para parar os pushes, use Desativar neste dispositivo antes de sair.");
}

async function atualizarAvisos() {
    const filtro = elemento("filtro").value;
    const [avisos, contagem] = await Promise.all([
        chamarApi(`/notificacoes/usuario/${usuarioId}${filtro ? `?lida=${filtro}` : ""}`),
        chamarApi(`/notificacoes/usuario/${usuarioId}/nao-lidas/contagem`),
    ]);
    if (!token) return;
    elemento("contagem").textContent = `Seus avisos · ${contagem.total} não lidos`;
    elemento("avisos").replaceChildren();
    if (!avisos.length) {
        const vazio = document.createElement("p");
        vazio.textContent = "Nenhuma notificação para mostrar.";
        elemento("avisos").append(vazio);
    }
    for (const aviso of avisos) {
        const artigo = document.createElement("article");
        const titulo = document.createElement("h2");
        titulo.textContent = aviso.titulo;
        const mensagem = document.createElement("p");
        mensagem.textContent = aviso.mensagem;
        artigo.append(titulo, mensagem);
        if (aviso.lida_em) {
            const lida = document.createElement("span");
            lida.className = "lida";
            lida.textContent = "Lida";
            artigo.append(lida);
        } else {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = "Marcar como lida";
            botao.addEventListener("click", async () => {
                botao.disabled = true;
                try {
                    await chamarApi(`/notificacoes/usuario/${usuarioId}/${aviso.notf_id}/lida`, { method: "PATCH" });
                    await atualizarAvisos();
                } catch (erro) { informar(erro.message); botao.disabled = false; }
            });
            artigo.append(botao);
        }
        elemento("avisos").append(artigo);
    }
}

async function prepararPush() {
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        elemento("ativar").disabled = true;
        elemento("desativar").disabled = true;
        elemento("estado-push").textContent = "Este navegador precisa oferecer suporte a push e acessar o site por HTTPS para habilitar os avisos.";
        return;
    }
    await navigator.serviceWorker.register("/notificacoes/sw.js", { scope: "/notificacoes/" });
    registro = await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.getSubscription();
    elemento("estado-push").textContent = inscricao ? "Este navegador possui uma inscrição. Use Ativar para associá-la à sua conta." : "As notificações ainda não foram habilitadas neste navegador.";
}

function converterChave(chave) {
    const texto = chave.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(texto + "=".repeat((4 - texto.length % 4) % 4)), caracter => caracter.charCodeAt(0));
}

elemento("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const botao = event.submitter;
    botao.disabled = true;
    try {
        const resposta = await chamarApi("/login", {
            method: "POST", body: JSON.stringify({ login: elemento("login").value, senha: elemento("senha").value }),
        });
        token = resposta.token;
        elemento("senha").value = "";
        const configuracao = await chamarApi("/notificacoes/push/chave-publica");
        chavePublica = configuracao.chavePublica;
        usuarioId = configuracao.usuario_id;
        elemento("login-form").hidden = true;
        elemento("central").hidden = false;
        await atualizarAvisos();
        await prepararPush().catch(() => { elemento("estado-push").textContent = "Não foi possível preparar as notificações neste navegador. Você pode consultar os avisos abaixo."; });
        clearInterval(atualizacao);
        atualizacao = setInterval(() => atualizarAvisos().catch(erro => informar(erro.message)), 30000);
        informar("Acesso realizado.");
    } catch (erro) { token = undefined; informar(erro.message); }
    finally { botao.disabled = false; }
});

elemento("ativar").addEventListener("click", async () => {
    elemento("ativar").disabled = true;
    try {
        const permissao = await Notification.requestPermission();
        if (permissao !== "granted") throw new Error("O navegador não autorizou as notificações. Verifique as permissões do site.");
        if (!registro) throw new Error("Reabra a página por HTTPS para preparar as notificações.");
        const chave = converterChave(chavePublica);
        let inscricao = await registro.pushManager.getSubscription();
        if (inscricao && inscricao.options.applicationServerKey
            && String(new Uint8Array(inscricao.options.applicationServerKey)) !== String(chave)) {
            await inscricao.unsubscribe();
            inscricao = null;
        }
        if (!inscricao) inscricao = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave });
        const resposta = await chamarApi("/notificacoes/push/inscricao", { method: "POST", body: JSON.stringify(inscricao.toJSON()) });
        elemento("estado-push").textContent = resposta.mensagem;
        informar("Você receberá os avisos de conclusão das etapas neste dispositivo.");
    } catch (erro) { informar(erro.message); }
    finally { elemento("ativar").disabled = false; }
});

elemento("desativar").addEventListener("click", async () => {
    elemento("desativar").disabled = true;
    try {
        const inscricao = registro && await registro.pushManager.getSubscription();
        if (inscricao) {
            await chamarApi("/notificacoes/push/inscricao", { method: "DELETE", body: JSON.stringify(inscricao.toJSON()) });
            await inscricao.unsubscribe();
        }
        elemento("estado-push").textContent = "Notificações desativadas neste dispositivo.";
    } catch (erro) { informar(erro.message); }
    finally { elemento("desativar").disabled = false; }
});

elemento("atualizar").addEventListener("click", () => atualizarAvisos().catch(erro => informar(erro.message)));
elemento("filtro").addEventListener("change", () => atualizarAvisos().catch(erro => informar(erro.message)));
elemento("sair").addEventListener("click", sair);
