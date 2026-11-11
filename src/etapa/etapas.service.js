
const etapasRepository = require("./etapas.repository");

const TIPOS_ETAPA = [
    "Corte",
    "Fitagem",
    "Refinamento",
    "Embalamento",
];

class EtapasService {
    async cadastrar(dados) {
        const { proj_id, tipo, tempo_planejado } = dados;

        if (!proj_id || !tipo || !tempo_planejado) {
            throw new Error("Preencha todos os campos obrigatórios.");
        }

        if (!TIPOS_ETAPA.includes(tipo)) {
            throw new Error("Tipo de etapa inválido.");
        }

        if (!Number.isFinite(Number(tempo_planejado)) || Number(tempo_planejado) <= 0) {
            throw new Error("O tempo planejado deve ser maior que zero.");
        }

        const existente = await etapasRepository.buscarPorTipo(proj_id, tipo);

        if (existente) {
            throw new Error("Este projeto já possui uma etapa deste tipo.");
        }

        return etapasRepository.cadastrar({
            ...dados,
            tempo_planejado: Number(tempo_planejado),
            status: "PENDENTE",
        });
    }

    async listarPorProjeto(projetoId) {
        if (!projetoId) {
            throw new Error("Informe o ID do projeto.");
        }

        return etapasRepository.listarPorProjeto(projetoId);
    }

    async buscarPorId(id) {
        if (!id) {
            throw new Error("Informe o ID da etapa.");
        }

        const etapa = await etapasRepository.buscarPorId(id);

        if (!etapa) {
            throw new Error("Etapa não encontrada.");
        }

        return etapa;
    }

    async atualizar(id, dados) {
        const etapa = await this.buscarPorId(id);

        const { tempo_planejado } = dados;

        if (!Number.isFinite(Number(tempo_planejado)) || Number(tempo_planejado) <= 0) {
            throw new Error("O tempo planejado deve ser maior que zero.");
        }

        if (!["PENDENTE", "PAUSADA"].includes(etapa.status)) {
            throw new Error("Não é possível editar o planejamento desta etapa.");
        }

        await etapasRepository.atualizar(id, {
            tempo_planejado: Number(tempo_planejado),
        });

        return this.buscarPorId(id);
    }

    async iniciar(id) {
        const etapa = await this.buscarPorId(id);

        if (etapa.status !== "PENDENTE") {
            throw new Error("Somente etapas pendentes podem ser iniciadas.");
        }

        const execucaoAberta = await etapasRepository.buscarExecucaoAberta(id);

        if (execucaoAberta) {
            throw new Error("Já existe uma execução aberta.");
        }

        await etapasRepository.iniciarExecucao({
            etapa_id: id,
            data_inicio: new Date(),
            data_fim: null,
        });

        await etapasRepository.atualizar(id, {
            status: "EM_ANDAMENTO",
        });

        return this.buscarPorId(id);
    }

    async pausar(id) {
        const etapa = await this.buscarPorId(id);

        if (etapa.status !== "EM_ANDAMENTO") {
            throw new Error("A etapa não está em andamento.");
        }

        const execucao = await etapasRepository.buscarExecucaoAberta(id);

        if (!execucao) {
            throw new Error("Nenhuma execução aberta encontrada.");
        }

        await etapasRepository.encerrarExecucao(execucao.execucao_id, {
            data_fim: new Date(),
        });

        await etapasRepository.atualizar(id, {
            status: "PAUSADA",
        });

        return this.buscarPorId(id);
    }

    async retomar(id) {
        const etapa = await this.buscarPorId(id);

        if (etapa.status !== "PAUSADA") {
            throw new Error("Somente etapas pausadas podem ser retomadas.");
        }

        const execucao = await etapasRepository.buscarExecucaoAberta(id);

        if (execucao) {
            throw new Error("Já existe uma execução aberta.");
        }

        await etapasRepository.iniciarExecucao({
            etapa_id: id,
            data_inicio: new Date(),
            data_fim: null,
        });

        await etapasRepository.atualizar(id, {
            status: "EM_ANDAMENTO",
        });

        return this.buscarPorId(id);
    }

    async concluir(id) {
        const etapa = await this.buscarPorId(id);

        if (!["EM_ANDAMENTO", "PAUSADA"].includes(etapa.status)) {
            throw new Error("Esta etapa não pode ser concluída.");
        }

        if (etapa.status === "EM_ANDAMENTO") {
            const execucao = await etapasRepository.buscarExecucaoAberta(id);

            if (!execucao) {
                throw new Error("Nenhuma execução aberta encontrada.");
            }

            await etapasRepository.encerrarExecucao(execucao.execucao_id, {
                data_fim: new Date(),
            });
        }

        await etapasRepository.atualizar(id, {
            status: "CONCLUIDA",
            data_fim: new Date(),
        });

        return this.buscarPorId(id);
    }

    async consultarTempoAcumulado(id) {
        const etapa = await this.buscarPorId(id);

        const execucoes = await etapasRepository.listarExecucoes(id);

        let totalSegundos = 0;

        for (const execucao of execucoes) {
            const inicio = new Date(execucao.data_inicio);
            const fim = execucao.data_fim
                ? new Date(execucao.data_fim)
                : new Date();

            totalSegundos += Math.max(0, (fim - inicio) / 1000);
        }

        return {
            etapa_id: etapa.etapa_id,
            tempo_realizado_segundos: Math.floor(totalSegundos),
            tempo_realizado_minutos: Math.floor(totalSegundos / 60),
        };
    }
}

module.exports = new EtapasService();
