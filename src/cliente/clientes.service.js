const repository = require("./clientes.repository");

const camposPermitidos = ["nome", "cpf", "telefone"];

function erroHttp(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function normalizarCpf(cpf) {
    return String(cpf ?? "").replace(/\D/g, "");
}

function validarId(id) {
    if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
        throw erroHttp("ID inválido.", 400);
    }
    return Number(id);
}

function validarDados(dados, parcial = false) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw erroHttp("O corpo da requisição deve ser um objeto JSON.", 400);
    }

    const desconhecidos = Object.keys(dados).filter((campo) => !camposPermitidos.includes(campo));
    if (desconhecidos.length) {
        throw erroHttp(`Campos não permitidos: ${desconhecidos.join(", ")}`, 400);
    }

    if ((!parcial || dados.nome !== undefined) &&
        (typeof dados.nome !== "string" || !dados.nome.trim())) {
        throw erroHttp("O nome é obrigatório.", 400);
    }
    if (dados.nome !== undefined && dados.nome.trim().length > 120) {
        throw erroHttp("O nome deve ter no máximo 120 caracteres.", 400);
    }

    if (!parcial || dados.cpf !== undefined) {
        const cpf = normalizarCpf(dados.cpf);
        if (!/^\d{11}$/.test(cpf)) throw erroHttp("O CPF deve conter 11 números.", 400);
        dados.cpf = cpf;
    }

    if (dados.telefone !== undefined && dados.telefone !== null &&
        (typeof dados.telefone !== "string" || dados.telefone.length > 20)) {
        throw erroHttp("O telefone deve ser um texto de até 20 caracteres.", 400);
    }

    if (dados.nome !== undefined) dados.nome = dados.nome.trim();
    return dados;
}

class ClientesService {
    async cadastrar(dados) {
        validarDados(dados);
        if (await repository.buscarPorCpf(dados.cpf)) {
            throw erroHttp("Já existe um cliente cadastrado com este CPF.", 409);
        }
        return repository.cadastrar(dados);
    }

    listar() {
        return repository.listar();
    }

    async buscarPorId(id) {
        const cliente = await repository.buscarPorId(validarId(id));
        if (!cliente) throw erroHttp("Cliente não encontrado.", 404);
        return cliente;
    }

    async buscarPorCpf(cpf) {
        const normalizado = normalizarCpf(cpf);
        if (!/^\d{11}$/.test(normalizado)) throw erroHttp("O CPF deve conter 11 números.", 400);
        const cliente = await repository.buscarPorCpf(normalizado);
        if (!cliente) throw erroHttp("Cliente não encontrado.", 404);
        return cliente;
    }

    async buscarProjetos(id) {
        const cliente = await repository.buscarProjetos(validarId(id));
        if (!cliente) throw erroHttp("Cliente não encontrado.", 404);
        return cliente;
    }

    async atualizar(id, dados) {
        const clienteId = validarId(id);
        if (!dados || Object.keys(dados).length === 0) {
            throw erroHttp("Informe ao menos um campo para atualizar.", 400);
        }
        validarDados(dados, true);
        await this.buscarPorId(clienteId);

        if (dados.cpf) {
            const existente = await repository.buscarPorCpf(dados.cpf);
            if (existente && existente.cliente_id !== clienteId) {
                throw erroHttp("Já existe outro cliente cadastrado com este CPF.", 409);
            }
        }

        await repository.atualizar(clienteId, dados);
        return this.buscarPorId(clienteId);
    }

    contar() {
        return repository.contar();
    }
}

module.exports = new ClientesService();
