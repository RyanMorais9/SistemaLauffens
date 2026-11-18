const authService = require("./auth.service.js");

async function login(req, res) {
    try {
        const { login, senha } = req.body;
        const usuario = await authService.autenticarUsuario(login, senha);
        const token = authService.gerarToken(usuario);
        return res.status(200).json({ token });
    } catch (erro) {
        const status = erro.status || 500;
        return res.status(status).json({ erro: status === 500 ? "Erro interno no servidor" : erro.message});
    }
}

module.exports = {
    login
}