const bcrypt = require("bcrypt");
const usuarioRepository = require("./usuarios.repository.js");
const usuario = require("../../database/models/usuario.model.js");

function erroDeValidacao(mensagem) {
    // Cria e lança um erro de validação com status 400.
    // Use esta função para interromper a operação ao encontrar uma entrada inválida.
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarId(id) {
    if (!Number.isSafeInteger(id) || id <= 0) { erroDeValidacao("Id inválido") }
    return id;
}

function validarCpf(cpf) {
    if (typeof cpf !== "string" || !/^\d{11}$/.test(cpf)) {
        erroDeValidacao("O CPF deve conter exatamente 11 números, sem pontos ou traço.")
    }
    if (/^(\d)\1{10}$/.test(cpf)) {
        erroDeValidacao("CPF inválido");
    }
    for (let tamanho = 9; tamanho <= 10; tamanho++) {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            soma += Number(cpf[i]) * (tamanho + 1 - i);
        }
        const resto = soma % 11;
        const digito = resto < 2 ? 0 : 11 - resto;
        if (Number(cpf[tamanho]) !== digito) {
            erroDeValidacao("CPF inválido.");
        }
    }
    return cpf;
}

function validarValorMonetario(valor) {
    if (!Number.isFinite(valor)) {
        erroDeValidacao("Valor inválido");
    }
    if (valor <= 0 || valor > 999999.99) {
        erroDeValidacao("Valor inválido");
    }
    if (Number(valor.toFixed(2)) !== valor) {
        erroDeValidacao("O valor pode conter no maximo 2 casas decimais")
    }
    return valor;
}

function validarHorasMensais(horasMensais) {
    if (!Number.isFinite(horasMensais)) {
        erroDeValidacao("O horario mensal é invalido");
    }
    if (horasMensais <= 0 || horasMensais > 999999.99) {
        erroDeValidacao("O horario mensal é invalido");
    }
    if (Number(horasMensais.toFixed(2)) !== horasMensais) {
        erroDeValidacao("O horario mensal pode conter no maximo 2 casas decimais")
    }
    return horasMensais;
}

