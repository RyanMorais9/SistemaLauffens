
const etapasService = require("./etapas.service");

class EtapasController {
    async cadastrar(req, res) {
        try {
            const etapa = await etapasService.cadastrar(req.body);

            return res.status(201).json({
                mensagem: "Etapa cadastrada com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async listarPorProjeto(req, res) {
        try {
            const { projetoId } = req.params;

            const etapas = await etapasService.listarPorProjeto(projetoId);

            return res.status(200).json(etapas);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.buscarPorId(id);

            return res.status(200).json(etapa);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async atualizar(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.atualizar(id, req.body);

            return res.status(200).json({
                mensagem: "Planejamento da etapa atualizado com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async iniciar(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.iniciar(id);

            return res.status(200).json({
                mensagem: "Etapa iniciada com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async pausar(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.pausar(id);

            return res.status(200).json({
                mensagem: "Etapa pausada com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async retomar(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.retomar(id);

            return res.status(200).json({
                mensagem: "Etapa retomada com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async concluir(req, res) {
        try {
            const { id } = req.params;

            const etapa = await etapasService.concluir(id);

            return res.status(200).json({
                mensagem: "Etapa concluída com sucesso!",
                etapa,
            });
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }

    async consultarTempoAcumulado(req, res) {
        try {
            const { id } = req.params;

            const tempo = await etapasService.consultarTempoAcumulado(id);

            return res.status(200).json(tempo);
        } catch (error) {
            return res.status(400).json({
                mensagem: error.message,
            });
        }
    }
}

module.exports = new EtapasController();
