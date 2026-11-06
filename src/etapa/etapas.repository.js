const {etapa, projeto} = require("../../database/models");

class EtapasRepository{
    async cadastrar(dados){
        return etapa.create(dados);
    }
        listar(){
        return etapa.findAll({
            attributes: ["etapa_id", "nome", "descricao"],
            order: [["nome", "ASC"]],
        });
        }

    buscarPorIdEProjeto(id, projetoId){
        return etapa.findByPk(id, {
            attributes: ["etapa_id", "nome", "descricao"],
            include: [{
                model: projeto,
                where: {projeto_id: projetoId},
                attributes: []
            }]
        });
    }
    
    buscarExecAberta(id){
        return etapa.findByPk(id, {
            attributes: ["etapa_id", "nome", "descricao", "tempo_execucao"],
            where: {status: "aberta"}
        });
    }
    criarPlanejamento(id, dados){
        return etapa.update(dados, {where: {etapa_id: id}});
    }
    listProjetoAberto(projetoId){
        return etapa.findAll({
            attributes: ["etapa_id", "nome", "descricao"],
            where: {projeto_id: projetoId, status: "Em andamento"},
            order: [["nome", "ASC"]]
        });
    }
    listProjetoAberto(projetoId){
        return etapa.findAll({
            attributes: ["etapa_id", "nome", "descricao"],
            where: {projeto_id: projetoId, status: ""},
            order: [["nome", "ASC"]]
        });
    }
    listProjetoAberto(projetoId){
        return etapa.findAll({
            attributes: ["etapa_id", "nome", "descricao"],
            where: {projeto_id: projetoId, status: "aberta"},
            order: [["nome", "ASC"]]
        });
    }


}    