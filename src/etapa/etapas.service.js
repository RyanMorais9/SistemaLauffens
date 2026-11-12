const etapasRepository = require("./etapas.repository");

const tiposEtapa = ["Corte", "Fitagem", "Refinamento", "Embalamento"];
const camposPlanejamento = ["tipo", "tempo_planejado"];

function erroHttp(status, mensagem) {
    const error = new Error(mensagem);
    error.status = status;
    return error;
}

function validarId(id, nome = "ID da etapa") {
    if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        throw erroHttp(400, `${nome} deve ser um inteiro positivo.`);
    }
    return Number(id);
}

function validarTipo(tipo) {
    if (!tiposEtapa.includes(tipo)) {
        throw erroHttp(400, `Tipo inválido. Use: ${tiposEtapa.join(", ")}.`);
    }
}

function validarTempoPlanejado(tempo) {
    if (!Number.isInteger(tempo) || tempo < 1) {
        throw erroHttp(400, "tempo_planejado deve ser um inteiro positivo em minutos.");
    }
}

function validarCampos(dados, permitidos) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw erroHttp(400, "Envie um objeto JSON válido.");
    }
    const desconhecidos = Object.keys(dados).filter((campo) => !permitidos.includes(campo));
    if (desconhecidos.length > 0) {
        throw erroHttp(400, `Campos não permitidos: ${desconhecidos.join(", ")}.`);
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

async function cadastrar(dados) {
    validarCampos(dados, ["proj_id", "tipo", "status", "tempo_planejado"]);
    const projId = validarId(dados.proj_id, "proj_id");
    validarTipo(dados.tipo);
    validarTempoPlanejado(dados.tempo_planejado);
    if (dados.status !== undefined && dados.status !== "Planejada") {
        throw erroHttp(400, "Uma nova etapa deve ser cadastrada com status Planejada.");
    }

    const projeto = await etapasRepository.buscarProjetoPorId(projId);
    if (!projeto) {
        throw erroHttp(404, "Projeto não encontrado.");
    }

    return etapasRepository.cadastrar({
        proj_id: projId,
        tipo: dados.tipo,
        status: "Planejada",
        tempo_planejado: dados.tempo_planejado,
    });
}

function listar(projId) {
    if (projId === undefined) {
        return etapasRepository.listar();
    }
    return etapasRepository.listar(validarId(projId, "proj_id"));
}

async function listarPorProjeto(projId) {
    const id = validarId(projId, "proj_id");
    const projeto = await etapasRepository.buscarProjetoPorId(id);
    if (!projeto) {
        throw erroHttp(404, "Projeto não encontrado.");
    }
    return etapasRepository.listar(id);
}

async function buscarPorId(id) {
    const etapa = await etapasRepository.buscarPorId(validarId(id));
    if (!etapa) {
        throw erroHttp(404, "Etapa não encontrada.");
    }
    return etapa;
}

async function listarProjetoAberto(projId) {
    const id = validarId(projId, "proj_id");
    const projeto = await etapasRepository.buscarProjetoPorId(id);
    if (!projeto) {
        throw erroHttp(404, "Projeto não encontrado.");
    }
    return etapasRepository.listProjetoAberto(id);
}

async function buscarExecAberta(id) {
    const etapaId = validarId(id);
    const etapa = await etapasRepository.buscarExecAberta(etapaId);
    if (!etapa) {
        throw erroHttp(404, "Etapa não encontrada ou sem execução aberta.");
    }
    return etapa;
}

async function editarPlanejamento(id, dados) {
    const etapaId = validarId(id);
    validarCampos(dados, camposPlanejamento);
    if (Object.keys(dados).length === 0) {
        throw erroHttp(400, "Informe tipo e/ou tempo_planejado para atualizar.");
    }
    if (dados.tipo !== undefined) {
        validarTipo(dados.tipo);
    }
    if (dados.tempo_planejado !== undefined) {
        validarTempoPlanejado(dados.tempo_planejado);
    }

    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Planejada") {
            throw erroHttp(409, "Só é possível editar o planejamento de uma etapa planejada.");
        }
        await etapasRepository.atualizar(etapaId, dados, { transaction });
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function iniciarEtapa(id) {
    const etapaId = validarId(id);
    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Planejada") {
            throw erroHttp(409, "A etapa só pode ser iniciada quando estiver planejada.");
        }
        const execucaoAberta = await etapasRepository.buscarExecucaoAberta(etapaId, { transaction });
        if (execucaoAberta) {
            throw erroHttp(409, "A etapa já possui uma execução aberta.");
        }

        const agora = new Date();
        const projeto = await etapasRepository.buscarProjetoPorId(etapa.proj_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!projeto) throw erroHttp(404, "Projeto não encontrado.");
        if (["Concluído", "Cancelado"].includes(projeto.status)) {
            throw erroHttp(409, "Não é possível iniciar etapas de um projeto concluído ou cancelado.");
        }
        if (!projeto.data_inicio) {
            await projeto.update({
                data_inicio: agora,
                status: projeto.status === "Planejado" ? "Em andamento" : projeto.status,
            }, { transaction });
        }
        await etapasRepository.criarExecucao(etapaId, agora, { transaction });
        await etapasRepository.atualizar(
            etapaId,
            { status: "Em andamento", data_inicio: agora },
            { transaction }
        );
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function pausarEtapa(id) {
    const etapaId = validarId(id);
    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Em andamento") {
            throw erroHttp(409, "Só é possível pausar uma etapa em andamento.");
        }
        const execucao = await etapasRepository.buscarExecucaoAberta(etapaId, { transaction });
        if (!execucao) {
            throw erroHttp(409, "A etapa em andamento não possui execução aberta.");
        }

        const agora = new Date();
        const [atualizadas] = await etapasRepository.encerrarExecucao(
            execucao.execucao_id,
            agora,
            "Pausa",
            { transaction }
        );
        if (atualizadas !== 1) {
            throw erroHttp(409, "A execução já foi encerrada.");
        }
        await etapasRepository.atualizar(etapaId, { status: "Pausada" }, { transaction });
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function retomarEtapa(id) {
    const etapaId = validarId(id);
    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Pausada") {
            throw erroHttp(409, "Só é possível retomar uma etapa pausada.");
        }
        const execucaoAberta = await etapasRepository.buscarExecucaoAberta(etapaId, { transaction });
        if (execucaoAberta) {
            throw erroHttp(409, "A etapa já possui uma execução aberta.");
        }

        await etapasRepository.criarExecucao(etapaId, new Date(), { transaction });
        await etapasRepository.atualizar(
            etapaId,
            { status: "Em andamento" },
            { transaction }
        );
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function concluirEtapa(id) {
    const etapaId = validarId(id);
    return etapasRepository.iniciarTransacao(async (transaction) => {
        const etapa = await exigirEtapa(etapaId, transaction);
        if (etapa.status !== "Em andamento") {
            throw erroHttp(409, "Só é possível concluir uma etapa em andamento.");
        }
        const execucao = await etapasRepository.buscarExecucaoAberta(etapaId, { transaction });
        if (!execucao) {
            throw erroHttp(409, "A etapa em andamento não possui execução aberta.");
        }

        const agora = new Date();
        const [atualizadas] = await etapasRepository.encerrarExecucao(
            execucao.execucao_id,
            agora,
            "Finalizado",
            { transaction }
        );
        if (atualizadas !== 1) {
            throw erroHttp(409, "A execução já foi encerrada.");
        }
        await etapasRepository.atualizar(
            etapaId,
            { status: "Concluída", data_fim: agora },
            { transaction }
        );
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function consultarTempo(id) {
    const etapaId = validarId(id);
    const etapa = await exigirEtapa(etapaId);
    const execucoes = await etapasRepository.listarExecucoes(etapaId);
    const agora = Date.now();
    let totalMilissegundos = 0;
    let emAndamento = false;

    for (const execucao of execucoes) {
        const inicio = new Date(execucao.data_inicio).getTime();
        const fim = execucao.data_fim
            ? new Date(execucao.data_fim).getTime()
            : agora;
        if (Number.isFinite(inicio) && Number.isFinite(fim) && fim >= inicio) {
            totalMilissegundos += fim - inicio;
        }
        if (!execucao.data_fim) {
            emAndamento = true;
        }
    }

    const totalSegundos = totalMilissegundos / 1000;
    return {
        etapa_id: etapa.etapa_id,
        tempo_total_segundos: Math.round(totalSegundos),
        tempo_total_minutos: Number((totalSegundos / 60).toFixed(2)),
        tempo_planejado_minutos: etapa.tempo_planejado,
        em_andamento: emAndamento,
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
