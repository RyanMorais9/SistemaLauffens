const usuario = require("../../database/models/usuario.model.js");

async function cadastrar(dados) {
    return usuario.create(dados);    
}

async function listar() {
    return usuario.findAll();
}

async function buscarPorId(id) {
    return usuario.findByPk(id);
}

async function atualizarRemuneracao(id, salario, horasMensais) {
    const usuarioFound = await usuario.findByPk(id);
    if(!usuarioFound) return null;
    const remuneracao = {salario: salario, horas_mensais: horasMensais}
    return usuarioFound.update(Remuneracao);
}

async function name(params) {
    
}