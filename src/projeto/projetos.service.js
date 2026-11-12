const projetoRepository = require("../../src/projeto/projetos.repository.js");

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarDados(dados, edicao = false) {
    const resultado = {};

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
        if (!portesValidos.includes(dados.porte)) return erroDeValidacao("Este porte não é valido");
        resultado.porte = dados.porte;
    }
    if (!edicao) {
        if (!Number.isSafeInteger(dados.cliente_id) || dados.cliente_id <= 0) return erroDeValidacao("O id do cliente é um inteiro positivo");

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

    if (!edicao || dados.valor_base !== undefined) {
        const validarValorBase = validarValorMonetario(dados.valor_base)
        resultado.valor_base = validarValorBase;
    }

    if (edicao && Object.keys(resultado).length === 0) {
        erroDeValidacao("Precisa de no minimo um campo para editar")
    }
    return resultado;
}

async function cadastrar(dados, criadoPorId) {
    const dadosValidados = validarDados(dados);
    dadosValidados.criado_por_id = criadoPorId;
    dadosValidados.status = "Planejado";
    return projetoRepository.cadastrar(dadosValidados);
}

async function buscarPorId(id) {
    return projetoRepository.buscarPorId(id);
}

async function listar(filtros = {}) {
    const { status, porte } = filtros;

    if (status !== undefined) {
        const statusValidos = [
            "Planejado",
            "Em andamento",
            "Atrasado",
            "Cancelado",
            "Concluído"
        ];
        if (!statusValidos.includes(status)) {
            erroDeValidacao("Satus inválido")
        }
    }

    if (porte !== undefined) {
        const porteValidado = ["Pequeno", "Médio", "Grande"];
        if (!porteValidado.includes(porte)) {
            erroDeValidacao("Porte inválido");
        }
    }

    return projetoRepository.listar({ status, porte });
}

async function editar(id, dados) {
    const dadosValidados = validarDados(dados, true);
    const result = await projetoRepository.buscarPorId(id);
    if (!result) return null;
    if (dadosValidados.valor_base !== undefined && result.status !== "Planejado") {
        erroDeValidacao("O valor base não pode mais ser alterado")
    }
    return projetoRepository.editar(id, dadosValidados);
}

async function registrarVB(id, valor) { //VB = valor base
    const result = await projetoRepository.buscarPorId(id);
    if (!result) return null;
    if (result.status !== "Planejado") {
        erroDeValidacao("O valor base não pode mais ser alterado")
    }
    const dadosValidados = validarDados({ valor_base: valor }, true);
    return projetoRepository.registrarVB(id, dadosValidados.valor_base);
}

async function gerenciarStatus(id, novoStatus) {
    const result = await projetoRepository.buscarPorId(id);
    if (!result) return null;
    const statusValidos = ['Planejado', 'Em andamento', 'Atrasado', 'Cancelado', 'Concluído'];
    if (!statusValidos.includes(novoStatus)) {
        erroDeValidacao("Status invalido");
    }
    const alteracoes = { status: novoStatus };
    if (result.status === "Concluído" && novoStatus !== "Concluído") {
        alteracoes.data_fim = null;
    }
    return projetoRepository.gerenciarStatus(id, alteracoes)
}

function validarDataHora(texto){
    if (typeof texto !== "string") {
        erroDeValidacao("O formato esta incorreto");
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(texto)) {
        erroDeValidacao("O formato não esta correto");
    }

    const [ano, mes, dia] = texto.split("T")[0].split("-").map(Number);

    if (ano < 1 || mes < 1 || mes > 12) {
        erroDeValidacao("Data inválida");
    }

    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    const diaPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (dia < 1 || dia > diaPorMes[mes - 1]) { erroDeValidacao("Data inválida"); }

    const [hora, min, seg] = texto.split("T")[1].slice(0, 8).split(":").map(Number);
    if (hora < 0 || hora > 23 || min < 0 || min > 59 || seg < 0 || seg > 59) {
        erroDeValidacao("O horário digitado não existe");
    }

    const dataValidada = new Date(texto);
    if (Number.isNaN(dataValidada.getTime())) {
        erroDeValidacao("A data é inválida")
    }

    return dataValidada;
}

async function registrarInicio(id, inicio) {
    const result = await projetoRepository.buscarPorId(id);
    if (!result) return null;
    if (result.data_inicio != null) {
        erroDeValidacao("O projeto ja foi iniciado");
    }
    if (result.status !== "Planejado") {
        erroDeValidacao("Só é possível iniciar um projeto planejado.");
    }
    const dataInicio = validarDataHora(inicio);

    return projetoRepository.registrarInicio(id, dataInicio);

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

async function finalizar(id, dataFim, custoMaoDeObra, valorFinal) {
    const result = await projetoRepository.buscarPorId(id);
    if (!result) return null;
    if (result.data_inicio == null) {
        erroDeValidacao("Não tem data de inicio");
    }
    if (result.status !== "Em andamento" && result.status !== "Atrasado") {
        erroDeValidacao("O projeto não pode ser finalizado");
    }

    const dataFinal = validarDataHora(dataFim);
    const dataInicio = new Date(result.data_inicio);
    if(dataFinal < dataInicio){
        erroDeValidacao("A data final não pode ser menor que a data de inicio");
    }

    const custoMaoDeObraValidado = validarValorMonetario(custoMaoDeObra);
    const custoValorFinalValidado = validarValorMonetario(valorFinal);

    return projetoRepository.finalizar(id, dataFinal, custoMaoDeObraValidado, custoValorFinalValidado);
}   

module.exports = {
    cadastrar,
    buscarPorId,
    listar,
    editar,
    registrarVB,
    gerenciarStatus,
    registrarInicio,
    finalizar
};