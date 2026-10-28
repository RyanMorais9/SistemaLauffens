const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const usuario = sequelize.define("usuario", {
    usuario_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    cpf: {
        type: DataTypes.CHAR(11),
        unique: true,
        allowNull: false
    },
    telefone: {
        type: DataTypes.STRING(20)
    },
    nascimento: {
        type: DataTypes.DATEONLY
    },
    perfil: {
        type: DataTypes.ENUM('Administrador', 'Marceneiro'),
        allowNull: false
    },
    login: {
        type: DataTypes.STRING(30),
        unique: true,
        allowNull: false
    },
    senha: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    salario: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: {
                args: [0.01],
                msg: "O preço deve ser um valor maior que zero."
            }
        }
    },
    horas_mensais: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: {
                args: [0.01],
                msg: "O preço deve ser um valor maior que zero."
            }
        }
    },
    push_token: {
        type: DataTypes.TEXT
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
})


module.exports = usuario;