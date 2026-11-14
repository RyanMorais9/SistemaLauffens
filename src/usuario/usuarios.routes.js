const express = require("express")
const usuarioController = require("./usuarios.controller.js");
const authConfig = require("../auth/auth.config.js");
const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.cadastrar);
router.get("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.listar);
router.get("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.buscarPorId);
router.patch("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.editar);
router.put("/:id/remuneracao", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.atualizarRemuneracao);
router.put("/me/push-token", authConfig.requireJWTAuth, usuarioController.gravarPushToken);
router.put("/:id/desativar", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, usuarioController.desativar);

module.exports = router;