const repository = require("./notificacoes.repository");

function erroHttp(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarId(id, campo) {
    const numero = Number(id);
    if (!Number.isSafeInteger(numero) || numero < 1) {
        throw erroHttp(400, `${campo} deve ser um inteiro positivo.`);
    }
    return numero;
}

class NotificacoesService {
    async gerarNotificacoesEtapaConcluida(etapa, transaction) {
        const destinatarios = await repository.listarDestinatariosAtivos(
            etapa.proj_id,
            transaction
        );
        if (destinatarios.length === 0) return [];

        return repository.criarEmLote(
            destinatarios.map(({ usuario_id }) => ({
                usuario_destinatario_id: usuario_id,
                proj_id: etapa.proj_id,
                etapa_id: etapa.etapa_id,
                tipo: "Etapa concluída",
                titulo: `${etapa.tipo} concluída`,
                mensagem: `A etapa ${etapa.tipo} do projeto foi concluída.`,
            })),
            transaction
        );
    }

    async listarPorUsuario(usuarioId, lida) {
        const id = validarId(usuarioId, "usuarioId");
        if (lida !== undefined && lida !== "true" && lida !== "false") {
            throw erroHttp(400, "O filtro lida deve ser true ou false.");
        }
        if (!(await repository.buscarUsuarioPorId(id))) {
            throw erroHttp(404, "Usuário não encontrado.");
        }
        return repository.listarPorUsuario(
            id,
            lida === undefined ? undefined : lida === "true"
        );
    }

    async contarNaoLidas(usuarioId) {
        const id = validarId(usuarioId, "usuarioId");
        if (!(await repository.buscarUsuarioPorId(id))) {
            throw erroHttp(404, "Usuário não encontrado.");
        }
        return repository.contarNaoLidas(id);
    }

    async marcarComoLida(usuarioId, notificacaoId) {
        const destinatarioId = validarId(usuarioId, "usuarioId");
        const id = validarId(notificacaoId, "notificacaoId");
        const notificacao = await repository.buscarPorIdEUsuario(id, destinatarioId);
        if (!notificacao) throw erroHttp(404, "Notificação não encontrada.");
        if (notificacao.lida_em === null) {
            await repository.marcarComoLida(id, destinatarioId, new Date());
        }
        return repository.buscarPorIdEUsuario(id, destinatarioId);
    }
}

module.exports = new NotificacoesService();