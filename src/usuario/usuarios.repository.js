const usuario = require("../../database/models/usuario.model.js");

async function cadastrar(dados) {
    return usuario.create(dados);    
}

async function listar() {
    return usuario.findAll({attributes: { exclude: ["senha"] }});
}

async function buscarPorId(id, options = {}) {
    return usuario.findByPk(id, { ...options, attributes: { exclude: ["senha"] }});
}

async function editar(id, dados, options = {}) {
    const usuarioFound = await usuario.findByPk(id, options);
    if(!usuarioFound) return null;
    return usuarioFound.update(dados, options);
}

async function atualizarRemuneracao(id, salario, horasMensais) {
    const usuarioFound = await usuario.findByPk(id);
    if(!usuarioFound) return null;
    const remuneracao = {salario: salario, horas_mensais: horasMensais}
    return usuarioFound.update(remuneracao);
}

async function gravarPushToken(id, token) {
    const usuarioFound = await usuario.findByPk(id);
    if(!usuarioFound) return null;
    const tokenAlterado = {push_token: token}
    return usuarioFound.update(tokenAlterado);
}

async function desativar(id, options = {}) {
    const usuarioFound = await usuario.findByPk(id, options);
    if(!usuarioFound) return null;
    const ativo = {ativo: false};
    return usuarioFound.update(ativo, options);
}

async function contarAdministradoresAtivos(options = {}) {
    return usuario.count({ ...options, where:{perfil: "Administrador", ativo: true}})
}

// Serializa as alterações de usuários durante a verificação do último administrador.
// O PostgreSQL libera o bloqueio ao concluir ou desfazer a transação.
async function comBloqueioAdministradores(operacao) {
    return usuario.sequelize.transaction({ isolationLevel: "READ COMMITTED" }, async (transaction) => {
        await usuario.sequelize.query('LOCK TABLE "usuario" IN SHARE ROW EXCLUSIVE MODE', { transaction });
        return operacao(transaction);
    });
}

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    editar,
    atualizarRemuneracao,
    gravarPushToken,
    desativar,
    contarAdministradoresAtivos,
    comBloqueioAdministradores
}