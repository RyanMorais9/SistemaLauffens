const execucoesRepository = require("./execucoes.repository");

function erroHttp(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarId(id, nome) {
    const numero = Number(id);
    if (!["string", "number"].includes(typeof id) || !/^\d+$/.test(String(id)) || !Number.isSafeInteger(numero) || numero < 1) {
        throw erroHttp(400, `${nome} deve ser um inteiro positivo.`);
    }
    return numero;
}

function incluirDuracao(execucao) {
    const inicio = new Date(execucao.data_inicio).getTime();
    const fim = execucao.data_fim
        ? new Date(execucao.data_fim).getTime()
        : Date.now();
    const duracaoSegundos =
        Number.isFinite(inicio) && Number.isFinite(fim) && fim >= inicio
            ? Math.round((fim - inicio) / 1000)
            : 0;

    return {
        ...execucao.toJSON(),
        duracao_segundos: duracaoSegundos,
        em_andamento: execucao.data_fim === null,
    };
}

async function exigirEtapa(etapaId) {
    const etapa = await execucoesRepository.buscarEtapaPorId(etapaId);
    if (!etapa) {
        throw erroHttp(404, "Etapa não encontrada.");
    }
}

async function listarPorEtapa(id) {
    const etapaId = validarId(id, "ID da etapa");
    await exigirEtapa(etapaId);
    const execucoes = await execucoesRepository.listarPorEtapa(etapaId);
    return execucoes.map(incluirDuracao);
}

async function buscarPorId(id) {
    const execucao = await execucoesRepository.buscarPorId(
        validarId(id, "ID da execução")
    );
    if (!execucao) {
        throw erroHttp(404, "Execução não encontrada.");
    }
    return incluirDuracao(execucao);
}

async function buscarAbertaPorEtapa(id) {
    const etapaId = validarId(id, "ID da etapa");
    await exigirEtapa(etapaId);
    const execucao = await execucoesRepository.buscarAbertaPorEtapa(etapaId);
    if (!execucao) {
        throw erroHttp(404, "A etapa não possui execução aberta.");
    }
    return incluirDuracao(execucao);
}

module.exports = {
    listarPorEtapa,
    buscarPorId,
    buscarAbertaPorEtapa,
};
