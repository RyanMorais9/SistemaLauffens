const express = require("express");
const controller = require("./etapas.controller");
const authConfig = require("../auth/auth.config.js");

const router = express.Router();

router.post("/", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.cadastrar);
router.get("/", authConfig.requireJWTAuth, controller.listar);
router.get("/projeto/aberto/:projetoId", authConfig.requireJWTAuth, controller.listarProjetoAberto);
router.get("/projeto/:projetoId", authConfig.requireJWTAuth, controller.listarPorProjeto);
router.get("/execucao/aberta/:id", authConfig.requireJWTAuth, controller.buscarExecAberta);
router.get("/:id/tempo", authConfig.requireJWTAuth, controller.consultarTempo);
router.post("/:id/iniciar", authConfig.requireJWTAuth, controller.iniciarEtapa);
router.post("/:id/pausar", authConfig.requireJWTAuth, controller.pausarEtapa);
router.post("/:id/retomar", authConfig.requireJWTAuth, controller.retomarEtapa);
router.post("/:id/concluir", authConfig.requireJWTAuth, controller.concluirEtapa);
router.put("/planejamento/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.criarPlanejamento);
router.put("/:id", authConfig.requireJWTAuth, authConfig.exigirAdministrativo, controller.editar);
router.get("/:id", authConfig.requireJWTAuth, controller.buscarPorId);

module.exports = router;
