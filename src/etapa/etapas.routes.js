const express = require("express");
const controller = require("./etapas.controller");
const { requireJWTAuth, exigirAdministrativo } = require("../auth/auth.config");

const router = express.Router();

router.use(requireJWTAuth);
router.post("/", exigirAdministrativo, controller.cadastrar);
router.get("/", controller.listar);
router.get("/projeto/aberto/:projetoId", controller.listarProjetoAberto);
router.get("/projeto/:projetoId", controller.listarPorProjeto);
router.get("/execucao/aberta/:id", controller.buscarExecAberta);
router.get("/:id/tempo", controller.consultarTempo);
router.post("/:id/iniciar", controller.iniciarEtapa);
router.post("/:id/pausar", controller.pausarEtapa);
router.post("/:id/retomar", controller.retomarEtapa);
router.post("/:id/concluir", controller.concluirEtapa);
router.put("/planejamento/:id", exigirAdministrativo, controller.criarPlanejamento);
router.put("/:id", exigirAdministrativo, controller.editar);
router.get("/:id", controller.buscarPorId);

module.exports = router;
