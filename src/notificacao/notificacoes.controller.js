const service = require("./notificacoes.service");

class NotificacoesController {
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