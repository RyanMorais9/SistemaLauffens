const clientesService = require("../../src/cliente/clientes.service.js");

async function listar(req, res) {
    try {
        const result = await clientesService.listar();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(404).json({ erro: "Não foi possivel listar clientes" });
    }
}

async function cadastrar(req, res) {
    try {
        const { nome, cpf, telefone } = req.body;
        const result = await clientesService.cadastrar({ nome, cpf, telefone });
        return res.status(201).json(result);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ erro: "Ja existe um cliente cadastrado com esse CPF" });
        }
        if (erro.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({ erro: "Verifique os dados informados para o cadastro" });
        }
        return res.status(500).json({ erro: "Não é possível cadastrar o cliente" })
    }
}

async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 0) {
            return res.status(400).json({ erro: "ID inválido" });
        }
        const result = await clientesService.buscarPorId(id);
        if (!result) {
            return res.status(404).json({ erro: "Cliente não encontrado" });
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ erro: "Não foi possível buscar o cliente." })
    }
}

async function buscarPorCpf(req, res) {
    try {
        const cpf = req.params.cpf;
        if (!/^\d{11}$/.test(cpf)) { /* o texto vai conter nomaximo 11 caracteres e aceita numeros de 0 a 9 */
            return res.status(400).json({
                erro: "O CPF deve conter exatamente 11 dígitos, sem pontos ou traço."
            });
        }
        const result = await clientesService.buscarPorCpf(cpf);
        if (!result) {
            return res.status(404).json({ erro: "Cliente não encontrado" });
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ erro: "Não foi possível buscar o cliente." })
    }
}

async function editar(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 0) {
            return res.status(400).json({ erro: "Id invalido" });
        }
        const { nome, cpf, telefone } = req.body || {};
        const result = await clientesService.editar(id, { nome, cpf, telefone });
        if (!result) {
            return res.status(404).json({erro: "Nome não registrado"})
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status().json({erro: "Ocorreu uma falha inesperada"});
    }
}

async function contar(req, res) {
    try {

    } catch (error) {

    }
}

module.exports = {
    listar,
    cadastrar,
    buscarPorId,
    buscarPorCpf,
    editar,
    contar
}