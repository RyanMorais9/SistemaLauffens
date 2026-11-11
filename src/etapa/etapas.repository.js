
const { etapa, execucao } = require("../../database/models");

class EtapasRepository {
    cadastrar(dados) {
        return etapa.create(dados);
    }

    listarPorProjeto(projetoId) {
        return etapa.findAll({
            where: { proj_id: projetoId },
            include: [{
                model: execucao,
                as: "execucao",
            }],
            order: [["etapa_id", "ASC"]],
        });
    }

    buscarPorId(id) {
        return etapa.findByPk(id, {
            include: [{
                model: execucao,
                as: "execucao",
            }],
        });
    }

    buscarPorTipo(projetoId, tipo) {
        return etapa.findOne({
            where: {
                proj_id: projetoId,
                tipo,
            },
        });
    }

    atualizar(id, dados) {
        return etapa.update(dados, {
            where: { etapa_id: id },
        });
    }

    buscarExecucaoAberta(etapaId) {
        return execucao.findOne({
            where: {
                etapa_id: etapaId,
                data_fim: null,
            },
        });
    }

    iniciarExecucao(dados) {
        return execucao.create(dados);
    }

    encerrarExecucao(id, dados) {
        return execucao.update(dados, {
            where: { execucao_id: id },
        });
    }

    listarExecucoes(etapaId) {
        return execucao.findAll({
            where: { etapa_id: etapaId },
            order: [["data_inicio", "ASC"]],
        });
    }

    contarPorProjeto(projetoId) {
        return etapa.count({
            where: { proj_id: projetoId },
        });
    }
}

module.exports = new EtapasRepository();
