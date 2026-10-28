const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const projeto = sequelize.define("projeto", {
    proj_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    criado_por_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    porte: {
        type: DataTypes.ENUM('Pequeno', 'Médio', 'Grande'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Planejado', 'Em andamento', 'Atrasado', 'Concluído'),
        allowNull: false
    },
    prazo_planejado: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_inicio: {
        type: DataTypes.DATE
    },
    data_fim: {
        type: DataTypes.DATE
    },
    valor_base: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: {
                args: [0.01],
                msg: "O preço deve ser um valor maior que zero."
            }
        }
    },
    custo_mao_de_obra_final: {
        type: DataTypes.DECIMAL(9, 2),
        validate: {
            isDecimal: true,
            min: {
                args: [0.01],
                msg: "O preço deve ser um valor maior que zero."
            }
        }
    },
    valor_final: {
        type: DataTypes.DECIMAL(9, 2),
        validate: {
            isDecimal: true,
            min: {
                args: [0.01],
                msg: "O preço deve ser um valor maior que zero."
            }
        }
    }
}, {
    tableName: "projeto",
    timestamps: false,
    validate: {
        validarHoras(){
            if(this.data_fim == null){
                return;
            }
            if(this.data_inicio == null){
                throw new Error("Data de inicio necessaria para ter uma data de conclusão");
            }
            if(this.data_fim < data_inicio){
                throw new Error("A data de conclusão deve ser maior que a de inicio");
            }
            
        }
    }
})

projeto.associate = (models) => {
    projeto.belongsTo(models.cliente, {
        foreignKey: "cliente_id",
        as: "cliente"
    });
    projeto.belongsTo(models.usuario, {
        foreignKey: "criado_por_id",
        as: "usuario"
    })
}

module.exports = projeto;