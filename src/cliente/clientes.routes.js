const express = require("express");
const controller = require("./clientes.controller");

const router = express.Router();

router.post("/", controller.cadastrar.bind(controller));
router.get("/", controller.listar.bind(controller));
router.get("/contagem", controller.contar.bind(controller));
router.get("/cpf/:cpf", controller.buscarPorCpf.bind(controller));
router.get("/:id/projetos", controller.buscarProjetos.bind(controller));
router.get("/:id", controller.buscarPorId.bind(controller));
router.put("/:id", controller.atualizar.bind(controller));
router.patch("/:id", controller.atualizar.bind(controller));

module.exports = router;
