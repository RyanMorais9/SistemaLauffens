const projeto = require("../../database/models/projeto.model.js");

async function cadastrar(dados){
    return projeto.create(dados);
}

async function buscarPorId(id) {
    return projeto.findByPk(id);
}

async function listar(filtros = {}) {
    const where = {};

    if(filtros.status !== undefined){
        where.status = filtros.status;
    }
    if(filtros.porte !== undefined){
        where.porte = filtros.porte;
    }

    return projeto.findAll({where, order: [["proj_id", "ASC"]]});
}

async function editar(id, dados) {
    const projetoFound = await projeto.findByPk(id);
    if(!projetoFound) return null;
    return projetoFound.update(dados);
}

async function registrarVB(id, valor) { //VB = valor base
    const projetoFound = await projeto.findByPk(id);
    if(!projetoFound) return null;
    return projetoFound.update({valor_base: valor});
}

async function gerenciarStatus(id, alteracoes) {
    const projetoFound = await projeto.findByPk(id);
    if(!projetoFound) return null;
    return projetoFound.update(alteracoes)
}

async function registrarInicio(id, inicio) {
    const projetoFound = await projeto.findByPk(id);
    if(!projetoFound) return null;

    if(projetoFound.data_inicio !== null) return projetoFound;
    return projetoFound.update({data_inicio: inicio, status: "Em andamento"});
}

async function finalizar(id, dataFim, custoMaoDeObra, valorFinal) {
    const projetoFound = await projeto.findByPk(id);
    if(!projetoFound) return null;

    return projetoFound.update({
        data_fim: dataFim,
        custo_mao_de_obra_final: custoMaoDeObra,
        valor_final: valorFinal,
        status: "Concluído"
    })
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