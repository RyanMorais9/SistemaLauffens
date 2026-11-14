const express = require("express");
const projetosController = require("./projetos.controller.js");
const authConfig = require("../auth/auth.config.js");
const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosController.cadastrar);
router.get("/:id", authConfig.requireJWTAuth, projetosController.buscarPorId);
router.get("/", authConfig.requireJWTAuth, projetosController.listar);
router.patch("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosController.editar);
router.post("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosController.registrarVB);
router.put("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, projetosController.gerenciarStatus);

module.exports = router;
