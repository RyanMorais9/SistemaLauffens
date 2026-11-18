const repository = require("./notificacoes.repository.js");

function formatarMinutos(segundos) {
    return (segundos / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

class NotificacoesAtrasos {
    async gerarParaProjeto(projId, transaction, agora = Date.now()) {
        const projeto = await repository.buscarProjetoParaVerificarAtraso(projId, transaction);
        if (!projeto || !projeto.cliente) return;
        const administradores = await repository.listarAdministradoresAtivos(transaction);
        if (administradores.length === 0) return;
        const { calcularTempo } = require("../etapa/etapas.service.js");
        const etapas = [...projeto.etapa].sort((a, b) => a.etapa_id - b.etapa_id);
        const avisos = [];
        let total = 0;
        let planejado = 0;
        const data = new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
        }).format(new Date(agora));
        for (const etapa of etapas) {
            const segundos = calcularTempo(etapa.execucao, agora);
            const previsto = Number(etapa.tempo_planejado) * 60;
            total += segundos;
            planejado += previsto;
            if (segundos > previsto) {
                avisos.push({ etapa_id: etapa.etapa_id, titulo: `Etapa ${etapa.tipo} em atraso`,
                    mensagem: `A etapa ${etapa.tipo} do projeto “${projeto.nome}”, do cliente ${projeto.cliente.nome}, ultrapassou o tempo planejado de ${formatarMinutos(previsto)} minutos. Tempo registrado: ${formatarMinutos(segundos)} minutos. Atraso identificado em ${data} (horário de Brasília).` });
            }
        }
        if (etapas.length > 0 && total > planejado) {
            // Mantém a etapa vinculada, conforme a obrigatoriedade do model de notificação.
            const referencia = etapas.find(etapa => ["Em andamento", "Pausada"].includes(etapa.status)) || etapas[etapas.length - 1];
            avisos.push({ etapa_id: referencia.etapa_id, titulo: "Tempo planejado do projeto excedido",
                mensagem: `O projeto “${projeto.nome}”, do cliente ${projeto.cliente.nome}, ultrapassou o tempo total planejado de ${formatarMinutos(planejado)} minutos. Tempo registrado: ${formatarMinutos(total)} minutos. Atraso identificado em ${data} (horário de Brasília).` });
        }
        for (const aviso of avisos) {
            for (const { usuario_id } of administradores) {
                // O aviso do projeto é único por destinatário, mesmo se a etapa atual mudar.
                const etapaId = aviso.titulo === "Tempo planejado do projeto excedido" ? undefined : aviso.etapa_id;
                const existente = await repository.buscarAvisoDeAtraso(usuario_id, projId, etapaId, aviso.titulo, transaction);
                if (!existente) await repository.criarEmLote([{
                    ...aviso, usuario_destinatario_id: usuario_id, proj_id: projId, tipo: "Atraso",
                }], transaction);
            }
        }
    }

    async verificarAtrasos() {
        await repository.processarFila(async transaction => {
            const projetos = await repository.listarProjetosParaVerificarAtraso(transaction);
            for (const { proj_id } of projetos) {
                // Revalida o estado depois de obter o bloqueio, pois o projeto pode ter sido encerrado.
                const projeto = await repository.buscarProjetoParaVerificarAtraso(proj_id, transaction);
                if (projeto && !["Concluído", "Cancelado"].includes(projeto.status)) {
                    await this.gerarParaProjeto(proj_id, transaction);
                }
            }
        }, 20261117);
    }
}

module.exports = new NotificacoesAtrasos();
