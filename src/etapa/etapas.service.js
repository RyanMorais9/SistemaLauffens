const etapasRepository = require("./etapas.repository");

const tiposEtapa = ["Corte", "Fitagem", "Refinamento", "Embalamento"];

function erroHttp(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarId(id, nome = "ID da etapa") {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1) {
        throw erroHttp(400, `${nome} deve ser um inteiro positivo.`);
    }
    return numero;
}

function validarObjeto(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw erroHttp(400, "Envie um objeto JSON válido.");
    }
}

async function exigirEtapa(id, transaction) {
    const etapa = transaction
        ? await etapasRepository.buscarPorIdParaAtualizacao(id, transaction)
        : await etapasRepository.buscarPorId(id);
    if (!etapa) {
        throw erroHttp(404, "Etapa não encontrada.");
    }
    return etapa;
}

async function exigirProjeto(id) {
    const projeto = await etapasRepository.buscarProjetoPorId(id);
    if (!projeto) {
        throw erroHttp(404, "Projeto não encontrado.");
    }
}

async function cadastrar(dados) {
    validarObjeto(dados);
    const permitidos = ["proj_id", "tipo", "status", "tempo_planejado"];
    if (Object.keys(dados).some((campo) => !permitidos.includes(campo))) {
        throw erroHttp(400, "A etapa contém campos não permitidos.");
    }

    const projId = validarId(dados.proj_id, "proj_id");
    if (!tiposEtapa.includes(dados.tipo)) {
        throw erroHttp(400, "Tipo de etapa inválido.");
    }
    if (!Number.isInteger(dados.tempo_planejado) || dados.tempo_planejado < 1) {
        throw erroHttp(400, "tempo_planejado deve ser um inteiro positivo em minutos.");
    }
    if (dados.status !== undefined && dados.status !== "Planejada") {
        throw erroHttp(400, "Uma nova etapa deve ser cadastrada como Planejada.");
    }

    await exigirProjeto(projId);
    return etapasRepository.cadastrar({
        proj_id: projId,
        tipo: dados.tipo,
        status: "Planejada",
        tempo_planejado: dados.tempo_planejado,
    });
}

function listar(projId) {
    return etapasRepository.listar(
        projId === undefined ? undefined : validarId(projId, "proj_id")
    );
}

async function listarPorProjeto(projId) {
    const id = validarId(projId, "proj_id");
    await exigirProjeto(id);
    return etapasRepository.listar(id);
}

async function buscarPorId(id) {
    return exigirEtapa(validarId(id));
}

async function listarProjetoAberto(projId) {
    const id = validarId(projId, "proj_id");
    await exigirProjeto(id);
    return etapasRepository.listProjetoAberto(id);
}

async function buscarExecAberta(id) {
    const etapa = await etapasRepository.buscarExecAberta(validarId(id));
    if (!etapa) {
        throw erroHttp(404, "Etapa não encontrada ou sem execução aberta.");
    }
    return etapa;
}

async function editarPlanejamento(id, dados) {
    const etapaId = validarId(id);
    validarObjeto(dados);

    const permitidos = ["tipo", "tempo_planejado"];
    if (
        Object.keys(dados).length === 0 ||
        Object.keys(dados).some((campo) => !permitidos.includes(campo))
    ) {
        throw erroHttp(400, "Informe tipo e/ou tempo_planejado para atualizar.");
    }
    if (dados.tipo !== undefined && !tiposEtapa.includes(dados.tipo)) {
        throw erroHttp(400, "Tipo de etapa inválido.");
    }
    if (
        dados.tempo_planejado !== undefined &&
        (!Number.isInteger(dados.tempo_planejado) || dados.tempo_planejado < 1)
    ) {
        throw erroHttp(400, "tempo_planejado deve ser um inteiro positivo em minutos.");
    }

    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Planejada") {
            throw erroHttp(409, "Só é possível editar uma etapa planejada.");
        }
        await etapasRepository.atualizar(etapaId, dados, { transaction });
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function mudarStatus(id, configuracao) {
    const etapaId = validarId(id);

    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== configuracao.de) {
            throw erroHttp(409, configuracao.erroStatus);
        }

        const execucao = await etapasRepository.buscarExecucaoAberta(etapaId, {
            transaction,
        });
        if (configuracao.motivo && !execucao) {
            throw erroHttp(409, "A etapa em andamento não possui execução aberta.");
        }
        if (configuracao.abrir && execucao) {
            throw erroHttp(409, "A etapa já possui uma execução aberta.");
        }

        const agora = new Date();
        if (configuracao.abrir) {
            await etapasRepository.criarExecucao(etapaId, agora, { transaction });
        }
        if (configuracao.motivo) {
            const [atualizadas] = await etapasRepository.encerrarExecucao(
                execucao.execucao_id,
                agora,
                configuracao.motivo,
                { transaction }
            );
            if (atualizadas !== 1) {
                throw erroHttp(409, "A execução já foi encerrada.");
            }
        }

        const dados = { status: configuracao.para };
        if (configuracao.inicio) dados.data_inicio = agora;
        if (configuracao.fim) dados.data_fim = agora;
        await etapasRepository.atualizar(etapaId, dados, { transaction });
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

function iniciarEtapa(id) {
    return mudarStatus(id, {
        de: "Planejada",
        para: "Em andamento",
        abrir: true,
        inicio: true,
        erroStatus: "A etapa só pode ser iniciada quando estiver planejada.",
    });
}

function pausarEtapa(id) {
    return mudarStatus(id, {
        de: "Em andamento",
        para: "Pausada",
        motivo: "Pausa",
        erroStatus: "Só é possível pausar uma etapa em andamento.",
    });
}

function retomarEtapa(id) {
    return mudarStatus(id, {
        de: "Pausada",
        para: "Em andamento",
        abrir: true,
        erroStatus: "Só é possível retomar uma etapa pausada.",
    });
}

function concluirEtapa(id) {
    return mudarStatus(id, {
        de: "Em andamento",
        para: "Concluída",
        motivo: "Finalizado",
        fim: true,
        erroStatus: "Só é possível concluir uma etapa em andamento.",
    });
}

async function consultarTempo(id) {
    const etapa = await exigirEtapa(validarId(id));
    const execucoes = await etapasRepository.listarExecucoes(etapa.etapa_id);
    const agora = Date.now();
    const totalMs = execucoes.reduce((total, execucao) => {
        const inicio = new Date(execucao.data_inicio).getTime();
        const fim = execucao.data_fim
            ? new Date(execucao.data_fim).getTime()
            : agora;
        return Number.isFinite(inicio) && Number.isFinite(fim) && fim >= inicio
            ? total + fim - inicio
            : total;
    }, 0);
    const totalSegundos = totalMs / 1000;

    return {
        etapa_id: etapa.etapa_id,
        tempo_total_segundos: Math.round(totalSegundos),
        tempo_total_minutos: Number((totalSegundos / 60).toFixed(2)),
        tempo_planejado_minutos: etapa.tempo_planejado,
        em_andamento: execucoes.some((execucao) => !execucao.data_fim),
    };
}

module.exports = {
    cadastrar,
    listar,
    listarPorProjeto,
    buscarPorId,
    listarProjetoAberto,
    buscarExecAberta,
    editarPlanejamento,
    criarPlanejamento: editarPlanejamento,
    iniciarEtapa,
    pausarEtapa,
    retomarEtapa,
    concluirEtapa,
    consultarTempo,
};
