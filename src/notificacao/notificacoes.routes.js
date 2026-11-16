const express = require("express");
const controller = require("./notificacoes.controller");

const router = express.Router();

router.get(
    "/usuario/:usuarioId/nao-lidas/contagem",
    controller.contarNaoLidas.bind(controller)
);
router.get("/usuario/:usuarioId", controller.listarPorUsuario.bind(controller));
router.patch(
    "/usuario/:usuarioId/:notificacaoId/lida",
    controller.marcarComoLida.bind(controller)
);

module.exports = router;