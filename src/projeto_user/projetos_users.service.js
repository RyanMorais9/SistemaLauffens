const projUserRepository = require("../../src/projeto_user/projetos_users.repository.js");

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function validarId(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
        erroDeValidacao("Id inválido");
    }
    return id;
}

async function vincularFuncionario(dados) {
    if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
        erroDeValidacao("Entrada inválida");
    }
    const camposPermitidos = ["proj_id", "usuario_id"];
    const camposInvalidos = Object.keys(dados).filter(campo => !camposPermitidos.includes(campo));
    if (camposInvalidos.length > 0) {
        erroDeValidacao(`Campos não permitidos: ${camposInvalidos.join(", ")}`);
    }
    const projValidado = validarId(dados.proj_id);
    const usuarioValidado = validarId(dados.usuario_id);
    return projUserRepository.iniciarTransacao(async (transaction) => {
        const projetoFound = await projUserRepository.buscarProjetoPorId(projValidado, { transaction, lock: transaction.LOCK.UPDATE });
        if (!projetoFound) {
            const erro = new Error("Projeto não encontrado");
            erro.status = 404;
            throw erro;
        }
        if (["Cancelado", "Concluído"].includes(projetoFound.status) || projetoFound.data_inicio != null || projetoFound.data_fim != null) {
            const erro = new Error("A equipe só pode ser alterada antes do início da produção");
            erro.status = 409;
            throw erro;
        }
        const userFound = await projUserRepository.buscarUsuarioPorId(usuarioValidado, { transaction, lock: transaction.LOCK.SHARE });
        if (!userFound) {
            const erro = new Error("Usuario não encontrado");
            erro.status = 404;
            throw erro;
        }
        if (!userFound.ativo || userFound.perfil !== "Marceneiro") {
            const erro = new Error("O funcionário precisa estar ativo e ter perfil Marceneiro");
            erro.status = 409;
            throw erro;
        }
        const participantes = await projUserRepository.listarParticipantes(projValidado, { transaction });
        const jaVinculado = participantes.some(participantes => participantes.usuario_id === usuarioValidado);
        if (jaVinculado) {
            const erro = new Error("Funcionário já vinculado ao projeto");
            erro.status = 409;
            throw erro;
        }
        const salario = Number(userFound.salario);
        const horasMensais = Number(userFound.horas_mensais);
        if (!Number.isFinite(salario) || salario <= 0 || salario > 999999.99) {
            erroDeValidacao("Salario inválido");
        }
        if (!Number.isFinite(horasMensais) || horasMensais <= 0 || horasMensais > 999999.99) {
            erroDeValidacao("Horas mensais inválido");
        }
        const custoHora = Number((salario / horasMensais).toFixed(2));
        if (custoHora < 0.01 || custoHora > 999999.99) {
            erroDeValidacao("Custo por hora inválido");
        }
        const dadosVinculo = {
            proj_id: projValidado,
            usuario_id: usuarioValidado,
            salario_referencia: salario,
            horas_mensais_referencia: horasMensais,
            custo_hora_referencia: custoHora
        };
        return projUserRepository.vincularFuncionario(dadosVinculo, { transaction });
    });
}

async function listarParticipantes(projetoId) {
    const idValidado = validarId(projetoId);
    const projetoFound = await projUserRepository.buscarProjetoPorId(idValidado);
    if (!projetoFound) {
        const erro = new Error("Projeto não encontrado");
        erro.status = 404;
        throw erro;
    }
    return projUserRepository.listarParticipantes(idValidado);
}

async function listarParticipacaoUser(usuarioId) {
    const idValidado = validarId(usuarioId);
    const usuarioFound = await projUserRepository.buscarUsuarioPorId(idValidado);
    if(!usuarioFound){
        const erro = new Error("Usuario não encontrado")
        erro.status = 404;
        throw erro;
    }
    return projUserRepository.listarParticipacaoUser(idValidado);
}

async function buscarVinculo(id) {
    const idValidado = validarId(id);
    return projUserRepository.buscarVinculo(idValidado);
}

module.exports = {
    vincularFuncionario,
    listarParticipantes,
    listarParticipacaoUser,
    buscarVinculo
}
