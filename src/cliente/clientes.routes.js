const express = require("express");
const router = express.Router();
const clientesController = require("../../src/cliente/clientes.controller.js");

router.get("/", clientesController.listar);
router.post("/", clientesController.cadastrar);
router.get("/:id", clientesController.buscarPorId);
router.get("/cpf/:cpf", clientesController.buscarPorCpf);
router.put("/:id", clientesController.editar);
router.get("/contar", clientesController.contar);

module.exports = router;