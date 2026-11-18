const clientesRepository = require("../../src/cliente/clientes.repository.js");

async function listar() {
    return clientesRepository.listar();
}

async function cadastrar(dados) {
    const dadosValidados = validarDados(dados);
    return clientesRepository.cadastrar(dadosValidados);
}

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarCpf(cpf) {
    if (typeof cpf !== "string" || !/^\d{11}$/.test(cpf)) {
        erroDeValidacao("O CPF deve conter exatamente 11 números, sem pontos ou traço.");
    }

    if (/^(\d)\1{10}$/.test(cpf)) { //todos os numeros iguais
        erroDeValidacao("CPF inválido.");
    }

    // Calcula os dois dígitos verificadores a partir dos números anteriores.
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
}

function validarDados(dados, edicao = false) {
    const resultado = {};

    if (!edicao || dados.nome !== undefined) {
        if (typeof dados.nome !== "string" || !dados.nome.trim()) {
            erroDeValidacao("O nome é obrigatório.");
        }
        resultado.nome = dados.nome.trim();
        if (resultado.nome.length > 120) {
            erroDeValidacao("O nome deve ter no máximo 120 caracteres.");
        }
    }

    if (!edicao || dados.cpf !== undefined) {
        validarCpf(dados.cpf);
        resultado.cpf = dados.cpf;
    }

    if (dados.telefone !== undefined) {
        // Telefone é opcional, null ou texto vazio permitem limpar o campo.
        if (dados.telefone === null || dados.telefone === "") {
            resultado.telefone = null;
        } else {
            if (typeof dados.telefone !== "string" || !/^[\d\s()+-]+$/.test(dados.telefone)) {
                erroDeValidacao("Telefone inválido. Informe o DDD e o número.");
            }
            const telefone = dados.telefone.replace(/\D/g, "");
            if (!/^\d{10,11}$/.test(telefone)) {
                erroDeValidacao("O telefone deve conter 10 ou 11 números, incluindo o DDD.");
            }
            resultado.telefone = telefone;
        }
    }

    if (edicao && Object.keys(resultado).length === 0) {
        erroDeValidacao("Informe pelo menos um campo para editar.");
    }
    return resultado;
}

async function buscarPorId(id) {
    return clientesRepository.buscarPorId(id);
}

async function buscarPorCpf(cpf) {
    return clientesRepository.buscarPorCpf(cpf);
}

async function editar(id, dados) {
    const dadosValidados = validarDados(dados, true);
    return clientesRepository.editar(id, dadosValidados);
}

async function contar() {
    return clientesRepository.contar();
}

module.exports = {
    listar,
    cadastrar,
    buscarPorId,
    buscarPorCpf,
    editar,
    contar
}
