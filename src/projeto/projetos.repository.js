const { projeto, cliente, etapa, execucao, sequelize } = require("../../database/models");

async function cadastrar(dados, options = {}){
    return projeto.create(dados, options);
}

async function buscarPorId(id, options = {}) {
    return projeto.findByPk(id, options);
}

function iniciarTransacao(callback) {
    return sequelize.transaction(callback);
}

function buscarClientePorId(id, options = {}) {
    return cliente.findByPk(id, options);
}

function cadastrarEtapas(dados, options = {}) {
    return etapa.bulkCreate(dados, { ...options, validate: true });
}

function incluirAcompanhamento() {
    return [
        { model: cliente, as: "cliente", attributes: ["cliente_id", "nome"] },
        { model: etapa, as: "etapa", include: [
            { model: execucao, as: "execucao", attributes: ["execucao_id", "data_inicio", "data_fim", "motivo_encerramento"] },
        ] },
    ];
}

function buscarAcompanhamento(id) {
    return projeto.findByPk(id, { include: incluirAcompanhamento() });
}

async function listar(filtros = {}) {
    const where = {};

    if(filtros.status !== undefined){
        where.status = filtros.status;
    }
    if(filtros.porte !== undefined){
        where.porte = filtros.porte;
    }

    return projeto.findAll({where, include: incluirAcompanhamento(), order: [["proj_id", "ASC"]]});
}

async function editar(id, dados, options = {}) {
    const projetoFound = await projeto.findByPk(id, options);
    if(!projetoFound) return null;
    return projetoFound.update(dados, options);
}

async function registrarVB(id, valor, options = {}) { //VB = valor base
    return editar(id, { valor_base: valor }, options);
}

async function gerenciarStatus(id, alteracoes, options = {}) {
    return editar(id, alteracoes, options);
}

module.exports = {
    cadastrar,
    buscarPorId,
    listar,
    editar,
    registrarVB,
    gerenciarStatus,
    iniciarTransacao,
    buscarClientePorId,
    cadastrarEtapas,
    buscarAcompanhamento
};
