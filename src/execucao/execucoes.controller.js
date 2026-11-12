const execucoesService = require("./execucoes.service");

async function listarPorEtapa(req, res, next) {
    try {
        const execucoes = await execucoesService.listarPorEtapa(req.params.etapaId);
        return res.status(200).json(execucoes);
    } catch (erro) {
        return next(erro);
    }
}

async function buscarPorId(req, res, next) {
    try {
        const execucao = await execucoesService.buscarPorId(req.params.id);
        return res.status(200).json(execucao);
    } catch (erro) {
        return next(erro);
    }
}

async function buscarAbertaPorEtapa(req, res, next) {
    try {
        const execucao = await execucoesService.buscarAbertaPorEtapa(
            req.params.etapaId
        );
        return res.status(200).json(execucao);
    } catch (erro) {
        return next(erro);
    }
}

module.exports = {
    listarPorEtapa,
    buscarPorId,
    buscarAbertaPorEtapa,
};