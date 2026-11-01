const service = require("./clientes.service");

class ClientesController {
    async cadastrar(req, res, next) {
        try {
            return res.status(201).json(await service.cadastrar(req.body));
        } catch (erro) { next(erro); }
    }

    async listar(req, res, next) {
        try {
            return res.status(200).json(await service.listar());
        } catch (erro) { next(erro); }
    }

    async buscarPorId(req, res, next) {
        try {
            return res.status(200).json(await service.buscarPorId(req.params.id));
        } catch (erro) { next(erro); }
    }

    async buscarPorCpf(req, res, next) {
        try {
            return res.status(200).json(await service.buscarPorCpf(req.params.cpf));
        } catch (erro) { next(erro); }
    }

    async buscarProjetos(req, res, next) {
        try {
            return res.status(200).json(await service.buscarProjetos(req.params.id));
        } catch (erro) { next(erro); }
    }

    async atualizar(req, res, next) {
        try {
            return res.status(200).json(await service.atualizar(req.params.id, req.body));
        } catch (erro) { next(erro); }
    }

    async contar(req, res, next) {
        try {
            return res.status(200).json({ total: await service.contar() });
        } catch (erro) { next(erro); }
    }
}

module.exports = new ClientesController();
