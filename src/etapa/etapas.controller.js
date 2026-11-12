const etapaService = require("./etapas.service");

function responderErro(error, res) {
    if (res.headersSent) {
        return;
    }

    if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Já existe uma etapa desse tipo neste projeto." });
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ erro: "O projeto informado não pode ser usado." });
    }
    if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
            erro: "Dados inválidos.",
            detalhes: error.errors.map((item) => item.message),
        });
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) {
        console.error(error);
        return res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
    }
    return res.status(status).json({ erro: error.message });
}

function executar(acao, statusSucesso = 200) {
    return async (req, res) => {
        try {
            const resultado = await acao(req);
            return res.status(statusSucesso).json(resultado);
        } catch (error) {
            return responderErro(error, res);
        }
    };
}

const cadastrar = executar((req) => etapaService.cadastrar(req.body), 201);
const listar = executar((req) => etapaService.listar());
const buscarPorId = executar((req) => etapaService.buscarPorId(req.params.id));
const listarPorProjeto = executar((req) =>
    etapaService.listarPorProjeto(req.params.projetoId)
);
const listarProjetoAberto = executar((req) =>
    etapaService.listarProjetoAberto(req.params.projetoId)
);
const buscarExecAberta = executar((req) => etapaService.buscarExecAberta(req.params.id));
const editar = executar((req) =>
    etapaService.editarPlanejamento(req.params.id, req.body)
);
const criarPlanejamento = editar;
const iniciarEtapa = executar((req) => etapaService.iniciarEtapa(req.params.id));
const pausarEtapa = executar((req) => etapaService.pausarEtapa(req.params.id));
const retomarEtapa = executar((req) => etapaService.retomarEtapa(req.params.id));
const concluirEtapa = executar((req) => etapaService.concluirEtapa(req.params.id));
const consultarTempo = executar((req) => etapaService.consultarTempo(req.params.id));

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    listarPorProjeto,
    listarProjetoAberto,
    buscarExecAberta,
    editar,
    criarPlanejamento,
    iniciarEtapa,
    pausarEtapa,
    retomarEtapa,
    concluirEtapa,
    consultarTempo,
};
