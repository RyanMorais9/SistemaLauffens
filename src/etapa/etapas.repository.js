const { etapa, execucao, projeto, sequelize } = require("../../database/models");

const atributosEtapa = [
    "etapa_id",
    "proj_id",
    "tipo",
    "status",
    "data_inicio",
    "data_fim",
    "tempo_planejado",
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

    listar(projId) {
        const where = projId === undefined ? {} : { proj_id: projId };
        return etapa.findAll({
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

    encerrarExecucao(execucaoId, dataFim, motivo, options = {}) {
        return execucao.update(
            { data_fim: dataFim, motivo_encerramento: motivo },
            { where: { execucao_id: execucaoId, data_fim: null }, ...options }
        );
    }

    atualizar(id, dados, options = {}) {
        return etapa.update(dados, {
            where: { etapa_id: id },
            ...options,
        });
    }

    listProjetoAberto(projId) {
        return etapa.findAll({
            attributes: atributosEtapa,
            where: { proj_id: projId, status: "Em andamento" },
            order: [["tipo", "ASC"]],
        });
    }

    listarExecucoes(etapaId) {
        return execucao.findAll({
            attributes: ["data_inicio", "data_fim"],
            where: { etapa_id: etapaId },
            order: [["data_inicio", "ASC"]],
        });
    }
}

module.exports = new EtapasRepository();
