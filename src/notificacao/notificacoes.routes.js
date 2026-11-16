const express = require("express");
const controller = require("./notificacoes.controller");
const authConfig = require("../auth/auth.config.js");

const router = express.Router();

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
    exigirDestinatario,
    controller.contarNaoLidas.bind(controller)
);
router.get("/usuario/:usuarioId", authConfig.requireJWTAuth, exigirDestinatario, controller.listarPorUsuario.bind(controller));
router.patch(
    "/usuario/:usuarioId/:notificacaoId/lida",
    authConfig.requireJWTAuth,
    exigirDestinatario,
    controller.marcarComoLida.bind(controller)
);

// O controller do PR usa next(erro); o tratamento fica restrito a este módulo.
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
