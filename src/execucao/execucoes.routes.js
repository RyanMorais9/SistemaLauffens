const express = require("express");
const controller = require("./execucoes.controller");

const router = express.Router();

router.get("/etapa/:etapaId/aberta", controller.buscarAbertaPorEtapa);
router.get("/etapa/:etapaId", controller.listarPorEtapa);
router.get("/:id", controller.buscarPorId);

module.exports = router;