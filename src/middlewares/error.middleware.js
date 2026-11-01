function errorMiddleware(erro, req, res, next) {
    if (res.headersSent) return next(erro);

    if (erro.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Já existe um registro com esses dados únicos." });
    }
    if (erro.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ erro: "A operação conflita com registros relacionados." });
    }
    if (erro.name === "SequelizeValidationError" || erro.name === "SequelizeDatabaseError") {
        const status = erro.name === "SequelizeValidationError" ? 400 : 500;
        if (status === 400) {
            return res.status(status).json({
                erro: "Dados inválidos.",
                detalhes: erro.errors?.map((item) => item.message),
            });
        }
    }

    const status = Number.isInteger(erro.status) ? erro.status : 500;
    if (status >= 500) {
        console.error(erro);
        return res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
    }
    return res.status(status).json({ erro: erro.message || "Não foi possível processar a solicitação." });
}

module.exports = errorMiddleware;
