const { projeto_user, projeto, usuario, sequelize } = require("../../database/models");

function iniciarTransacao(operacao) {
    return sequelize.transaction(operacao);
}

async function buscarProjetoPorId(id, options = {}) {
    return projeto.findByPk(id, options);
}

async function buscarUsuarioPorId(id, options = {}) {
    return usuario.findByPk(id, options);
}

async function vincularFuncionario(dados, options = {}) {
    return projeto_user.create(dados, options);
}

async function listarParticipantes(projetoId, options = {}) {
    return projeto_user.findAll({...options, where: { proj_id: projetoId } });
}

async function listarParticipacaoUser(usuarioId) {
    return projeto_user.findAll({ where: { usuario_id: usuarioId } });
}

async function buscarVinculo(id) {
    return projeto_user.findByPk(id);
}

module.exports = {
    iniciarTransacao,
    buscarProjetoPorId,
    buscarUsuarioPorId,
    vincularFuncionario,
    listarParticipantes,
    listarParticipacaoUser,
    buscarVinculo
}