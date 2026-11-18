const manutencaoRepository = require("./manutencoes.repository.js");

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarID(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
        erroDeValidacao("Id inválido");
    }
    return id;
}

function validarData(data, campo) {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        erroDeValidacao(`${campo} deve estar no formato AAAA-MM-DD`)
    }
    const dataConvertida = new Date(`${data}T00:00:00Z`);

    if (!Number.isFinite(dataConvertida.getTime()) || dataConvertida.toISOString().slice(0, 10) !== data) {
        erroDeValidacao(`${campo} deve ser uma data válida`);
    }
    return data;
}

async function cadastrar(dados) {
    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
        erroDeValidacao("Dados da manutenção inválidos")
    }
    const camposPermitidos = {
        proj_id: dados.proj_id,
        data_retorno: dados.data_retorno,
        motivo: dados.motivo,
        descricao: dados.descricao
    }
    const camposInvalidos = Object.keys(dados).filter(campo => !Object.keys(camposPermitidos).includes(campo));
    if (camposInvalidos.length > 0) {
        erroDeValidacao("Campos não permitidos");
    }

    const idProjeto = validarID(camposPermitidos.proj_id);
    const projetoFound = await manutencaoRepository.buscarProjetoPorId(idProjeto);
    if (!projetoFound) {
        const erro = Error("Projeto não encontrado")
        erro.status = 404;
        throw erro;
    }
    const dataValidada = validarData(camposPermitidos.data_retorno, "data_retorno");
    const motivosPermitidos = ["Ajuste", "Reparo", "Defeito", "Problema na instalação", "Outro"];
    if (!motivosPermitidos.includes(camposPermitidos.motivo)) {
        erroDeValidacao("Motivo inválido");
    }
    if (typeof camposPermitidos.descricao !== "string" || !camposPermitidos.descricao.trim()) {
        erroDeValidacao("Descrição deve ser um texto não vazio")
    }
    const camposValidados = {
        proj_id: idProjeto,
        data_retorno: dataValidada,
        motivo: camposPermitidos.motivo,
        descricao: camposPermitidos.descricao.trim(),
        status: "Aberta",
        data_conclusao: null
    }
    return manutencaoRepository.cadastrar(camposValidados);
}

async function listar(filtros = {}) {
    if (typeof filtros !== "object" || filtros === null || Array.isArray(filtros)) {
        erroDeValidacao("Filtros invalidos");
    }
    const camposPermitidos = ["proj_id", "status"];
    const camposInvalidos = Object.keys(filtros).filter(
        campo => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        erroDeValidacao("Filtros não permitidos");
    }
    const filtrosValidos = {};
    if (filtros.proj_id !== undefined) {
        filtrosValidos.proj_id = validarID(filtros.proj_id);
    }
    if (filtros.status !== undefined) {
        const statusPermitidos = ["Aberta", "Resolvida"];
        if (!statusPermitidos.includes(filtros.status)) {
            erroDeValidacao("Status inválido");
        }
        filtrosValidos.status = filtros.status;
    }
    return manutencaoRepository.listar(filtrosValidos);
}

async function buscarPorId(id) {
    const idValidado = validarID(id);
    const manutencaoFound = await manutencaoRepository.buscarPorId(idValidado);
    if (!manutencaoFound) {
        const erro = new Error("Manutenção não encontrada");
        erro.status = 404;
        throw erro;
    }
    return manutencaoFound;
}

async function editar(id, dados) {
    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
        erroDeValidacao("Dados invalidos");
    }
    const idValidado = validarID(id);
    const dadosPermitidos = ["data_retorno", "motivo", "descricao"];
    const dadosInvalidos = Object.keys(dados).filter(campo => !dadosPermitidos.includes(campo));

    if (dadosInvalidos.length > 0) {
        erroDeValidacao("Dados não permitidos")
    }
    if (Object.keys(dados).length === 0) {
        erroDeValidacao("Pelo menos um campo é necessário para a edição");
    }
    const manutencaoFound = await manutencaoRepository.buscarPorId(idValidado);
    if (!manutencaoFound) {
        const erro = new Error("Manutenção não encontrada")
        erro.status = 404;
        throw erro;
    }
    const dadosValidados = {};
    if (dados.data_retorno !== undefined) {
        dadosValidados.data_retorno = validarData(dados.data_retorno, "data_retorno");
    }
    if (dados.motivo !== undefined) {
        const motivosPermitidos = ["Ajuste", "Reparo", "Defeito", "Problema na instalação", "Outro"];
        if (!motivosPermitidos.includes(dados.motivo)) {
            erroDeValidacao("Motivo inválido");
        }
        dadosValidados.motivo = dados.motivo;
    }
    if (dados.descricao !== undefined) {
        if (typeof dados.descricao !== "string" || !dados.descricao.trim()) {
            erroDeValidacao("descrição deve ser um texto não vazio");
        }
        dadosValidados.descricao = dados.descricao.trim();
    }

    if (dados.data_retorno !== undefined && manutencaoFound.data_conclusao !== null && dadosValidados.data_retorno > manutencaoFound.data_conclusao) {
        erroDeValidacao("A data de retorno não pode ser posterior à conclusão");
    }
    const manutencaoAtualizada = await manutencaoRepository.editar(idValidado, dadosValidados);
    if (!manutencaoAtualizada) {
        const erro = new Error("Manutenção não encontrada");
        erro.status = 404;
        throw erro;
    }
    return manutencaoAtualizada;
}

async function resolver(id, dados) {
    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
        erroDeValidacao("Dados invalidos");
    }
    const idValidado = validarID(id);
    const dadosPermitidos = ["data_conclusao"];
    const dadosInvalidos = Object.keys(dados).filter(campo => !dadosPermitidos.includes(campo));

    if (dadosInvalidos.length > 0) {
        erroDeValidacao("Dados não permitidos");
    }
    const manutencaoFound = await manutencaoRepository.buscarPorId(idValidado);
    if (!manutencaoFound) {
        const erro = new Error("Manutenção não encontrada")
        erro.status = 404;
        throw erro;
    }
    if (manutencaoFound.status === "Resolvida") {
        const erro = new Error("Manutenção ja resolvida");
        erro.status = 409;
        throw erro;
    }
    const dataValidada = validarData(dados.data_conclusao, "data_conclusao")

    if (dataValidada < manutencaoFound.data_retorno){
        const erro = new Error("A data de conclusão não pode ser anterior à data de retorno");
        erro.status = 400;
        throw erro; 
    }
    const dadosValidados = {
        status: "Resolvida",
        data_conclusao: dataValidada
    }
    const manutencaoResolvida = await manutencaoRepository.resolver(idValidado, dadosValidados);
    if(!manutencaoResolvida){
        const erro = new Error("Manutencao não encontrada");
        erro.status = 404;
        throw erro;
    }
    return manutencaoResolvida;
}

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    editar,
    resolver
}
