const express = require("express");

const controller = require("./etapas.controller");

const router = express.Router();

router.get("/", controller.listar);

router.get("/:id", controller.buscarPorId);

router.get("/projeto/:projetoId", controller.listarPorProjeto);

module.exports = router;