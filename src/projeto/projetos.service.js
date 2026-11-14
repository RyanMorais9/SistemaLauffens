const projetoRepository = require("./projetos.repository.js");
const etapasService = require("../etapa/etapas.service.js");
const etapasRepository = require("../etapa/etapas.repository.js");

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarDados(dados, edicao = false) {
    const resultado = {};
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        erroDeValidacao("Envie um objeto com os dados do projeto.");
    }
    const permitidos = edicao ? ["nome", "porte", "prazo_planejado", "valor_base"]
        : ["nome", "porte", "cliente_id", "prazo_planejado", "valor_base", "etapas"];
    const desconhecidos = Object.keys(dados).filter(campo => !permitidos.includes(campo));
    if (desconhecidos.length) erroDeValidacao(`Campos não permitidos: ${desconhecidos.join(", ")}`);

    if (!edicao || dados.nome !== undefined) {
        if (typeof dados.nome !== "string" || !dados.nome.trim()) {
            erroDeValidacao("O nome é obrigatório");
        }
        resultado.nome = dados.nome.trim();
        if (resultado.nome.length > 120) {
            erroDeValidacao("O nome deve ter no maximo 120 caracteres");
        }
    }
    if (!edicao || dados.porte !== undefined) {
        const portesValidos = ['Pequeno', 'Médio', 'Grande'];
        if (!portesValidos.includes(dados.porte)) erroDeValidacao("Este porte não é valido");
        resultado.porte = dados.porte;
    }
    if (!edicao) {
        if (!Number.isSafeInteger(dados.cliente_id) || dados.cliente_id <= 0) return erroDeValidacao("O id do cliente tem que ser um inteiro positivo");

        resultado.cliente_id = dados.cliente_id;
    }
    if (!edicao || dados.prazo_planejado !== undefined) {
        if (typeof dados.prazo_planejado !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dados.prazo_planejado)) {
            erroDeValidacao("O prazo deve estar no formato AAAA-MM-DD.");
        }

        const hoje = new Date();
        const anoAtual = new Date().getFullYear();
        const mesAtual = hoje.getMonth() + 1;
        const diaAtual = hoje.getDate();


        const [ano, mes, dia] = dados.prazo_planejado.split("-").map(Number);
        if (ano < anoAtual || (ano === anoAtual && mes < mesAtual) || (ano === anoAtual && mes === mesAtual && dia < diaAtual)) {
            erroDeValidacao("O prazo não pode ser anterior ao dia de hoje");
        }

        if (ano < 1 || mes < 1 || mes > 12) {
            erroDeValidacao("Prazo inválido");
        }

        const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
        const diaPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (dia < 1 || dia > diaPorMes[mes - 1]) { erroDeValidacao("Prazo inválido"); }
        resultado.prazo_planejado = dados.prazo_planejado;
    }

    if (dados.valor_base !== undefined) {
        const validarValorBase = validarValorMonetario(dados.valor_base)
        resultado.valor_base = validarValorBase;
    }

    if (edicao && Object.keys(resultado).length === 0) {
        erroDeValidacao("Precisa de no minimo um campo para editar")
    }
    return resultado;
}

function validarValorMonetario(valor){
    if(!Number.isFinite(valor)){
        erroDeValidacao("Valor inválido");
    }
    if(valor <= 0 || valor > 9999999.99){
        erroDeValidacao("Valor inválido");
    }
    if(Number(valor.toFixed(2)) !== valor){
        erroDeValidacao("O valor pode conter no maximo 2 casas decimais")
    }

    return valor;
}

function erroDeConflito(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 409;
    throw erro;
}

function validarId(id) {
    if (!["number", "string"].includes(typeof id) || !/^\d+$/.test(String(id))
        || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647) {
        erroDeValidacao("ID inválido");
    }
    return Number(id);
}

function validarPlanejamento(etapas) {
    const tipos = ["Corte", "Fitagem", "Refinamento", "Embalamento"];
    if (!Array.isArray(etapas) || etapas.length !== tipos.length) {
        erroDeValidacao("Informe o planejamento de Corte, Fitagem, Refinamento e Embalamento.");
    }
    const encontrados = new Set();
    return etapas.map(item => {
        if (!item || typeof item !== "object" || Array.isArray(item)
            || Object.keys(item).some(campo => !["tipo", "tempo_planejado"].includes(campo))) {
            erroDeValidacao("Cada etapa deve conter somente tipo e tempo_planejado.");
        }
        if (!tipos.includes(item.tipo) || encontrados.has(item.tipo)) {
            erroDeValidacao("Informe cada tipo de etapa uma única vez.");
        }
        etapasService.validarTempoPlanejado(item.tempo_planejado);
        encontrados.add(item.tipo);
        return { tipo: item.tipo, tempo_planejado: item.tempo_planejado, status: "Planejada" };
    });
}

