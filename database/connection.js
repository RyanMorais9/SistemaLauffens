const { Sequelize } = require("sequelize");

const commonOptions = {
    dialect: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
};

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        ...commonOptions,
        dialectOptions: process.env.DB_SSL === "true"
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {},
    })
    : new Sequelize(
        process.env.DB_NAME || "sistemalauffens",
        process.env.DB_USER || "postgres",
        process.env.DB_PASSWORD,
        commonOptions
    );

module.exports = sequelize;