function validarDados(dados, edicao = false) {
    const resultado = {};
    if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
        erroDeValidacao("Envie um objeto com os dados do usuário.")
    }

    const camposPermitidos = [
        "nome", "cpf", "perfil", "login", "senha",
        "salario", "horas_mensais", "nascimento", "telefone"
    ];

    const desconhecidos = Object.keys(dados).filter(
        campo => !camposPermitidos.includes(campo)
    );

    if (desconhecidos.length > 0) {
        erroDeValidacao(`Campos não permitidos: ${desconhecidos.join(", ")}`);
    }

    if (!edicao || dados.nome !== undefined) {
        if (typeof dados.nome !== "string" || !dados.nome.trim()) {
            erroDeValidacao("O nome é obrigatorio");
        }
        resultado.nome = dados.nome.trim();
        if (resultado.nome.length > 120) {
            erroDeValidacao("O nome deve ter no maximo 120 caracteres");
        }
    }
    if (!edicao || dados.cpf !== undefined) {
        validarCpf(dados.cpf);
        resultado.cpf = dados.cpf;
    }
    if (!edicao || dados.perfil !== undefined) {
        const perfilValidos = ["Marceneiro", "Administrador"];
        if (!perfilValidos.includes(dados.perfil)) {
            erroDeValidacao("Perfil inválido");
        }
        resultado.perfil = dados.perfil;
    }
    if (!edicao || dados.login !== undefined) {
        if (typeof dados.login !== "string" || !dados.login.trim()) {
            erroDeValidacao("Login invalido");
        }
        resultado.login = dados.login.trim();
        if (resultado.login.length > 30) {
            erroDeValidacao("O login pode ter no máximo 30 caracteres");
        }
    }
    if (!edicao || dados.senha !== undefined) {
        if (typeof dados.senha !== "string" || dados.senha.length === 0) {
            erroDeValidacao("Senha inválida")
        }
        if (Buffer.byteLength(dados.senha, "utf-8") > 72) {
            erroDeValidacao("A senha deve ter no máximo 72 bytes em UTF-8. Acentos e emojis podem ocupar mais de um byte.")
        }
        resultado.senha = dados.senha;
    }
    if (!edicao || dados.salario !== undefined) {
        validarValorMonetario(dados.salario);
        resultado.salario = dados.salario;
    }
    if (!edicao || dados.horas_mensais !== undefined) {
        validarHorasMensais(dados.horas_mensais);
        resultado.horas_mensais = dados.horas_mensais;
    }
    if (dados.nascimento !== undefined) {
        if (dados.nascimento === null) resultado.nascimento = null;
        else {
            if (typeof dados.nascimento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dados.nascimento)) {
                erroDeValidacao("A data de nascimento deve estar no formato AAAA-MM-DD.")
            }

            const hoje = new Date();
            const anoAtual = new Date().getFullYear();
            const mesAtual = hoje.getMonth() + 1;
            const diaAtual = hoje.getDate();

            const [ano, mes, dia] = dados.nascimento.split("-").map(Number);
            if (ano > anoAtual || (ano === anoAtual && mes > mesAtual) || (anoAtual === ano && mesAtual === mes && dia > diaAtual)) {
                erroDeValidacao("A data informada não pode ser futura");
            }
            if (ano < 1 || mes < 1 || mes > 12) {
                erroDeValidacao("Data inválida");
            }
            const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
            const diaPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (dia < 1 || dia > diaPorMes[mes - 1]) { erroDeValidacao("Data de nascimentoo inválida"); }
            resultado.nascimento = dados.nascimento;
        }
    }
    if (dados.telefone !== undefined) {
        if (dados.telefone === null || dados.telefone === "") {
            resultado.telefone = null
        } else {
            if (typeof dados.telefone !== "string" || !/^[\d\s()+-]+$/.test(dados.telefone)) {
                erroDeValidacao("Telefone inválido. Informe o DDD e o número.")
            }
            const telefone = dados.telefone.replace(/\D/g, "");
            if (!/^\d{10,11}$/.test(telefone)) {
                erroDeValidacao("O telefone deve conter 10 ou 11 numeros, incluindo o DDD")
            }
            resultado.telefone = telefone;
        }
    }

    if (edicao && Object.keys(resultado).length === 0) {
        erroDeValidacao("Precisa de no minimo um campo para editar");
    }

    return resultado;
}

function removerSenha(usuario) {
    if (usuario === null) return null;
    let user;
    if (typeof usuario.toJSON === "function") {
        user = usuario.toJSON();
    } else {
        user = { ...usuario }
    }
    delete user.senha;
    return user;
}

async function cadastrar(dados) {
    const dadosValidados = validarDados(dados);
    const senhaHash = await bcrypt.hash(dadosValidados.senha, 10);
    dadosValidados.senha = senhaHash;

    const usuarioCriado = await usuarioRepository.cadastrar(dadosValidados)
    return removerSenha(usuarioCriado);
}

async function listar() {
    const user = await usuarioRepository.listar();
    return user.map(removerSenha);
}

async function buscarPorId(id) {
    const idValidado = validarId(id);
    const userBuscado = await usuarioRepository.buscarPorId(idValidado);
    return removerSenha(userBuscado);
}

async function editar(id, dados) {
    const idValidado = validarId(id);
    const dadosValidados = validarDados(dados, true);
    if (dadosValidados.senha !== undefined) {
        const senhaHash = await bcrypt.hash(dadosValidados.senha, 10);
        dadosValidados.senha = senhaHash;
    }
    return usuarioRepository.comBloqueioAdministradores(async (transaction) => {
        const options = { transaction };
        const usuarioAlvo = await usuarioRepository.buscarPorId(idValidado, options);
        if (!usuarioAlvo) return null;
        if (usuarioAlvo.ativo && usuarioAlvo.perfil === "Administrador"
            && dadosValidados.perfil !== undefined && dadosValidados.perfil !== "Administrador") {
            const quantidade = await usuarioRepository.contarAdministradoresAtivos(options);
            if (quantidade <= 1) {
                erroDeValidacao("Não é possível alterar o perfil do último administrador ativo.");
            }
        }
        const usuarioEditado = await usuarioRepository.editar(idValidado, dadosValidados, options);
        return removerSenha(usuarioEditado);
    });
}

