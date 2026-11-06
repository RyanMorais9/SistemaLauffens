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

    buscarPorId(id){
        return etapa.findByPk(id, {
            attributes: ["etapa_id", "nome", "descricao"],
        });
    }

}