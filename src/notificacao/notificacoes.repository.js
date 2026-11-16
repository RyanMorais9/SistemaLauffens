const { Op } = require("sequelize");
const { notificacao, usuario, projeto_user } = require("../../database/models");

class NotificacoesRepository {
    criarEmLote(dados, transaction) {
        return notificacao.bulkCreate(dados, { transaction });
    }

    listarDestinatariosAtivos(projId, transaction) {
        return projeto_user.findAll({
            where: { proj_id: projId },
            attributes: ["usuario_id"],
            include: [{
                model: usuario,
                as: "usuario",
                attributes: [],
                where: { ativo: true },
                required: true,
            }],
            transaction,
        });
    }

    listarPorUsuario(usuarioId, lida) {
        const where = { usuario_destinatario_id: usuarioId };
        if (lida !== undefined) where.lida_em = lida ? { [Op.not]: null } : null;

        return notificacao.findAll({
            where,
            attributes: [
                "notf_id",
                "proj_id",
                "etapa_id",
                "tipo",
                "titulo",
                "mensagem",
                "criada_em",
                "lida_em",
                "status_push",
            ],
            order: [["criada_em", "DESC"]],
        });
    }

    contarNaoLidas(usuarioId) {
        return notificacao.count({
            where: { usuario_destinatario_id: usuarioId, lida_em: null },
        });
    }

    buscarPorIdEUsuario(notificacaoId, usuarioId) {
        return notificacao.findOne({
            where: {
                notf_id: notificacaoId,
                usuario_destinatario_id: usuarioId,
            },
        });
    }

    marcarComoLida(notificacaoId, usuarioId, lidaEm) {
        return notificacao.update(
            { lida_em: lidaEm },
            {
                where: {
                    notf_id: notificacaoId,
                    usuario_destinatario_id: usuarioId,
                    lida_em: null,
                },
            }
        );
    }

    buscarUsuarioPorId(id) {
        return usuario.findByPk(id, { attributes: ["usuario_id"] });
    }

}

module.exports = new NotificacoesRepository();