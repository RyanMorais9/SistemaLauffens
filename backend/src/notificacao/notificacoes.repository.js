const { Op } = require("sequelize");
const { notificacao, usuario, projeto, cliente, etapa, execucao, sequelize } = require("../../database/models");

class NotificacoesRepository {
    criarEmLote(dados, transaction) {
        return notificacao.bulkCreate(dados, { transaction });
    }

    listarAdministradoresAtivos(transaction) {
        return usuario.findAll({
            where: { perfil: "Administrador", ativo: true },
            attributes: ["usuario_id"],
            order: [["usuario_id", "ASC"]],
            transaction,
        });
    }

    buscarProjetoComCliente(projId, transaction) {
        return projeto.findByPk(projId, {
            attributes: ["proj_id", "nome"],
            include: [{ model: cliente, as: "cliente", attributes: ["nome"] }],
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
                "enviada_push_em",
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
        return usuario.findByPk(id, { attributes: ["usuario_id", "perfil", "ativo"] });
    }

    gravarInscricao(usuarioId, inscricao) {
        return usuario.update({ push_token: inscricao }, { where: { usuario_id: usuarioId } });
    }

    limparInscricaoExpirada(usuarioId, inscricao, transaction) {
        return usuario.update({ push_token: null }, {
            where: { usuario_id: usuarioId, push_token: inscricao }, transaction,
        });
    }

    listarProjetosParaVerificarAtraso(transaction) {
        return projeto.findAll({
            where: { status: { [Op.notIn]: ["Concluído", "Cancelado"] } },
            attributes: ["proj_id"], order: [["proj_id", "ASC"]], transaction,
        });
    }

    async buscarProjetoParaVerificarAtraso(projId, transaction) {
        const encontrado = await projeto.findByPk(projId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!encontrado || encontrado.status === "Cancelado") return null;
        return projeto.findByPk(projId, {
            include: [
                { model: cliente, as: "cliente", attributes: ["nome"] },
                { model: etapa, as: "etapa", include: [{ model: execucao, as: "execucao" }] },
            ], transaction,
        });
    }

    buscarAvisoDeAtraso(usuarioId, projId, etapaId, titulo, transaction) {
        return notificacao.findOne({
            where: { usuario_destinatario_id: usuarioId, proj_id: projId,
                ...(etapaId === undefined ? {} : { etapa_id: etapaId }), tipo: "Atraso", titulo }, transaction,
        });
    }

    processarFila(operacao, chave = 20261116) {
        return sequelize.transaction(async transaction => {
            const [[{ bloqueado }]] = await sequelize.query(
                "SELECT pg_try_advisory_xact_lock(:chave) AS bloqueado", { replacements: { chave }, transaction }
            );
            if (!bloqueado) return;
            return operacao(transaction);
        });
    }

    listarPushPendentes(transaction) {
        return notificacao.findAll({
            where: {
                status_push: { [Op.in]: ["Pendente", "Falhou"] },
                criada_em: { [Op.gte]: new Date(Date.now() - 86400000) },
            },
            include: [{
                model: usuario, as: "usuario", attributes: ["usuario_id", "push_token"],
                where: { ativo: true, perfil: "Administrador", push_token: { [Op.not]: null } },
                required: true,
            }],
            order: [["status_push", "ASC"], ["notf_id", "ASC"]], limit: 10, transaction,
        });
    }

    registrarResultadoPush(id, status, enviadaEm, transaction) {
        return notificacao.update({ status_push: status, enviada_push_em: enviadaEm }, {
            where: { notf_id: id, status_push: { [Op.in]: ["Pendente", "Falhou"] } }, transaction,
        });
    }

}

module.exports = new NotificacoesRepository();
