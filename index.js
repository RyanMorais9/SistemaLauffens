const express = require("express");
const cors = require("cors");
const { sequelize } = require("./database/models");
const clientesRoutes = require("./src/cliente/clientes.routes");
const etapasRoutes = require("./src/etapa/etapas.routes");
const execucoesRoutes = require("./src/execucao/execucoes.routes");
const notificacoesRoutes = require("./src/notificacao/notificacoes.routes");
const errorMiddleware = require("./src/middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/working", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/clientes", clientesRoutes);
app.use("/api/etapas", etapasRoutes);
app.use("/api/execucoes", execucoesRoutes);
app.use("/api/notificacoes", notificacoesRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));
app.use(errorMiddleware);

const PORT = Number(process.env.PORT);

async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log("Conexão com PostgreSQL estabelecida.");
        app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}.`));
    } catch (erro) {
        console.error("Não foi possível iniciar a aplicação:", erro);
        process.exit(1);
    }
}

if (require.main === module) iniciarServidor();

module.exports = app;
