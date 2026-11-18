const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const projeto_user = sequelize.define("projeto_user", {
    proj_user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proj_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    salario_referencia: {
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
    horas_mensais_referencia: {
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
    custo_hora_referencia: {
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
    vinculado_em: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
}, {
    tableName: "projeto_user",
    timestamps: false,
    indexes: [
        {
            name: "uq_proj_user",
            unique: true,
            fields: ["proj_id", "usuario_id"]
        }
    ]
})

projeto_user.associate = (models) => {
    projeto_user.belongsTo(models.projeto, {
        foreignKey: "proj_id",
        as: "projeto"
    });
    projeto_user.belongsTo(models.usuario, {
        foreignKey: "usuario_id",
        as: "usuario"
    });
}

module.exports = projeto_user;