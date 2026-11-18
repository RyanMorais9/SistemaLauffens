const express = require("express");
const manutencaoController = require("./manutencoes.controller");
const authConfig = require("../auth/auth.config.js");
const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, manutencaoController.cadastrar);
router.get("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, manutencaoController.listar);
router.get("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, manutencaoController.buscarPorId);
router.patch("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, manutencaoController.editar);
router.put("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, manutencaoController.resolver);

module.exports = router;

