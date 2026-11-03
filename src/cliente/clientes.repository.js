const cliente = require("../../database/models/cliente.model.js");

async function listar() {
    return cliente.findAll({ order: [["nome", "ASC"]] });
}

async function cadastrar(dados) {
    return cliente.create(dados);
}

async function buscarPorId(id) {
    return cliente.findByPk(id);
}

async function buscarPorCpf(cpf) {
    return cliente.findOne({
        where: {cpf}
    });
}

async function editar(id, dados) {
    const clientefound = await cliente.findByPk(id);
    if(!clientefound) return null;
    return clientefound.update(dados);
}

async function contar() {
    return cliente.count();
}

module.exports = {
    listar,
    cadastrar,
    buscarPorId,
    buscarPorCpf,
    editar,
    contar
}