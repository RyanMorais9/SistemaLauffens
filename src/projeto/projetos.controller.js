const projetoService = require("./projetos.service");

async function cadastrar(req, res) {
    try {
        const dados = req.body;
        const criadoPorId = req.user.usuario_id;
        const novoProjeto = await projetoService.cadastrar(dados, criadoPorId);
        return res.status(201).json(novoProjeto);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const result = await projetoService.buscarPorId(id);
        if (!result) {
            return res.status(404).json({ erro: "Projeto não encontrado" });
        }
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function listar(req, res) {
    try {
        const filtros = {
            status: req.query.status,
            porte: req.query.porte
        }
        const result = await projetoService.listar(filtros);
        return res.status(200).json(result);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function editar(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const dados = req.body;
        const projetoEditado = await projetoService.editar(id, dados);
        if (!projetoEditado) return res.status(404).json({ erro: "Projeto não encontrado" });
        return res.status(200).json(projetoEditado);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function registrarVB(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const valorBase = req.body.valor_base;
        const valorRegistrado = await projetoService.registrarVB(id, valorBase);
        if(!valorRegistrado) return res.status(404).json({ erro: "Projeto não encontrado" });
        return res.status(200).json(valorRegistrado);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function gerenciarStatus(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const novoStatus = req.body.status;
        const statusAtualizado = await projetoService.gerenciarStatus(id, novoStatus);
        if(!statusAtualizado) return res.status(404).json({erro: "Projeto não encontrado"});
        return res.status(200).json(statusAtualizado);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function registrarInicio(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const dataHorario = req.body.data_inicio;
        const inicioRegistrado = await projetoService.registrarInicio(id, dataHorario);
        if(!inicioRegistrado) return res.status(404).json({erro: "Projeto não encontrado"});
        return res.status(200).json(inicioRegistrado);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function finalizar(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

module.exports = {
    cadastrar,
    buscarPorId,
    listar,
    editar,
    registrarVB,
    gerenciarStatus,
    registrarInicio,
    finalizar
};
