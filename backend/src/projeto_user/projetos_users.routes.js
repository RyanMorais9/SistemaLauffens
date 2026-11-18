const express = require("express");
const projUserController = require("../../src/projeto_user/projetos_users.controller.js");
const authConfig = require("../auth/auth.config.js");
const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projUserController.vincularFuncionario);
router.get("/projeto/:projetoId", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projUserController.listarParticipantes);
router.get("/usuario/:usuarioId", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projUserController.listarParticipacaoUser);
router.get("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projUserController.buscarVinculo);

module.exports = router;