function incluirTempos(projeto, agora = Date.now(), inicio = -Infinity, fim = Infinity) {
    const resultado = projeto.toJSON();
    const tipos = ["Corte", "Fitagem", "Refinamento", "Embalamento"];
    let total = 0;
    let totalPeriodo = 0;
    let planejado = 0;
    let excedeu = false;
    let possuiPeriodo = false;
    resultado.etapas = (resultado.etapa || []).map(item => {
        const execucoes = item.execucao || [];
        const segundos = etapasService.calcularTempo(execucoes, agora);
        const periodo = etapasService.calcularTempo(execucoes, agora, inicio, fim);
        total += segundos;
        totalPeriodo += periodo;
        planejado += Number(item.tempo_planejado);
        const excedeuEtapa = segundos > Number(item.tempo_planejado) * 60;
        excedeu = excedeu || excedeuEtapa;
        possuiPeriodo = possuiPeriodo || execucoes.some(execucao =>
            new Date(execucao.data_inicio).getTime() < fim
            && (execucao.data_fim == null ? agora : new Date(execucao.data_fim).getTime()) > inicio);
        delete item.execucao;
        return { ...item, tempo_planejado: Number(item.tempo_planejado), tempo_total_segundos: segundos,
            tempo_total_minutos: Number((segundos / 60).toFixed(2)), tempo_periodo_segundos: periodo,
            excedeu_planejamento: excedeuEtapa };
    }).sort((a, b) => tipos.indexOf(a.tipo) - tipos.indexOf(b.tipo));
    delete resultado.etapa;
    const atual = resultado.etapas.find(item => ["Em andamento", "Pausada"].includes(item.status));
    resultado.etapa_atual = atual ? { etapa_id: atual.etapa_id, tipo: atual.tipo, status: atual.status } : null;
    resultado.tempo_total_segundos = total;
    resultado.tempo_total_minutos = Number((total / 60).toFixed(2));
    resultado.tempo_periodo_segundos = totalPeriodo;
    resultado.tempo_planejado_minutos = planejado;
    const hoje = new Date(agora);
    const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const prazoVencido = resultado.data_fim == null && resultado.prazo_planejado < dataHoje;
    resultado.excedeu_planejamento = excedeu || total > planejado * 60 || prazoVencido;
    if (!["Concluído", "Cancelado"].includes(resultado.status)) {
        resultado.status = resultado.excedeu_planejamento ? "Atrasado"
            : (resultado.data_inicio ? "Em andamento" : "Planejado");
    }
    return { dados: resultado, possuiPeriodo };
}

async function cadastrar(dados, criadoPorId) {
    const dadosValidados = validarDados(dados);
    const planejamento = validarPlanejamento(dados.etapas);
    dadosValidados.criado_por_id = validarId(criadoPorId);
    dadosValidados.status = "Planejado";
    const id = await projetoRepository.iniciarTransacao(async transaction => {
        const cliente = await projetoRepository.buscarClientePorId(dadosValidados.cliente_id, {
            transaction, lock: transaction.LOCK.SHARE,
        });
        if (!cliente) {
            const erro = new Error("Cliente não encontrado");
            erro.status = 404;
            throw erro;
        }
        const projeto = await projetoRepository.cadastrar(dadosValidados, { transaction });
        await projetoRepository.cadastrarEtapas(planejamento.map(item => ({ ...item, proj_id: projeto.proj_id })), { transaction });
        return projeto.proj_id;
    });
    return buscarPorId(id);
}

async function buscarPorId(id) {
    const projeto = await projetoRepository.buscarAcompanhamento(validarId(id));
    return projeto ? incluirTempos(projeto).dados : null;
}

