const projUserService = require("../../src/projeto_user/projetos_users.service.js");

function responderErro(erro, res) {
    if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Marceneiro ja vinculado" });
    }
    if (erro.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ erro: "Projeto ou funcionário inválido." });
    }
    if (erro.name === "SequelizeValidationError") {
        return res.status(400).json({ erro: "Dados inválidos.", detalhes: erro.errors?.map(item => item.message) });
    }
    const status = erro.status || 500;
    if (status >= 500) console.error(erro);
    return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
}

async function vincularFuncionario(req, res) {
    try {
        const dados = req.body;
        const vincular = await projUserService.vincularFuncionario(dados);
        return res.status(201).json(vincular);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function listarParticipantes(req, res) {
    try {
        const projetoId = Number(req.params.projetoId)
        const listarParticipantes = await projUserService.listarParticipantes(projetoId);
        return res.status(200).json(listarParticipantes);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function listarParticipacaoUser(req, res) {
    try {
        const usuarioId = Number(req.params.usuarioId)
        const listarParticipacoes = await projUserService.listarParticipacaoUser(usuarioId);
        return res.status(200).json(listarParticipacoes);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function buscarVinculo(req, res) {
    try {
        const id = Number(req.params.id);
        const result = await projUserService.buscarVinculo(id);
        if (!result) {
            return res.status(404).json({ erro: "Vinculo não encontrado" })
        }
        return res.status(200).json(result);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = {
    vincularFuncionario,
    listarParticipantes,
    listarParticipacaoUser,
    buscarVinculo
}
