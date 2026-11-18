const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRepository = require("./auth.repository.js");

function erroDeAutenticacao(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    throw erro;
}

async function autenticarUsuario(login, senha) {
    if(typeof login !== "string" || !login.trim()){
        erroDeAutenticacao("Credenciais incorretas", 400);
    }
    if(typeof senha !== "string" || senha.length === 0){
        erroDeAutenticacao("Credenciais incorretas", 400);
    }

    const user = await authRepository.buscarPorLogin(login);
    if(!user) erroDeAutenticacao("Credenciais incorretas", 401)
    if(user.ativo === false) erroDeAutenticacao("O usuario esta desativado", 401);
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if(senhaValida) {
        return user;
    }else{
        erroDeAutenticacao("Credenciais incorretas", 401);
    }
}

function gerarToken(usuario) {
    const payload = {usuario_id: usuario.usuario_id};
    const chaveSecreta = process.env.JWT_SECRET;
    return jwt.sign(payload, chaveSecreta, {expiresIn: "1h"});
}

module.exports = {
    autenticarUsuario,
    gerarToken
}