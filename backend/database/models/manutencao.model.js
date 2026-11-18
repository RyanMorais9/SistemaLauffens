const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const manutencao = sequelize.define("manutencao", {
    mntnc_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proj_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    data_retorno:{
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    motivo:{
        type: DataTypes.ENUM('Ajuste','Reparo','Defeito','Problema na instalação', 'Outro')
    },
    descricao:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    status:{
        type: DataTypes.ENUM('Aberta', 'Resolvida')
    },
    data_conclusao:{
        type: DataTypes.DATEONLY
    }
}, {
    tableName: "manutencao",
    timestamps: false,
    validate: {
        validaConclusao(){
            if(this.data_conclusao == null){
                return;
            }
            if(this.data_conclusao >= this.data_retorno){
                return;
            }
            throw new Error("Data de conclusão deve ser maior ou igual a de retorno")
        }
    }
})

manutencao.associate = (models) => {
    manutencao.belongsTo(models.projeto, {
        foreignKey: "proj_id",
        as: "projeto",
    });
}

module.exports = manutencao;