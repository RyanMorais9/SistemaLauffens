const express = require("express");
const router = express.Router();
const clientesController = require("../../src/cliente/clientes.controller.js");
const authConfig = require("../auth/auth.config.js");


router.get("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.listar);
router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.cadastrar);
router.get("/contar", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.contar);
router.get("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.buscarPorId);
router.get("/cpf/:cpf", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.buscarPorCpf);
router.put("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, clientesController.editar);

module.exports = router;
