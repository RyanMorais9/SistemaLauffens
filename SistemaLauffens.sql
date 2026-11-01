/* ATENÇÃO: este script recria as tabelas e apaga os dados existentes.
   Execute somente em um banco de desenvolvimento/novo. */

DROP TABLE IF EXISTS notificacao, manutencao, execucao, etapa,
    projeto_user, projeto, cliente, usuario CASCADE;

DROP TYPE IF EXISTS status_push, tipo_notf, status_mntnc, motivo_mntnc,
    motivo_exec, status_etapa, tipo_etapa, status_proj, porte, perfil CASCADE;

CREATE TYPE perfil AS ENUM ('Administrador', 'Marceneiro');
CREATE TYPE porte AS ENUM ('Pequeno', 'Médio', 'Grande');
CREATE TYPE status_proj AS ENUM ('Planejado', 'Em andamento', 'Atrasado', 'Concluído');
CREATE TYPE tipo_etapa AS ENUM ('Corte', 'Fitagem', 'Refinamento', 'Embalamento');
CREATE TYPE status_etapa AS ENUM ('Planejada', 'Em andamento', 'Pausada', 'Concluída');
CREATE TYPE motivo_exec AS ENUM ('Pausa', 'Finalizado');
CREATE TYPE motivo_mntnc AS ENUM ('Ajuste', 'Reparo', 'Defeito', 'Problema na instalação', 'Outro');
CREATE TYPE status_mntnc AS ENUM ('Aberta', 'Resolvida');
CREATE TYPE tipo_notf AS ENUM ('Atraso', 'Etapa concluída');
CREATE TYPE status_push AS ENUM ('Pendente', 'Enviada', 'Falhou');

CREATE TABLE usuario (
    usuario_id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf CHAR(11) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    nascimento DATE,
    perfil perfil NOT NULL,
    login VARCHAR(30) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    salario NUMERIC(8, 2) CHECK (salario > 0) NOT NULL,
    horas_mensais NUMERIC(8, 2) CHECK (horas_mensais > 0) NOT NULL,
    push_token TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cliente (
    cliente_id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf CHAR(11) UNIQUE NOT NULL,
    telefone VARCHAR(20)
);

CREATE TABLE projeto (
    proj_id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(cliente_id),
    criado_por_id INTEGER NOT NULL REFERENCES usuario(usuario_id),
    nome VARCHAR(120) NOT NULL,
    porte porte NOT NULL,
    status status_proj NOT NULL,
    prazo_planejado DATE NOT NULL,
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ CHECK (
        data_fim IS NULL OR (data_inicio IS NOT NULL AND data_fim >= data_inicio)
    ),
    valor_base NUMERIC(9, 2) CHECK (valor_base > 0) NOT NULL,
    custo_mao_de_obra_final NUMERIC(9, 2) CHECK (custo_mao_de_obra_final > 0),
    valor_final NUMERIC(9, 2) CHECK (valor_final > 0)
);

CREATE TABLE projeto_user (
    proj_user_id SERIAL PRIMARY KEY,
    proj_id INTEGER NOT NULL REFERENCES projeto(proj_id),
    usuario_id INTEGER NOT NULL REFERENCES usuario(usuario_id),
    salario_referencia NUMERIC(8, 2) CHECK (salario_referencia > 0) NOT NULL,
    horas_mensais_referencia NUMERIC(8, 2) CHECK (horas_mensais_referencia > 0) NOT NULL,
    custo_hora_referencia NUMERIC(8, 2) CHECK (custo_hora_referencia > 0) NOT NULL,
    vinculado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_proj_user UNIQUE (proj_id, usuario_id)
);

CREATE TABLE etapa (
    etapa_id SERIAL PRIMARY KEY,
    proj_id INTEGER NOT NULL REFERENCES projeto(proj_id),
    tipo tipo_etapa NOT NULL,
    status status_etapa NOT NULL,
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ CHECK (
        data_fim IS NULL OR (data_inicio IS NOT NULL AND data_fim >= data_inicio)
    ),
    tempo_planejado INTEGER CHECK (tempo_planejado > 0) NOT NULL,
    CONSTRAINT uq_proj_etapa UNIQUE (proj_id, tipo)
);

CREATE TABLE execucao (
    execucao_id SERIAL PRIMARY KEY,
    etapa_id INTEGER NOT NULL REFERENCES etapa(etapa_id),
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    motivo_encerramento motivo_exec,
    CONSTRAINT chk_motivo CHECK (
        (data_fim IS NULL AND motivo_encerramento IS NULL)
        OR (data_fim IS NOT NULL AND motivo_encerramento IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_execucao_aberta
    ON execucao(etapa_id)
    WHERE data_fim IS NULL;

CREATE TABLE manutencao (
    mntnc_id SERIAL PRIMARY KEY,
    proj_id INTEGER NOT NULL REFERENCES projeto(proj_id),
    data_retorno DATE NOT NULL,
    motivo motivo_mntnc,
    descricao TEXT NOT NULL,
    status status_mntnc NOT NULL DEFAULT 'Aberta',
    data_conclusao DATE CHECK (
        data_conclusao IS NULL OR data_conclusao >= data_retorno
    )
);

CREATE TABLE notificacao (
    notf_id SERIAL PRIMARY KEY,
    usuario_destinatario_id INTEGER NOT NULL REFERENCES usuario(usuario_id),
    proj_id INTEGER NOT NULL REFERENCES projeto(proj_id),
    etapa_id INTEGER NOT NULL REFERENCES etapa(etapa_id),
    tipo tipo_notf NOT NULL,
    titulo VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lida_em TIMESTAMPTZ,
    enviada_push_em TIMESTAMPTZ,
    status_push status_push NOT NULL DEFAULT 'Pendente'
);
