const manutencaoService = require("./manutencoes.service.js");

async function cadastrar(req, res) {
    try {
        const dados = req.body;
        const result = await manutencaoService.cadastrar(dados);
        return res.status(201).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function listar(req, res) {
    try {
        const filtros = {...req.query};
        if (filtros.proj_id !== undefined) {
            filtros.proj_id = Number(filtros.proj_id);
        }
        const result = await manutencaoService.listar(filtros);
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);
        const result = await manutencaoService.buscarPorId(id);
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function editar(req, res) {
    try {
        const id = Number(req.params.id);
        const dados = req.body;
        const result = await manutencaoService.editar(id, dados);
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function resolver(req, res) {
    try {
        const id = Number(req.params.id);
        const dados = req.body;
        const result = await manutencaoService.resolver(id, dados);
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    editar,
    resolver
}
