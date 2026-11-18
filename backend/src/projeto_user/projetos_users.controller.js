const projUserService = require("../../src/projeto_user/projetos_users.service.js");

async function vincularFuncionario(req, res) {
    try {
        const dados = req.body;
        const vincular = await projUserService.vincularFuncionario(dados);
        return res.status(201).json(vincular);
    } catch (erro) {
        const status = erro.status || 500;
        if (erro.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ erro: "Marceneiro ja vinculado" });
        }
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }


}

async function listarParticipantes(req, res) {
    try {
        const projetoId = Number(req.params.projetoId)
        const listarParticipantes = await projUserService.listarParticipantes(projetoId);
        return res.status(200).json(listarParticipantes);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function listarParticipacaoUser(req, res) {
    try {
        const usuarioId = Number(req.params.usuarioId)
        const listarParticipacoes = await projUserService.listarParticipacaoUser(usuarioId);
        return res.status(200).json(listarParticipacoes);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
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
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

module.exports = {
    vincularFuncionario,
    listarParticipantes,
    listarParticipacaoUser,
    buscarVinculo
}
