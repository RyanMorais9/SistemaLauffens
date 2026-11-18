const { Sequelize } = require("sequelize");

// new Sequelize(banco, usuario, senha, opcoes)
const sequelize = new Sequelize("sistemalauffens", "Biluga", "f7c3h2f6", {
    host: "localhost",
    port: 5432,
    dialect: "postgres",
    logging: console.log,
});

module.exports = sequelize;