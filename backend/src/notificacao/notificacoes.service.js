const repository = require("./notificacoes.repository");
const push = require("./notificacoes.push.js");

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
        const destinatarios = await repository.listarAdministradoresAtivos(transaction);
        if (destinatarios.length === 0) return [];
        const projeto = await repository.buscarProjetoComCliente(etapa.proj_id, transaction);
        if (!projeto || !projeto.cliente) throw erroHttp(409, "Projeto ou cliente da etapa não encontrado.");
        const dataFim = new Date(etapa.data_fim);
        if (etapa.data_fim == null || !Number.isFinite(dataFim.getTime())) {
            throw erroHttp(409, "A etapa precisa ter uma data de conclusão válida.");
        }
        const partes = Object.fromEntries(new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(dataFim).map(parte => [parte.type, parte.value]));
        const data = `${partes.day}/${partes.month}/${partes.year}`;
        const horario = `${partes.hour}:${partes.minute}`;
        const feminina = etapa.tipo === "Fitagem";
        const titulo = `Etapa ${etapa.tipo} concluída`;
        const mensagem = `${feminina ? "A" : "O"} ${etapa.tipo} do projeto “${projeto.nome}”, do cliente ${projeto.cliente.nome}, foi finalizad${feminina ? "a" : "o"} em ${data} às ${horario}.`;
        const notificacoes = await repository.criarEmLote(
            destinatarios.map(({ usuario_id }) => ({
                usuario_destinatario_id: usuario_id,
                proj_id: etapa.proj_id,
                etapa_id: etapa.etapa_id,
                tipo: "Etapa concluída",
                titulo,
                mensagem,
            })),
            transaction
        );
        if (transaction) {
            transaction.afterCommit(() => { push.processarPendentes().catch(() => {
                console.error("Não foi possível processar a fila de notificações push.");
            }); });
        } else {
            await push.processarPendentes();
        }
        return notificacoes;
    }

    obterChavePublica() {
        return { chavePublica: push.obterChavePublica() };
    }

    async cadastrarInscricao(usuarioId, dados) {
        const id = validarId(usuarioId, "usuarioId");
        const usuario = await repository.buscarUsuarioPorId(id);
        if (!usuario || !usuario.ativo || usuario.perfil !== "Administrador") {
            throw erroHttp(403, "Somente administradores ativos podem habilitar notificações push.");
        }
        const inscricao = push.validarInscricao(dados);
        await repository.gravarInscricao(id, JSON.stringify(inscricao));
        return { mensagem: "Notificações habilitadas neste dispositivo." };
    }

    async removerInscricao(usuarioId, dados) {
        const id = validarId(usuarioId, "usuarioId");
        const inscricao = push.validarInscricao(dados);
        await repository.limparInscricaoExpirada(id, JSON.stringify(inscricao));
        return { mensagem: "Notificações desabilitadas neste dispositivo." };
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
