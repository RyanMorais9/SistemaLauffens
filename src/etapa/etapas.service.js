const etapasRepository = require("./etapas.repository");
const notificacoesService = require("../notificacao/notificacoes.service");

const tiposEtapa = ["Corte", "Fitagem", "Refinamento", "Embalamento"];
const camposPlanejamento = ["tipo", "tempo_planejado"];

function erroHttp(status, mensagem) {
    const error = new Error(mensagem);
    error.status = status;
    return error;
}

function validarId(id, nome = "ID da etapa") {
    if (!["string", "number"].includes(typeof id) || !/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
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
    if (typeof tempo !== "number" || !Number.isFinite(tempo) || tempo < 0.6 || tempo > 600000
        || Math.abs(tempo * 100 - Math.round(tempo * 100)) > 0.000001) {
        throw erroHttp(400, "tempo_planejado deve conter de 0,6 a 600000 minutos, com no máximo duas casas decimais (0,01 a 10000 horas).");
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
    // Todas as operações bloqueiam primeiro o projeto e depois a etapa.
    // Isso evita disputa de bloqueios com cancelamento e alteração da equipe.
    if (transaction) {
        const encontrada = await etapasRepository.buscarPorId(id, undefined, { transaction });
        if (!encontrada) throw erroHttp(404, "Etapa não encontrada.");
        await etapasRepository.buscarProjetoPorId(encontrada.proj_id, { transaction, lock: transaction.LOCK.UPDATE });
    }
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

    return etapasRepository.iniciarTransacao(async (transaction) => {
        await exigirProjetoAtivo({ proj_id: projId }, transaction);
        return etapasRepository.cadastrar({
            proj_id: projId,
            tipo: dados.tipo,
            status: "Planejada",
            tempo_planejado: dados.tempo_planejado,
        }, { transaction });
    });
}

function calcularTempo(execucoes, agora = Date.now(), inicioPeriodo = -Infinity, fimPeriodo = Infinity) {
    let total = 0;
    for (const execucao of execucoes) {
        const inicio = new Date(execucao.data_inicio).getTime();
        const fim = execucao.data_fim == null ? agora : new Date(execucao.data_fim).getTime();
        if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) {
            throw erroHttp(409, "Período de execução inválido.");
        }
        total += Math.max(0, Math.min(fim, fimPeriodo) - Math.max(inicio, inicioPeriodo));
    }
    return total / 1000;
}

function validarPeriodo(data, nome, fim = false) {
    if (data === undefined) return fim ? Infinity : -Infinity;
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw erroHttp(400, `${nome} deve estar no formato AAAA-MM-DD.`);
    }
    const timestamp = Date.parse(`${data}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== data) {
        throw erroHttp(400, `${nome} inválida.`);
    }
    return fim ? timestamp + 86400000 : timestamp;
}

async function listar(projId, filtros = {}) {
    const id = projId === undefined ? undefined : validarId(projId, "proj_id");
    const inicio = validarPeriodo(filtros.data_inicio, "data_inicio");
    const fim = validarPeriodo(filtros.data_fim, "data_fim", true);
    if (inicio >= fim) throw erroHttp(400, "O período final deve ser igual ou posterior ao inicial.");
    if (filtros.ordem !== undefined && !["asc", "desc"].includes(filtros.ordem)) {
        throw erroHttp(400, "ordem deve ser asc ou desc.");
    }
    if (filtros.ordenar_por !== undefined && !["tempo", "data_inicio"].includes(filtros.ordenar_por)) {
        throw erroHttp(400, "ordenar_por deve ser tempo ou data_inicio.");
    }
    if (filtros.porte !== undefined && !["Pequeno", "Médio", "Grande"].includes(filtros.porte)) {
        throw erroHttp(400, "Porte inválido.");
    }
    const etapas = await etapasRepository.listarComExecucoes(id);
    const agora = Date.now();
    const resultado = [];
    for (const item of etapas) {
        const etapa = item.toJSON();
        if (filtros.porte && etapa.projeto.porte !== filtros.porte) continue;
        const execucoes = etapa.execucao;
        if ((inicio !== -Infinity || fim !== Infinity) && !execucoes.some((execucao) =>
            new Date(execucao.data_inicio).getTime() < fim
            && (execucao.data_fim == null ? agora : new Date(execucao.data_fim).getTime()) > inicio)) continue;
        const total = calcularTempo(execucoes, agora);
        delete etapa.execucao;
        resultado.push({ ...etapa,
            tempo_planejado: Number(etapa.tempo_planejado),
            tempo_total_segundos: total,
            tempo_total_minutos: Number((total / 60).toFixed(2)),
            tempo_periodo_segundos: calcularTempo(execucoes, agora, inicio, fim),
            excedeu_planejamento: total > Number(etapa.tempo_planejado) * 60,
        });
    }
    if (filtros.ordenar_por) {
        const sinal = filtros.ordem === "desc" ? -1 : 1;
        resultado.sort((a, b) => {
            const valorA = filtros.ordenar_por === "tempo" ? a.tempo_periodo_segundos : (a.data_inicio ? new Date(a.data_inicio).getTime() : Infinity);
            const valorB = filtros.ordenar_por === "tempo" ? b.tempo_periodo_segundos : (b.data_inicio ? new Date(b.data_inicio).getTime() : Infinity);
            return (valorA === valorB ? 0 : (valorA < valorB ? -1 : 1)) * sinal || a.etapa_id - b.etapa_id;
        });
    }
    return resultado;
}

async function listarPorProjeto(projId, filtros = {}) {
    const id = validarId(projId, "proj_id");
    const projeto = await etapasRepository.buscarProjetoPorId(id);
    if (!projeto) {
        throw erroHttp(404, "Projeto não encontrado.");
    }
    return listar(id, filtros);
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
        await exigirProjetoAtivo(etapa, transaction);
        if (etapa.status !== "Planejada") {
            throw erroHttp(409, "Só é possível editar o planejamento de uma etapa planejada.");
        }
        await etapasRepository.atualizar(etapaId, dados, { transaction });
        return etapasRepository.buscarPorId(etapaId, undefined, { transaction });
    });
}

async function exigirProjetoAtivo(etapa, transaction) {
    const projeto = await etapasRepository.buscarProjetoPorId(etapa.proj_id, {
        transaction, lock: transaction.LOCK.UPDATE,
    });
    if (!projeto) throw erroHttp(404, "Projeto não encontrado.");
    if (["Concluído", "Cancelado"].includes(projeto.status) || projeto.data_fim) {
        throw erroHttp(409, "O projeto está concluído, cancelado ou com a produção encerrada.");
    }
    return projeto;
}

async function exigirSequencia(etapa, transaction) {
    const etapas = await etapasRepository.listar(etapa.proj_id, { transaction });
    const anteriores = tiposEtapa.slice(0, tiposEtapa.indexOf(etapa.tipo));
    if (anteriores.some((tipo) => !etapas.some((item) => item.tipo === tipo && item.status === "Concluída"))) {
        throw erroHttp(409, "Conclua as etapas anteriores antes de executar esta etapa.");
    }
    if (etapas.some((item) => item.etapa_id !== etapa.etapa_id && ["Em andamento", "Pausada"].includes(item.status))) {
        throw erroHttp(409, "Outra etapa do projeto ainda está em execução.");
    }
}

async function exigirFuncionarios(projId, transaction) {
    const participantes = await etapasRepository.listarParticipantes(projId, {
        transaction, lock: transaction.LOCK.SHARE,
    });
    if (!participantes.length) {
        throw erroHttp(409, "Vincule ao menos um funcionário ao projeto antes de executar ou concluir as etapas.");
    }
    return participantes;
}

async function finalizarProjetoSeCompleto(projeto, transaction) {
    const etapas = await etapasRepository.listar(projeto.proj_id, { transaction });
    if (!tiposEtapa.every((tipo) => etapas.some((item) => item.tipo === tipo && item.status === "Concluída"))) {
        return { concluido: false, producao_encerrada: false };
    }
    const fimProducao = new Date(Math.max(...etapas.map((etapa) => new Date(etapa.data_fim).getTime())));
    if (!Number.isFinite(fimProducao.getTime())) throw erroHttp(409, "Data final das etapas inválida.");
    const participantes = await exigirFuncionarios(projeto.proj_id, transaction);
    await projeto.update({ data_fim: fimProducao }, { transaction });
    const execucoes = await etapasRepository.listarExecucoesProjeto(projeto.proj_id, { transaction });
    let duracao = 0;
    for (const execucao of execucoes) {
        if (!execucao.data_fim) throw erroHttp(409, "Ainda existe uma execução aberta no projeto.");
        const periodo = new Date(execucao.data_fim) - new Date(execucao.data_inicio);
        if (!Number.isFinite(periodo) || periodo < 0) throw erroHttp(409, "Período de execução inválido.");
        duracao += periodo;
    }
    if (participantes.some((item) => !Number.isFinite(Number(item.custo_hora_referencia)) || Number(item.custo_hora_referencia) <= 0)) {
        return { concluido: false, producao_encerrada: true, motivo: "Referência de custo dos funcionários inválida." };
    }
    const custoHora = participantes.reduce((total, item) => total + Number(item.custo_hora_referencia), 0);
    const custo = Number((duracao / 3600000 * custoHora).toFixed(2));
    if (projeto.valor_base == null) {
        return { concluido: false, producao_encerrada: true, motivo: "Informe o valor-base para finalizar o projeto." };
    }
    const base = Number(projeto.valor_base);
    const total = Number((base + custo).toFixed(2));
    if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(custo) || custo < 0 || custo > 9999999.99 || total > 9999999.99) {
        return { concluido: false, producao_encerrada: true, motivo: "Os valores calculados não cabem nos limites financeiros do projeto." };
    }
    await projeto.update({ status: "Concluído", data_fim: fimProducao,
        custo_mao_de_obra_final: custo, valor_final: total }, { transaction });
    return { concluido: true, producao_encerrada: true };
}

async function finalizarProjeto(projId) {
    const id = validarId(projId, "proj_id");
    return etapasRepository.iniciarTransacao(async (transaction) => {
        const projeto = await etapasRepository.buscarProjetoPorId(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!projeto) throw erroHttp(404, "Projeto não encontrado.");
        if (projeto.status === "Cancelado") throw erroHttp(409, "O projeto está cancelado.");
        if (projeto.status === "Concluído") return projeto;
        const resultado = await finalizarProjetoSeCompleto(projeto, transaction);
        if (!resultado.producao_encerrada) throw erroHttp(409, "Conclua todas as etapas antes de finalizar o projeto.");
        if (!resultado.concluido) throw erroHttp(409, resultado.motivo);
        return projeto;
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
        const projeto = await exigirProjetoAtivo(etapa, transaction);
        await exigirFuncionarios(etapa.proj_id, transaction);
        await exigirSequencia(etapa, transaction);
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

        await exigirProjetoAtivo(etapa, transaction);
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
        await exigirProjetoAtivo(etapa, transaction);
        await exigirFuncionarios(etapa.proj_id, transaction);
        await exigirSequencia(etapa, transaction);
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
        const projeto = await exigirProjetoAtivo(etapa, transaction);
        await exigirFuncionarios(etapa.proj_id, transaction);
        await exigirSequencia(etapa, transaction);
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
            { status: "Concluída", data_fim: agora,
                tempo_total_segundos: calcularTempo(await etapasRepository.listarExecucoes(etapaId, { transaction }), agora.getTime()) },
            { transaction }
        );
        const finalizacao = await finalizarProjetoSeCompleto(projeto, transaction);
        const resultado = await etapasRepository.buscarPorId(etapaId, undefined, { transaction });
        await notificacoesService.gerarNotificacoesEtapaConcluida(resultado, transaction);
        return { ...resultado.toJSON(), finalizacao_projeto: finalizacao };
    });
}

async function consultarTempo(id) {
    const etapaId = validarId(id);
    const etapa = await exigirEtapa(etapaId);
    const execucoes = await etapasRepository.listarExecucoes(etapaId);
    const agora = Date.now();
    const totalSegundos = calcularTempo(execucoes, agora);
    return {
        etapa_id: etapa.etapa_id,
        tempo_total_segundos: totalSegundos,
        tempo_total_minutos: Number((totalSegundos / 60).toFixed(2)),
        tempo_planejado_minutos: Number(etapa.tempo_planejado),
        excedeu_planejamento: totalSegundos > Number(etapa.tempo_planejado) * 60,
        em_andamento: execucoes.some((execucao) => execucao.data_fim == null),
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
    finalizarProjeto,
    validarTempoPlanejado,
    calcularTempo,
    validarPeriodo,
};
