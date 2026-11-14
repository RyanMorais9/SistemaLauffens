const execucao = require("../../database/models/execucao.model.js");
const etapa = require("../../database/models/etapa.model.js");

const atributosExecucao = [
    "execucao_id",
    "etapa_id",
    "data_inicio",
    "data_fim",
    "motivo_encerramento",
];

class ExecucoesRepository {
    buscarEtapaPorId(etapaId) {
        return etapa.findByPk(etapaId, {
            attributes: ["etapa_id"],
        });
    }

    listarPorEtapa(etapaId) {
        return execucao.findAll({
            attributes: atributosExecucao,
            where: { etapa_id: etapaId },
            order: [["data_inicio", "ASC"]],
        });
    }

    buscarPorId(id) {
        return execucao.findByPk(id, {
            attributes: atributosExecucao,
        });
    }

    buscarAbertaPorEtapa(etapaId) {
        return execucao.findOne({
            attributes: atributosExecucao,
            where: { etapa_id: etapaId, data_fim: null },
        });
    }
}

module.exports = new ExecucoesRepository();
