const express = require("express");
const controller = require("./notificacoes.controller");
const authConfig = require("../auth/auth.config.js");
const path = require("node:path");

const router = express.Router();

const pastaPwa = path.join(__dirname, "pwa");
router.get("/ativar", (req, res) => res.sendFile(path.join(pastaPwa, "notificacoes.html")));
router.get("/push-client.js", (req, res) => res.sendFile(path.join(pastaPwa, "push-client.js")));
router.get("/manifest.webmanifest", (req, res) => res.sendFile(path.join(pastaPwa, "manifest.webmanifest")));
router.get("/lauffens-logo.jpeg", (req, res) => res.sendFile(path.join(pastaPwa, "lauffens-logo.jpeg")));
router.get("/sw.js", (req, res) => {
    res.set("Cache-Control", "no-cache");
    return res.sendFile(path.join(pastaPwa, "sw.js"));
});

router.get("/push/chave-publica", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.obterChavePublica.bind(controller));
router.post("/push/inscricao", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.cadastrarInscricao.bind(controller));
router.delete("/push/inscricao", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.removerInscricao.bind(controller));

function exigirDestinatario(req, res, next) {
    const usuarioId = Number(req.params.usuarioId);
    if (!Number.isSafeInteger(usuarioId) || usuarioId < 1) {
        return res.status(400).json({ erro: "usuarioId deve ser um inteiro positivo." });
    }
    if (usuarioId !== req.user.usuario_id) {
        return res.status(403).json({ erro: "Você só pode acessar suas próprias notificações." });
    }
    next();
}

router.get(
    "/usuario/:usuarioId/nao-lidas/contagem",
    authConfig.requireJWTAuth,
    authConfig.exigirAdministrativo,
    exigirDestinatario,
    controller.contarNaoLidas.bind(controller)
);
router.get("/usuario/:usuarioId", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, exigirDestinatario, controller.listarPorUsuario.bind(controller));
router.patch(
    "/usuario/:usuarioId/:notificacaoId/lida",
    authConfig.requireJWTAuth,
    authConfig.exigirAdministrativo,
    exigirDestinatario,
    controller.marcarComoLida.bind(controller)
);

router.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);
    const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 600
        ? erro.status : 500;
    if (status >= 500) console.error(erro);
    return res.status(status).json({
        erro: status >= 500 ? "Erro interno no servidor" : erro.message,
    });
});

module.exports = router;
