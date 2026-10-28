const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const notificacao = sequelize.define("notificacao", {
    notf_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_destinatario_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    proj_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    etapa_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo:{
        type: DataTypes.ENUM('Atraso', 'Etapa concluída')
    },
    titulo:{
        type: DataTypes.STRING(50),
        allowNull: false        
    },
    mensagem:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    criada_em:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    lida_em:{
        type: DataTypes.DATE
    },
    enviada_push_em:{
        type: DataTypes.DATE
    },
    status_push:{
        type: DataTypes.ENUM('Pendente', 'Enviada', 'Falhou'),
        defaultValue: 'Pendente'
    }
}, {
    tableName: "notificacao",
    timestamps: false,
});

notificacao.associate = (models) => {
    notificacao.belongsTo(models.usuario, {
        foreignKey: "usuario_destinatario_id",
        as: "usuario"
    });
    notificacao.belongsTo(models.projeto, {
        foreignKey: "proj_id",
        as: "projeto"
    });
    notificacao.belongsTo(models.etapa, {
        foreignKey: "etapa_id",
        as: "etapa"
    });
};

module.exports = notificacao;