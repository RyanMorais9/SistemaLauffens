const { projeto_user, projeto, usuario, execucao, etapa, sequelize } = require("../../database/models");

function iniciarTransacao(callback) {
    return sequelize.transaction(callback);
}

function buscarProjetoPorId(id, options = {}) {
    return projeto.findByPk(id, options);
}

function buscarUsuarioPorId(id, options = {}) {
    return usuario.findByPk(id, {
        ...options,
        attributes: ["usuario_id", "nome", "perfil", "ativo", "salario", "horas_mensais"],
    });
}

function buscarPorId(id, options = {}) {
    return projeto_user.findByPk(id, options);
}

function buscarVinculo(projId, usuarioId, options = {}) {
    return projeto_user.findOne({ ...options, where: { proj_id: projId, usuario_id: usuarioId } });
}

function contarExecucoes(projId, options = {}) {
    return execucao.count({
        ...options,
        include: [{ model: etapa, as: "etapa", where: { proj_id: projId }, attributes: [] }],
    });
}

function vincular(dados, options = {}) {
    return projeto_user.create(dados, options);
}

function listarPorProjeto(projId) {
    return projeto_user.findAll({
        where: { proj_id: projId },
        include: [{ model: usuario, as: "usuario", attributes: ["usuario_id", "nome", "ativo"] }],
        order: [["proj_user_id", "ASC"]],
    });
}

function listarPorUsuario(usuarioId) {
    return projeto_user.findAll({
        where: { usuario_id: usuarioId },
        include: [{ model: projeto, as: "projeto", attributes: ["proj_id", "nome", "status"] }],
        order: [["proj_user_id", "ASC"]],
    });
}

function desvincular(id, options = {}) {
    return projeto_user.destroy({ ...options, where: { proj_user_id: id } });
}

module.exports = {
    iniciarTransacao, buscarProjetoPorId, buscarUsuarioPorId, buscarPorId,
    buscarVinculo, contarExecucoes, vincular, listarPorProjeto, listarPorUsuario, desvincular,
};
