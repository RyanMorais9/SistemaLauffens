require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { sequelize } = require("./database/models");
const clientesRoutes = require("./src/cliente/clientes.routes");
const errorMiddleware = require("./src/middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/clientes", clientesRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));
app.use(errorMiddleware);

const PORT = Number(process.env.PORT || 3000);

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
