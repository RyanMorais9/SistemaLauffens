const webpush = require("web-push");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const repository = require("./notificacoes.repository.js");
const atrasos = require("./notificacoes.atrasos.js");

let chaves;
let processamento;
let intervalo;

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function configurar() {
    if (chaves) return chaves;
    const publica = process.env.VAPID_PUBLIC_KEY;
    const privada = process.env.VAPID_PRIVATE_KEY;
    if (Boolean(publica) !== Boolean(privada)) throw new Error("Informe as duas chaves VAPID.");
    let configuracao;
    if (publica && privada) configuracao = { publicKey: publica, privateKey: privada };
    else {
        const arquivo = path.join(__dirname, "../../.push-keys.json");
        try { configuracao = JSON.parse(fs.readFileSync(arquivo, "utf8")); }
        catch (erro) {
            if (erro.code !== "ENOENT") throw erro;
            try {
                fs.writeFileSync(arquivo, JSON.stringify(webpush.generateVAPIDKeys()), { mode: 0o600, flag: "wx" });
            } catch (erroGravacao) {
                if (erroGravacao.code !== "EEXIST") throw erroGravacao;
            }
            configuracao = JSON.parse(fs.readFileSync(arquivo, "utf8"));
        }
    }
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://github.com/RyanMorais9/SistemaLauffens", configuracao.publicKey, configuracao.privateKey);
    chaves = configuracao;
    return chaves;
}

function obterChavePublica() {
    return configurar().publicKey;
}

function validarInscricao(dados) {
    if (typeof dados === "string") {
        try { dados = JSON.parse(dados); }
        catch { erroDeValidacao("Inscrição push inválida."); }
    }
    if (!dados || typeof dados !== "object" || Array.isArray(dados)
        || typeof dados.endpoint !== "string" || dados.endpoint.length > 2048 || !dados.keys) {
        erroDeValidacao("Inscrição push inválida.");
    }
    let url;
    try { url = new URL(dados.endpoint); }
    catch { erroDeValidacao("Endereço de push inválido."); }
    const hosts = ["fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com", "push.services.mozilla.com", "web.push.apple.com"];
    const permitido = hosts.includes(url.hostname) || url.hostname.endsWith(".push.apple.com") || url.hostname.endsWith(".notify.windows.com");
    if (url.protocol !== "https:" || !permitido || url.username || url.password || url.port || url.hash) {
        erroDeValidacao("Use uma inscrição HTTPS de um serviço de push de navegador compatível.");
    }
    const { p256dh, auth } = dados.keys;
    if (typeof p256dh !== "string" || typeof auth !== "string"
        || !/^[\w-]{87}=?$/.test(p256dh) || !/^[\w-]{22}={0,2}$/.test(auth)) {
        erroDeValidacao("Chaves da inscrição push inválidas.");
    }
    try {
        const chave = Buffer.from(p256dh, "base64url");
        if (chave.length !== 65 || chave[0] !== 4 || Buffer.from(auth, "base64url").length !== 16) throw new Error();
        crypto.ECDH.convertKey(chave, "prime256v1");
    } catch { erroDeValidacao("Chaves da inscrição push inválidas."); }
    return { endpoint: url.href, keys: { p256dh, auth } };
}

function processarPendentes() {
    if (processamento) return processamento;
    processamento = enviarPendentes().finally(() => { processamento = undefined; });
    return processamento;
}

async function enviarPendentes() {
    configurar();
    await repository.processarFila(async transaction => {
        const notificacoes = await repository.listarPushPendentes(transaction);
        await Promise.all(notificacoes.map(async notificacao => {
            const token = notificacao.usuario.push_token;
            try {
                const inscricao = validarInscricao(token);
                await webpush.sendNotification(inscricao, JSON.stringify({
                    notf_id: notificacao.notf_id,
                    titulo: notificacao.titulo,
                    mensagem: notificacao.mensagem,
                }), { TTL: 86400, urgency: "high", timeout: 5000, topic: `notificacao${notificacao.notf_id}` });
                await repository.registrarResultadoPush(notificacao.notf_id, "Enviada", new Date(), transaction);
            } catch (erro) {
                if (erro.status === 400 || erro.statusCode === 404 || erro.statusCode === 410) {
                    await repository.limparInscricaoExpirada(notificacao.usuario.usuario_id, token, transaction);
                }
                await repository.registrarResultadoPush(notificacao.notf_id, "Falhou", null, transaction);
            }
        }));
    });
}

function iniciarProcessamento() {
    if (intervalo) return;
    let verificando = false;
    const executar = async () => {
        if (verificando) return;
        verificando = true;
        try {
            await atrasos.verificarAtrasos();
        } catch {
            console.error("Não foi possível verificar os atrasos de produção.");
        }
        try {
            await processarPendentes();
        } catch {
            console.error("Não foi possível processar a fila de notificações push.");
        } finally {
            verificando = false;
        }
    };
    executar();
    intervalo = setInterval(executar, 30000);
    intervalo.unref();
}

function pararProcessamento() {
    clearInterval(intervalo);
    intervalo = undefined;
}

module.exports = { obterChavePublica, validarInscricao, processarPendentes, iniciarProcessamento, pararProcessamento };
