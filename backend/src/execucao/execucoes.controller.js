const execucoesService = require("./execucoes.service");

function responderErro(erro, res) {
    if (res.headersSent) return;
    const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 600
        ? erro.status : 500;
    if (status >= 500) console.error(erro);
    return res.status(status).json({
        erro: status >= 500 ? "Ocorreu um erro interno no servidor." : erro.message,
    });
}

async function listarPorEtapa(req, res) {
    try {
        const execucoes = await execucoesService.listarPorEtapa(req.params.etapaId);
        return res.status(200).json(execucoes);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function buscarPorId(req, res) {
    try {
        const execucao = await execucoesService.buscarPorId(req.params.id);
        return res.status(200).json(execucao);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function buscarAbertaPorEtapa(req, res) {
    try {
        const execucao = await execucoesService.buscarAbertaPorEtapa(
            req.params.etapaId
        );
        return res.status(200).json(execucao);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = {
    listarPorEtapa,
    buscarPorId,
    buscarAbertaPorEtapa,
};
