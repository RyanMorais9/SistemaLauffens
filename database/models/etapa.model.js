const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const etapa = sequelize.define("etapa", {
    etapa_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true

    },
    proj_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('Corte', 'Fitagem', 'Refinamento', 'Embalamento'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Planejada', 'Em andamento', 'Pausada', 'Concluída'),
        allowNull: false
    },
    data_inicio: {
        type: DataTypes.DATE
    },
    data_fim: {
        type: DataTypes.DATE
    },
    tempo_planejado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0.6,
            max: 600000,
        },
    },
    tempo_total_segundos: {
        type: DataTypes.DECIMAL(16, 3),
        validate: { min: 0 },
    },
}, {
    tableName: "etapa",
    timestamps: false,
    indexes: [
        {
            name: "uq_proj_etapa",
            unique: true,
            fields: ["proj_id", "tipo"],
        },
    ],

    validate: {
        validarDatas() {
            if (this.data_fim == null) {
                return;
            }
            if (this.data_inicio == null) {
                throw new Error("Informe a data incial antes da data final")
            }
            if (this.data_fim < this.data_inicio) {
                throw new Error("A data final não pode ser anterior a data inicial")
            }
        }
    }
});

etapa.associate = (models) => {
    etapa.belongsTo(models.projeto, {
        foreignKey: "proj_id",
        as: "projeto",
    });
    etapa.hasMany(models.execucao, { /* Mostrar as execuções e pausas daquela etapa */
        foreignKey: "etapa_id",
        as: "execucao"
    })
}

module.exports = etapa;
