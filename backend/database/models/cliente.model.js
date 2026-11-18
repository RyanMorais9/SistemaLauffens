const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const cliente = sequelize.define("cliente", {
    cliente_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
}, {
    tableName: "cliente",
    timestamps: false
});

cliente.associate = (models) => { /* para mostrar projetos associados a certos cliente */
    cliente.hasMany(models.projeto, {
        foreignKey: "cliente_id", 
        as: "projeto"
    })
}

module.exports = cliente;