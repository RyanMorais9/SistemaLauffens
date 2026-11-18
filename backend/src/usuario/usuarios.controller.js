const usuarioService = require("./usuarios.service.js");

async function cadastrar(req, res) {
    try {
        const dados = req.body;
        const novoUsuario = await usuarioService.cadastrar(dados);
        return res.status(201).json(novoUsuario);
    } catch (erro) {
        const status = erro.status || 500;
        if (erro.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ erro: "CPF ou login já cadastrado" });
        }
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function listar(req, res) {
    try {
        const listarUsuarios = await usuarioService.listar();
        return res.status(200).json(listarUsuarios);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);
        const result = await usuarioService.buscarPorId(id);
        if (!result) {
            return res.status(404).json({ erro: "Usuario não encontrado" })
        };
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
        const editarUser = await usuarioService.editar(id, dados);
        if (!editarUser) {
            return res.status(404).json({ erro: "Usuario não encontrado" })
        }
        return res.status(200).json(editarUser);
    } catch (erro) {
        const status = erro.status || 500;
        if (erro.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ erro: "CPF ou login já cadastrado" });
        }
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function atualizarRemuneracao(req, res) {
    try {
        const id = Number(req.params.id);
        const salario = req.body.salario;
        const horasMensais = req.body.horas_mensais;
        const atualizado = await usuarioService.atualizarRemuneracao(id, salario, horasMensais);
        if (!atualizado) {
            return res.status(404).json({ erro: "Usuario não encontrado" })
        }
        return res.status(200).json(atualizado);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function gravarPushToken(req, res) {
    try {
        const id = req.user.usuario_id;
        const token = req.body.push_token;
        const pushToken = await usuarioService.gravarPushToken(id, token);
        if (!pushToken) {
            return res.status(404).json({ erro: "Usuario não encontrado" })
        }
        return res.status(200).json(pushToken);
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message });
    }
}

async function desativar(req, res) {
    try {
        const id = Number(req.params.id);
        const idUsuarioAutenticado = req.user.usuario_id;
        const desativado = await usuarioService.desativar(id, idUsuarioAutenticado);
        if (!desativado) {
            return res.status(404).json({ erro: "Usuario não encontrado" });
        }
        return res.status(200).json(desativado);
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
    atualizarRemuneracao,
    gravarPushToken,
    desativar
};
