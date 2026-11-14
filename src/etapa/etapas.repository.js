const { etapa, execucao, projeto, projeto_user, sequelize } = require("../../database/models");

const atributosEtapa = [
    "etapa_id",
    "proj_id",
    "tipo",
    "status",
    "data_inicio",
    "data_fim",
    "tempo_planejado",
    "tempo_total_segundos",
];

class EtapasRepository {
    iniciarTransacao(callback) {
        return sequelize.transaction(callback);
    }

    cadastrar(dados, options = {}) {
        return etapa.create(dados, options);
    }

    buscarProjetoPorId(id, options = {}) {
        return projeto.findByPk(id, options);
    }

    listar(projId, options = {}) {
        const where = projId === undefined ? {} : { proj_id: projId };
        return etapa.findAll({
            ...options,
            attributes: atributosEtapa,
            where,
            order: [
                ["proj_id", "ASC"],
                ["tipo", "ASC"],
            ],
        });
    }

    buscarPorId(id, projId, options = {}) {
        const where = { etapa_id: id };
        if (projId !== undefined) {
            where.proj_id = projId;
        }

        return etapa.findOne({
            where,
            attributes: atributosEtapa,
            ...options,
        });
    }

    listarComExecucoes(projId) {
        return etapa.findAll({
            attributes: atributosEtapa,
            where: projId === undefined ? {} : { proj_id: projId },
            include: [
                { model: execucao, as: "execucao", attributes: ["data_inicio", "data_fim"] },
                { model: projeto, as: "projeto", attributes: ["proj_id", "nome", "porte", "status"] },
            ],
            order: [["proj_id", "ASC"], ["tipo", "ASC"]],
        });
    }

    buscarPorIdParaAtualizacao(id, transaction) {
        return etapa.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
    }

    buscarExecAberta(id, options = {}) {
        return etapa.findOne({
            where: { etapa_id: id },
            attributes: ["etapa_id", "proj_id", "tipo", "status"],
            include: [
                {
                    model: execucao,
                    as: "execucao",
                    where: { data_fim: null },
                    required: true,
                },
            ],
            ...options,
        });
    }

    buscarExecucaoAberta(etapaId, options = {}) {
        return execucao.findOne({
            where: { etapa_id: etapaId, data_fim: null },
            order: [["data_inicio", "DESC"]],
            ...options,
        });
    }

    criarExecucao(etapaId, dataInicio, options = {}) {
        return execucao.create(
            { etapa_id: etapaId, data_inicio: dataInicio },
            options
        );
    }

    async encerrarExecucao(execucaoId, dataFim, motivo, options = {}) {
        const encontrada = await execucao.findOne({
            where: { execucao_id: execucaoId, data_fim: null },
            ...options,
            ...(options.transaction ? { lock: options.transaction.LOCK.UPDATE } : {}),
        });
        if (!encontrada) return [0];
        // Usa o início real, em vez do valor default aplicado a um update em lote.
        await encontrada.update({ data_fim: dataFim, motivo_encerramento: motivo }, options);
        return [1];
    }

    async atualizar(id, dados, options = {}) {
        const encontrada = await etapa.findByPk(id, options);
        if (!encontrada) return null;
        // A validação das datas precisa da data_inicio já gravada na etapa.
        return encontrada.update(dados, options);
    }

    listProjetoAberto(projId) {
        return etapa.findAll({
            attributes: atributosEtapa,
            where: { proj_id: projId, status: "Em andamento" },
            order: [["tipo", "ASC"]],
        });
    }

    listarParticipantes(projId, options = {}) {
        return projeto_user.findAll({ where: { proj_id: projId }, ...options });
    }

    listarExecucoesProjeto(projId, options = {}) {
        return execucao.findAll({
            ...options,
            include: [{ model: etapa, as: "etapa", where: { proj_id: projId }, attributes: [] }],
        });
    }

    listarExecucoes(etapaId, options = {}) {
        return execucao.findAll({
            ...options,
            attributes: ["data_inicio", "data_fim"],
            where: { etapa_id: etapaId },
            order: [["data_inicio", "ASC"]],
        });
    }
}

module.exports = new EtapasRepository();
