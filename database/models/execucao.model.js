const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const execucao = sequelize.define("execucao", {
    execucao_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    etapa_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    data_inicio:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    data_fim:{
        type: DataTypes.DATE,
        allowNull: true,
    },
    motivo_encerramento:{
        type: DataTypes.ENUM('Pausa', 'Finalizado')
    }
}, {
    tableName: "execucao",
    timestamps: false,
    validate: {
        validarData() {
            if(this.data_fim == null && this.motivo_encerramento == null){
                return;
            }
            if(this.data_fim != null && this.motivo_encerramento != null){
                return;
            }
            throw new Error("A data final e o motivo de encerramento devem ser informados juntos");
        }
    },
    indexes: [
        {
            name: "uq_execucao_aberta",
            unique: true,
            fields: ["etapa_id"],
            where: {
                data_fim: null
            }
        },
    ]
});

execucao.associate = (models) => {
    execucao.belongsTo(models.etapa, {
        foreignKey: "etapa_id",
        as: "etapa",
    })
} 

module.exports = execucao;