const express = require("express");
const controller = require("./execucoes.controller");
const authConfig = require("../auth/auth.config.js");

const router = express.Router();

router.get("/etapa/:etapaId/aberta", authConfig.requireJWTAuth, controller.buscarAbertaPorEtapa);
router.get("/etapa/:etapaId", authConfig.requireJWTAuth, controller.listarPorEtapa);
router.get("/:id", authConfig.requireJWTAuth, controller.buscarPorId);

module.exports = router;
