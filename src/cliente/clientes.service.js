const clientesRepository = require("../../src/cliente/clientes.repository.js");

async function listar() {
    return clientesRepository.listar();
}

async function cadastrar(dados) {
    return clientesRepository.cadastrar(dados);
}

async function buscarPorId(id) {
    return clientesRepository.buscarPorId(id);
}

async function buscarPorCpf(cpf) {
    return clientesRepository.buscarPorCpf(cpf);
}

async function editar(id, dados) {
    return clientesRepository.editar(id, dados);
}

async function contar() {
    return clientesRepository.contar();
}

module.exports = {
    listar,
    cadastrar,
    buscarPorId,
    buscarPorCpf,
    editar,
    contar
}