const {manutencao, projeto} = require("../../database/models");

async function buscarProjetoPorId(id) {
    return projeto.findByPk(id);
}

async function cadastrar(dados) {
    return manutencao.create(dados);
}

async function listar(filtros = {}) {
    const where = {};
    if(filtros.proj_id !== undefined){
        where.proj_id = filtros.proj_id;
    }
    if(filtros.status !== undefined){
        where.status = filtros.status;
    }
    return manutencao.findAll({where, order: [["mntnc_id", "ASC"]]})
}

async function buscarPorId(id) {
    return manutencao.findByPk(id);
}

async function editar(id, dados) {
    const manutencaoFound = await manutencao.findByPk(id);
    if (!manutencaoFound) return null;
    return manutencaoFound.update(dados);
}

async function resolver(id, dados) {
    const manutencaoFound = await manutencao.findByPk(id);
    if (!manutencaoFound) return null;
    return manutencaoFound.update(dados);
}

module.exports = {
    buscarProjetoPorId,
    cadastrar,
    listar,
    buscarPorId,
    editar,
    resolver
}