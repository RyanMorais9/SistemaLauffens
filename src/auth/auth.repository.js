const usuario = require("../../database/models/usuario.model.js");

async function buscarPorLogin(login) {
    const user = usuario.findOne({where: {login: login}});
    return user;
}

async function buscarPorId(id) {
    const result = usuario.findByPk(id);
    return result;
}

module.exports = {
    buscarPorLogin,
    buscarPorId
}