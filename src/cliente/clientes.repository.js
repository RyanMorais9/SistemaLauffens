const { cliente, projeto } = require("../../database/models");

class ClientesRepository {
    cadastrar(dados) {
        return cliente.create(dados);
    }

    listar() {
        return cliente.findAll({
            attributes: ["cliente_id", "nome", "cpf", "telefone"],
            order: [["nome", "ASC"]],
        });
    }

    buscarPorId(id) {
        return cliente.findByPk(id, {
            attributes: ["cliente_id", "nome", "cpf", "telefone"],
        });
    }

    buscarPorCpf(cpf) {
        return cliente.findOne({
            where: { cpf },
            attributes: ["cliente_id", "nome", "cpf", "telefone"],
        });
    }

    buscarProjetos(id) {
        return cliente.findByPk(id, {
            attributes: ["cliente_id", "nome", "cpf"],
            include: [{
                model: projeto,
                as: "projeto",
                attributes: ["proj_id", "nome", "porte", "status", "prazo_planejado"],
            }],
        });
    }

    atualizar(id, dados) {
        return cliente.update(dados, { where: { cliente_id: id } });
    }

    contar() {
        return cliente.count();
    }
}

module.exports = new ClientesRepository();
