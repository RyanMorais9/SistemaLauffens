const sequelize = require("../connection");

const cliente = require("./cliente.model");
const usuario = require("./usuario.model");
const projeto = require("./projeto.model");
const projeto_user = require("./projeto_user.model");
const etapa = require("./etapa.model");
const execucao = require("./execucao.model");
const manutencao = require("./manutencao.model");
const notificacao = require("./notificacao.model");

const models = {
    sequelize,
    cliente,
    usuario,
    projeto,
    projeto_user,
    etapa,
    execucao,
    manutencao,
    notificacao,
};

Object.values(models).forEach((model) => {
    if (model && typeof model.associate === "function") {
        model.associate(models);
    }
});

module.exports = models;
