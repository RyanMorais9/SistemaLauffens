const projetosUsersService = require("./projetos_users.service.js");

function responderErro(erro, res) {
    if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Este funcionário já está vinculado ao projeto." });
    }
    if (erro.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ erro: "O projeto ou usuário informado não pode ser usado." });
    }
    if (erro.name === "SequelizeValidationError") {
        return res.status(400).json({ erro: "Dados inválidos.", detalhes: erro.errors.map(item => item.message) });
    }
    const status = erro.status || 500;
    if (status >= 500) console.error(erro);
    return res.status(status).json({ erro: status >= 500 ? "Erro interno no servidor" : erro.message });
}

async function vincular(req, res) {
    try {
        const resultado = await projetosUsersService.vincular(req.body);
        return res.status(201).json(resultado);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function buscarPorId(req, res) {
    try {
        const resultado = await projetosUsersService.buscarPorId(req.params.id);
        if (!resultado) return res.status(404).json({ erro: "Vínculo não encontrado" });
        return res.status(200).json(resultado);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function listarPorProjeto(req, res) {
    try {
        const resultado = await projetosUsersService.listarPorProjeto(req.params.projetoId);
        if (!resultado) return res.status(404).json({ erro: "Projeto não encontrado" });
        return res.status(200).json(resultado);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function listarPorUsuario(req, res) {
    try {
        const resultado = await projetosUsersService.listarPorUsuario(req.params.usuarioId);
        if (!resultado) return res.status(404).json({ erro: "Usuário não encontrado" });
        return res.status(200).json(resultado);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

async function desvincular(req, res) {
    try {
        const resultado = await projetosUsersService.desvincular(req.params.id);
        if (!resultado) return res.status(404).json({ erro: "Vínculo não encontrado" });
        return res.status(200).json({ mensagem: "Funcionário desvinculado do projeto." });
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { vincular, buscarPorId, listarPorProjeto, listarPorUsuario, desvincular };
