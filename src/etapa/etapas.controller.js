const etapa = require("./etapas.service");

class EtapasController {
    async listar(req, res) {
        try {
            const etapas = await etapa.listar();
            res.json(etapas);
        } catch (error) {
            res.status(500).json({ error: "Erro ao listar etapas" });
        }
    }

async listarPorProjeto(req,res){
    try {
        const projetoId = req.params.projetoId;
        const etapas = await etapa.listarPorProjeto(projetoId);
       return res.status(200).json(etapas);
    } catch (error) {
       return res.status(400).json({ error: "Erro ao listar etapas" });
    }
}
async buscarPorId(req, res) {
    try {
        const id = req.params.id;
        const etapaEncontrada = await etapa.buscarPorId(id);
        if (!etapaEncontrada) {
            return res.status(404).json({ error: "Etapa não encontrada" });
        }
        res.json(etapaEncontrada);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar etapa" });
    }
}
 async criarPlanejamento(req, res) {
    try {
        const id = req.params.id;
        const dados = req.body;
        const etapaAtualizada = await etapa.criarPlanejamento(id, dados);
        res.json(etapaAtualizada);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar planejamento" });
    }
}
}