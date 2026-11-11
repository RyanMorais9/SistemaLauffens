
const express = require("express");
const router = express.Router();

const etapasController = require("./etapas.controller");

// Cadastrar etapa
router.post("/", etapasController.cadastrar);

// Listar etapas de um projeto
router.get("/projeto/:projetoId", etapasController.listarPorProjeto);

// Buscar etapa por ID
router.get("/:id", etapasController.buscarPorId);

// Editar planejamento
router.put("/:id", etapasController.atualizar);

// Iniciar execução
router.patch("/:id/iniciar", etapasController.iniciar);

// Pausar execução
router.patch("/:id/pausar", etapasController.pausar);

// Retomar execução
router.patch("/:id/retomar", etapasController.retomar);

// Concluir etapa
router.patch("/:id/concluir", etapasController.concluir);

module.exports = router;
