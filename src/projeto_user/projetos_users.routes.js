const express = require("express");
const projetosUsersController = require("./projetos_users.controller.js");
const authConfig = require("../auth/auth.config.js");
const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosUsersController.vincular);
router.get("/projeto/:projetoId", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosUsersController.listarPorProjeto);
router.get("/usuario/:usuarioId", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosUsersController.listarPorUsuario);
router.get("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosUsersController.buscarPorId);
router.delete("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosUsersController.desvincular);

module.exports = router;