async function atualizarRemuneracao(id, salario, horasMensais) {
    const idValidado = validarId(id);
    const salarioValidado = validarValorMonetario(salario);
    const horasValidadas = validarHorasMensais(horasMensais);
    const atualizacaoRemunercao = await usuarioRepository.atualizarRemuneracao(idValidado, salarioValidado, horasValidadas);
    return removerSenha(atualizacaoRemunercao);
}

async function gravarPushToken(id, token) {
    const idValidado = validarId(id);
    if (token !== null) {
        if (typeof token !== "string" || !token.trim()) {
            erroDeValidacao("O token de notificações deve ser um texto não vazio")
        }
    }
    const usuarioAtualizado = await usuarioRepository.gravarPushToken(idValidado, token);
    return removerSenha(usuarioAtualizado);
}

async function desativar(id, idUsuarioAutenticado) {
    const idValidado = validarId(id);
    const idAutor = validarId(idUsuarioAutenticado);
    if (idValidado === idAutor) erroDeValidacao("Você não pode desativar sua própria conta");
    return usuarioRepository.comBloqueioAdministradores(async (transaction) => {
        const options = { transaction };
        const usuarioAlvo = await usuarioRepository.buscarPorId(idValidado, options);
        if (!usuarioAlvo) return null;
        if (usuarioAlvo.perfil === "Administrador" && usuarioAlvo.ativo) {
            const quantidade = await usuarioRepository.contarAdministradoresAtivos(options);
            if (quantidade <= 1) erroDeValidacao("Não é possível desativar o último administrador ativo.");
        }
        const userDesativado = await usuarioRepository.desativar(idValidado, options);
        return removerSenha(userDesativado);
    });
}

function dadosDoPerfil(user) {
    if (!user) return null;
    const dados = typeof user.toJSON === "function" ? user.toJSON() : user;
    const { usuario_id, nome, cpf, perfil, login, nascimento, telefone } = dados;
    return { usuario_id, nome, cpf, perfil, login, nascimento, telefone };
}

async function buscarMeuPerfil(id) {
    return dadosDoPerfil(await usuarioRepository.buscarPorId(validarId(id)));
}

async function editarMeuPerfil(id, dados) {
    const idValidado = validarId(id);
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        erroDeValidacao("Envie um objeto com os dados do perfil.");
    }
    const permitidos = ["nome", "login", "telefone", "nascimento", "senha", "senha_atual"];
    if (Object.keys(dados).some(campo => !permitidos.includes(campo))) {
        erroDeValidacao("Campos não permitidos na edição do próprio perfil.");
    }
    const { senha_atual, ...alteracoes } = dados;
    const validados = validarDados(alteracoes, true);
    return usuarioRepository.comBloqueioAdministradores(async transaction => {
        const options = { transaction };
        const atual = await usuarioRepository.buscarPorId(idValidado, options);
        if (!atual) return null;
        if (validados.senha !== undefined || (validados.login !== undefined && validados.login !== atual.login)) {
            if (typeof senha_atual !== "string" || !senha_atual || Buffer.byteLength(senha_atual, "utf-8") > 72) {
                erroDeValidacao("Informe sua senha atual para alterar o login ou a senha.");
            }
            const credenciais = await usuarioRepository.buscarCredenciaisPorId(idValidado, options);
            if (!credenciais || !(await bcrypt.compare(senha_atual, credenciais.senha))) {
                erroDeValidacao("Senha atual incorreta.");
            }
        }
        if (validados.senha !== undefined) validados.senha = await bcrypt.hash(validados.senha, 10);
        return dadosDoPerfil(await usuarioRepository.editar(idValidado, validados, options));
    });
}

async function reativar(id) {
    const idValidado = validarId(id);
    return usuarioRepository.comBloqueioAdministradores(async (transaction) => {
        const usuarioReativado = await usuarioRepository.reativar(idValidado, { transaction });
        return removerSenha(usuarioReativado);
    });
}

module.exports = {
    cadastrar,
    listar,
    buscarPorId,
    editar,
    atualizarRemuneracao,
    gravarPushToken,
    desativar,
    reativar,
    buscarMeuPerfil,
    editarMeuPerfil
}
