const projetoService = require("./projetos.service");

function responderErro(erro, res) {
    if (erro.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ erro: "O cliente ou usuário informado não pode ser usado." });
    }
    if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Já existe um registro com esses dados." });
    }
    if (erro.name === "SequelizeValidationError") {
        return res.status(400).json({ erro: "Dados inválidos.", detalhes: erro.errors.map(item => item.message) });
    }
    const status = erro.status || 500;
    if (status >= 500) console.error(erro);
    return res.status(status).json({ erro: status >= 500 ? "Erro interno no servidor" : erro.message });
}

async function cadastrar(req, res) {
    try {
        const dados = req.body;
        const criadoPorId = req.user.usuario_id;
        const novoProjeto = await projetoService.cadastrar(dados, criadoPorId);
        return res.status(201).json(novoProjeto);
    } catch (erro) {
        return responderErro(erro, res);
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
        return responderErro(erro, res);
    }
}

async function listar(req, res) {
    try {
        const filtros = req.query;
        const result = await projetoService.listar(filtros);
        return res.status(200).json(result);
    } catch (erro) {
        return responderErro(erro, res);
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
        return responderErro(erro, res);
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
        return responderErro(erro, res);
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
        return responderErro(erro, res);
    }
}

module.exports = {
    cadastrar,
    buscarPorId,
    listar,
    editar,
    registrarVB,
    gerenciarStatus
};
