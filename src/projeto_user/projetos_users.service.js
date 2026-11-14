const projetosUsersRepository = require("./projetos_users.repository.js");

function erroDeValidacao(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 400;
    throw erro;
}

function erroDeConflito(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 409;
    throw erro;
}

function validarId(id) {
    if (!["number", "string"].includes(typeof id) || !/^\d+$/.test(String(id))
        || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647) {
        erroDeValidacao("ID inválido");
    }
    return Number(id);
}

async function exigirPlanejamento(projeto, transaction) {
    if (!["Planejado", "Atrasado"].includes(projeto.status) || projeto.data_inicio || projeto.data_fim
        || await projetosUsersRepository.contarExecucoes(projeto.proj_id, { transaction }) > 0) {
        erroDeConflito("A equipe só pode ser alterada antes do início da produção.");
    }
}

async function vincular(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)
        || Object.keys(dados).some(campo => !["proj_id", "usuario_id"].includes(campo))) {
        erroDeValidacao("Informe somente proj_id e usuario_id. As referências salariais são calculadas pelo sistema.");
    }
    const projId = validarId(dados.proj_id);
    const usuarioId = validarId(dados.usuario_id);
    return projetosUsersRepository.iniciarTransacao(async transaction => {
        const projeto = await projetosUsersRepository.buscarProjetoPorId(projId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!projeto) {
            const erro = new Error("Projeto não encontrado");
            erro.status = 404;
            throw erro;
        }
        await exigirPlanejamento(projeto, transaction);
        const usuario = await projetosUsersRepository.buscarUsuarioPorId(usuarioId, { transaction, lock: transaction.LOCK.SHARE });
        if (!usuario) {
            const erro = new Error("Usuário não encontrado");
            erro.status = 404;
            throw erro;
        }
        if (!usuario.ativo || usuario.perfil !== "Marceneiro") erroDeConflito("Vincule um marceneiro ativo ao projeto.");
        if (await projetosUsersRepository.buscarVinculo(projId, usuarioId, { transaction })) {
            erroDeConflito("Este funcionário já está vinculado ao projeto.");
        }
        const salario = Number(usuario.salario);
        const horas = Number(usuario.horas_mensais);
        const custoHora = Number((salario / horas).toFixed(2));
        if (!Number.isFinite(salario) || salario <= 0 || !Number.isFinite(horas) || horas <= 0
            || !Number.isFinite(custoHora) || custoHora < 0.01 || custoHora > 999999.99) {
            erroDeConflito("O salário e as horas mensais precisam gerar um custo por hora entre 0,01 e 999999,99.");
        }
        return projetosUsersRepository.vincular({
            proj_id: projId, usuario_id: usuarioId, salario_referencia: salario,
            horas_mensais_referencia: horas, custo_hora_referencia: custoHora,
        }, { transaction });
    });
}

async function buscarPorId(id) {
    return projetosUsersRepository.buscarPorId(validarId(id));
}

async function listarPorProjeto(id) {
    const projId = validarId(id);
    if (!await projetosUsersRepository.buscarProjetoPorId(projId)) return null;
    return projetosUsersRepository.listarPorProjeto(projId);
}

async function listarPorUsuario(id) {
    const usuarioId = validarId(id);
    if (!await projetosUsersRepository.buscarUsuarioPorId(usuarioId)) return null;
    return projetosUsersRepository.listarPorUsuario(usuarioId);
}

async function desvincular(id) {
    const idValidado = validarId(id);
    return projetosUsersRepository.iniciarTransacao(async transaction => {
        const vinculo = await projetosUsersRepository.buscarPorId(idValidado, { transaction });
        if (!vinculo) return null;
        const projeto = await projetosUsersRepository.buscarProjetoPorId(vinculo.proj_id, { transaction, lock: transaction.LOCK.UPDATE });
        await exigirPlanejamento(projeto, transaction);
        return projetosUsersRepository.desvincular(idValidado, { transaction });
    });
}

module.exports = { vincular, buscarPorId, listarPorProjeto, listarPorUsuario, desvincular };