async function listar(filtros = {}) {
    const { status, porte, ordenar_por, ordem } = filtros;
    if (status !== undefined && !["Planejado", "Em andamento", "Atrasado", "Cancelado", "Concluído"].includes(status)) {
        erroDeValidacao("Status inválido");
    }
    if (porte !== undefined && !["Pequeno", "Médio", "Grande"].includes(porte)) erroDeValidacao("Porte inválido");
    if (ordenar_por !== undefined && !["tempo", "data_inicio"].includes(ordenar_por)) erroDeValidacao("ordenar_por deve ser tempo ou data_inicio.");
    if (ordem !== undefined && !["asc", "desc"].includes(ordem)) erroDeValidacao("ordem deve ser asc ou desc.");
    const inicio = etapasService.validarPeriodo(filtros.data_inicio, "data_inicio");
    const fim = etapasService.validarPeriodo(filtros.data_fim, "data_fim", true);
    if (inicio >= fim) erroDeValidacao("O período final deve ser igual ou posterior ao inicial.");
    const projetos = await projetoRepository.listar({ porte });
    const agora = Date.now();
    const resultado = [];
    for (const projeto of projetos) {
        const resumo = incluirTempos(projeto, agora, inicio, fim);
        if (status && resumo.dados.status !== status) continue;
        if ((inicio !== -Infinity || fim !== Infinity) && !resumo.possuiPeriodo) continue;
        resultado.push(resumo.dados);
    }
    if (ordenar_por) {
        resultado.sort((a, b) => {
            const valorA = ordenar_por === "tempo" ? a.tempo_periodo_segundos : (a.data_inicio ? new Date(a.data_inicio).getTime() : Infinity);
            const valorB = ordenar_por === "tempo" ? b.tempo_periodo_segundos : (b.data_inicio ? new Date(b.data_inicio).getTime() : Infinity);
            return (valorA === valorB ? 0 : (valorA < valorB ? -1 : 1)) * (ordem === "desc" ? -1 : 1) || a.proj_id - b.proj_id;
        });
    }
    return resultado;
}

async function editar(id, dados) {
    const idValidado = validarId(id);
    const dadosValidados = validarDados(dados, true);
    return projetoRepository.iniciarTransacao(async transaction => {
        const result = await projetoRepository.buscarPorId(idValidado, { transaction, lock: transaction.LOCK.UPDATE });
        if (!result) return null;
        if (["Concluído", "Cancelado"].includes(result.status)) erroDeConflito("O projeto concluído ou cancelado não pode ser editado.");
        if (dadosValidados.valor_base !== undefined && result.valor_base != null && result.data_inicio) {
            erroDeConflito("O valor-base já informado não pode ser alterado após o início da produção.");
        }
        return projetoRepository.editar(idValidado, dadosValidados, { transaction });
    });
}

async function registrarVB(id, valor) { //VB = valor base
    if (valor === undefined) erroDeValidacao("Informe o valor-base.");
    return editar(id, { valor_base: valor });
}

async function gerenciarStatus(id, novoStatus) {
    const idValidado = validarId(id);
    const statusValidos = ["Planejado", "Em andamento", "Atrasado", "Cancelado"];
    if (novoStatus === "Concluído") erroDeValidacao("O projeto é concluído pelo encerramento das etapas e pelo cálculo dos valores finais.");
    if (!statusValidos.includes(novoStatus)) erroDeValidacao("Status inválido");
    return projetoRepository.iniciarTransacao(async transaction => {
        const result = await projetoRepository.buscarPorId(idValidado, { transaction, lock: transaction.LOCK.UPDATE });
        if (!result) return null;
        if (["Concluído", "Cancelado"].includes(result.status)) erroDeConflito("Projetos concluídos ou cancelados não podem mudar de status.");
        const etapas = await etapasRepository.listar(idValidado, { transaction });
        const execucoes = await etapasRepository.listarExecucoesProjeto(idValidado, { transaction });
        const resumo = incluirTempos({ toJSON: () => ({
            ...result.toJSON(),
            etapa: etapas.map(item => ({ ...item.toJSON(), execucao: execucoes.filter(execucao => execucao.etapa_id === item.etapa_id) })),
        }) });
        if (novoStatus === "Planejado" && (result.data_inicio || execucoes.length)) {
            erroDeConflito("Um projeto com execução registrada não pode voltar a planejado.");
        }
        if (novoStatus === "Em andamento" && (!result.data_inicio || result.data_fim)) {
            erroDeConflito("O início é registrado automaticamente pela primeira etapa.");
        }
        if (["Planejado", "Em andamento"].includes(novoStatus) && resumo.dados.excedeu_planejamento) {
            erroDeConflito("O prazo ou tempo planejado foi excedido. Corrija o planejamento antes de remover o atraso.");
        }
        if (novoStatus === "Atrasado") {
            if (!resumo.dados.excedeu_planejamento) erroDeConflito("O projeto ainda não ultrapassou o prazo ou o tempo planejado.");
        }
        if (novoStatus === "Cancelado") {
            const agora = new Date();
            for (const etapa of etapas) {
                const execucao = await etapasRepository.buscarExecucaoAberta(etapa.etapa_id, { transaction });
                if (execucao) await etapasRepository.encerrarExecucao(execucao.execucao_id, agora, "Pausa", { transaction });
                if (execucao || etapa.status === "Em andamento") {
                    await etapasRepository.atualizar(etapa.etapa_id, { status: "Pausada" }, { transaction });
                }
            }
        }
        return projetoRepository.gerenciarStatus(idValidado, { status: novoStatus }, { transaction });
    });
}

module.exports = {
    cadastrar,
    buscarPorId,
    listar,
    editar,
    registrarVB,
    gerenciarStatus
};
