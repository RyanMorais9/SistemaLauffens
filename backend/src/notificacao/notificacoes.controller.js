const service = require("./notificacoes.service");

class NotificacoesController {
    async obterChavePublica(req, res, next) {
        try {
            return res.status(200).json({ ...service.obterChavePublica(), usuario_id: req.user.usuario_id });
        } catch (erro) { return next(erro); }
    }

    async cadastrarInscricao(req, res, next) {
        try {
            return res.status(200).json(await service.cadastrarInscricao(req.user.usuario_id, req.body));
        } catch (erro) { return next(erro); }
    }

    async removerInscricao(req, res, next) {
        try {
            return res.status(200).json(await service.removerInscricao(req.user.usuario_id, req.body));
        } catch (erro) { return next(erro); }
    }

    async listarPorUsuario(req, res, next) {
        try {
            return res.status(200).json(
                await service.listarPorUsuario(req.params.usuarioId, req.query.lida)
            );
        } catch (erro) {
            return next(erro);
        }
    }

    async contarNaoLidas(req, res, next) {
        try {
            return res.status(200).json({
                total: await service.contarNaoLidas(req.params.usuarioId),
            });
        } catch (erro) {
            return next(erro);
        }
    }

    async marcarTodasComoLidas(req, res, next) {
        try {
            return res.status(200).json(await service.marcarTodasComoLidas(req.params.usuarioId));
        } catch (erro) {
            return next(erro);
        }
    }

    async marcarComoLida(req, res, next) {
        try {
            return res.status(200).json(
                await service.marcarComoLida(
                    req.params.usuarioId,
                    req.params.notificacaoId
                )
            );
        } catch (erro) {
            return next(erro);
        }
    }
}

module.exports = new NotificacoesController();
