const express = require("express");
const cors = require("cors");
const passport = require("passport");

const clientesRoutes = require("./src/cliente/clientes.routes.js");
const etapasRoutes = require("./src/etapa/etapas.routes.js");
const execucoesRoutes = require("./src/execucao/execucoes.routes.js");
const manutencoesRoutes = require("./src/manutencao/manutencoes.routes.js");
const notificacoesRoutes = require("./src/notificacao/notificacoes.routes.js");
const projetosRoutes = require("./src/projeto/projetos.routes.js");
const projetosUsersRoutes = require("./src/projeto_user/projetos_users.routes.js");
const usuariosRoutes = require("./src/usuario/usuarios.routes.js");
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
app.use(etapasRoutes);
app.use(execucoesRoutes);
app.use(manutencoesRoutes);
app.use(notificacoesRoutes);
app.use("/projetos", projetosRoutes);
app.use(projetosUsersRoutes);
app.use(usuariosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
})
