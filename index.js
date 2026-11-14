const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("./database/models");

const clientesRoutes = require("./src/cliente/clientes.routes.js");
const etapasRoutes = require("./src/etapa/etapas.routes.js");
const projetosRoutes = require("./src/projeto/projetos.routes.js");
const execucoesRoutes = require("./src/execucao/execucoes.routes.js");
const authRoutes = require("./src/auth/auth.routes.js");
const {configureJwtStrategy} = require("./src/auth/auth.config.js");

const app = express();
const PORT = 9001;

app.use(cors());
app.use(express.json());
app.use(authRoutes);
configureJwtStrategy();
app.use(passport.initialize());

app.use("/clientes", clientesRoutes);
app.use("/etapas", etapasRoutes);
app.use("/projetos", projetosRoutes);
app.use("/execucoes", execucoesRoutes);

if (require.main === module) app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
})

module.exports = app;
