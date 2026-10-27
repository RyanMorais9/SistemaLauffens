const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const cliente = sequelize.define("cliente", {
    cliente_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoincrement: true
    },
    nome:{
        type: DataTypes.STRING(120),
        allowNull: false
    },
    cpf:{
        type: DataTypes.CHAR(11),
        unique: true,
        allowNull: false
    },
    telefone:{
        type: DataTypes.STRING(20)
    } 
});

module.exports = cliente;