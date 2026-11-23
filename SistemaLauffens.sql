
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TYPE public.motivo_exec AS ENUM (
    'Pausa',
    'Finalizado'
);

CREATE TYPE public.motivo_mntnc AS ENUM (
    'Ajuste',
    'Reparo',
    'Defeito',
    'Problema na instalação',
    'Outro'
);

CREATE TYPE public.perfil AS ENUM (
    'Administrador',
    'Marceneiro'
);

CREATE TYPE public.porte AS ENUM (
    'Pequeno',
    'Médio',
    'Grande'
);

CREATE TYPE public.status_etapa AS ENUM (
    'Planejada',
    'Em andamento',
    'Pausada',
    'Concluída'
);

CREATE TYPE public.status_mntnc AS ENUM (
    'Aberta',
    'Resolvida'
);

CREATE TYPE public.status_proj AS ENUM (
    'Planejado',
    'Em andamento',
    'Atrasado',
    'Concluído',
    'Cancelado'
);

CREATE TYPE public.status_push AS ENUM (
    'Pendente',
    'Enviada',
    'Falhou'
);

CREATE TYPE public.tipo_etapa AS ENUM (
    'Corte',
    'Fitagem',
    'Refinamento',
    'Embalamento'
);

CREATE TYPE public.tipo_notf AS ENUM (
    'Atraso',
    'Etapa concluída'
);

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.cliente (
    cliente_id integer NOT NULL,
    nome character varying(120) NOT NULL,
    cpf character(11) NOT NULL,
    telefone character varying(20)
);

CREATE SEQUENCE public.cliente_cliente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cliente_cliente_id_seq OWNED BY public.cliente.cliente_id;

CREATE TABLE public.etapa (
    etapa_id integer NOT NULL,
    proj_id integer NOT NULL,
    tipo public.tipo_etapa NOT NULL,
    status public.status_etapa NOT NULL,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    tempo_planejado numeric(10,2) NOT NULL,
    tempo_total_segundos numeric(16,3),
    CONSTRAINT etapa_check CHECK (((data_fim IS NULL) OR ((data_inicio IS NOT NULL) AND (data_fim >= data_inicio)))),
    CONSTRAINT etapa_tempo_planejado_check CHECK (((tempo_planejado >= 0.6) AND (tempo_planejado <= (600000)::numeric))),
    CONSTRAINT etapa_tempo_total_segundos_check CHECK ((tempo_total_segundos >= (0)::numeric))
);

CREATE SEQUENCE public.etapa_etapa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.etapa_etapa_id_seq OWNED BY public.etapa.etapa_id;

CREATE TABLE public.execucao (
    execucao_id integer NOT NULL,
    etapa_id integer NOT NULL,
    data_inicio timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_fim timestamp with time zone,
    motivo_encerramento public.motivo_exec,
    CONSTRAINT chk_motivo CHECK ((((data_fim IS NULL) AND (motivo_encerramento IS NULL)) OR ((data_fim IS NOT NULL) AND (motivo_encerramento IS NOT NULL)))),
    CONSTRAINT execucao_check CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio)))
);

CREATE SEQUENCE public.execucao_execucao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.execucao_execucao_id_seq OWNED BY public.execucao.execucao_id;

CREATE TABLE public.manutencao (
    mntnc_id integer NOT NULL,
    proj_id integer NOT NULL,
    data_retorno date NOT NULL,
    motivo public.motivo_mntnc,
    descricao text NOT NULL,
    status public.status_mntnc,
    data_conclusao date,
    CONSTRAINT manutencao_check CHECK (((data_conclusao IS NULL) OR (data_conclusao >= data_retorno)))
);

CREATE SEQUENCE public.manutencao_mntnc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.manutencao_mntnc_id_seq OWNED BY public.manutencao.mntnc_id;

CREATE TABLE public.notificacao (
    notf_id integer NOT NULL,
    usuario_destinatario_id integer NOT NULL,
    proj_id integer NOT NULL,
    etapa_id integer NOT NULL,
    tipo public.tipo_notf,
    titulo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    criada_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    lida_em timestamp with time zone,
    enviada_push_em timestamp with time zone,
    status_push public.status_push DEFAULT 'Pendente'::public.status_push
);

CREATE SEQUENCE public.notificacao_notf_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.notificacao_notf_id_seq OWNED BY public.notificacao.notf_id;

CREATE TABLE public.projeto (
    proj_id integer NOT NULL,
    cliente_id integer NOT NULL,
    criado_por_id integer NOT NULL,
    nome character varying(120) NOT NULL,
    porte public.porte NOT NULL,
    status public.status_proj NOT NULL,
    prazo_planejado date NOT NULL,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    valor_base numeric(9,2),
    custo_mao_de_obra_final numeric(9,2),
    valor_final numeric(9,2),
    CONSTRAINT projeto_check CHECK (((data_fim IS NULL) OR ((data_inicio IS NOT NULL) AND (data_fim >= data_inicio)))),
    CONSTRAINT projeto_custo_mao_de_obra_final_check CHECK ((custo_mao_de_obra_final >= (0)::numeric)),
    CONSTRAINT projeto_valor_base_check CHECK ((valor_base > (0)::numeric)),
    CONSTRAINT projeto_valor_final_check CHECK ((valor_final > (0)::numeric))
);

CREATE SEQUENCE public.projeto_proj_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.projeto_proj_id_seq OWNED BY public.projeto.proj_id;

CREATE TABLE public.projeto_user (
    proj_user_id integer NOT NULL,
    proj_id integer NOT NULL,
    usuario_id integer NOT NULL,
    salario_referencia numeric(8,2) NOT NULL,
    horas_mensais_referencia numeric(8,2) NOT NULL,
    custo_hora_referencia numeric(8,2) NOT NULL,
    vinculado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT projeto_user_custo_hora_referencia_check CHECK ((custo_hora_referencia > (0)::numeric)),
    CONSTRAINT projeto_user_horas_mensais_referencia_check CHECK ((horas_mensais_referencia > (0)::numeric)),
    CONSTRAINT projeto_user_salario_referencia_check CHECK ((salario_referencia > (0)::numeric))
);

CREATE SEQUENCE public.projeto_user_proj_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.projeto_user_proj_user_id_seq OWNED BY public.projeto_user.proj_user_id;

CREATE TABLE public.usuario (
    usuario_id integer NOT NULL,
    nome character varying(120) NOT NULL,
    cpf character(11) NOT NULL,
    telefone character varying(20),
    nascimento date,
    perfil public.perfil NOT NULL,
    login character varying(30) NOT NULL,
    senha character varying(255) NOT NULL,
    salario numeric(8,2) NOT NULL,
    horas_mensais numeric(8,2) NOT NULL,
    push_token text,
    ativo boolean DEFAULT true NOT NULL,
    CONSTRAINT usuario_horas_mensais_check CHECK ((horas_mensais > (0)::numeric)),
    CONSTRAINT usuario_salario_check CHECK ((salario > (0)::numeric))
);

CREATE SEQUENCE public.usuario_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuario_usuario_id_seq OWNED BY public.usuario.usuario_id;

ALTER TABLE ONLY public.cliente ALTER COLUMN cliente_id SET DEFAULT nextval('public.cliente_cliente_id_seq'::regclass);

ALTER TABLE ONLY public.etapa ALTER COLUMN etapa_id SET DEFAULT nextval('public.etapa_etapa_id_seq'::regclass);

ALTER TABLE ONLY public.execucao ALTER COLUMN execucao_id SET DEFAULT nextval('public.execucao_execucao_id_seq'::regclass);

ALTER TABLE ONLY public.manutencao ALTER COLUMN mntnc_id SET DEFAULT nextval('public.manutencao_mntnc_id_seq'::regclass);

ALTER TABLE ONLY public.notificacao ALTER COLUMN notf_id SET DEFAULT nextval('public.notificacao_notf_id_seq'::regclass);

ALTER TABLE ONLY public.projeto ALTER COLUMN proj_id SET DEFAULT nextval('public.projeto_proj_id_seq'::regclass);

ALTER TABLE ONLY public.projeto_user ALTER COLUMN proj_user_id SET DEFAULT nextval('public.projeto_user_proj_user_id_seq'::regclass);

ALTER TABLE ONLY public.usuario ALTER COLUMN usuario_id SET DEFAULT nextval('public.usuario_usuario_id_seq'::regclass);

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_cpf_key UNIQUE (cpf);

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (cliente_id);

ALTER TABLE ONLY public.etapa
    ADD CONSTRAINT etapa_pkey PRIMARY KEY (etapa_id);

ALTER TABLE ONLY public.execucao
    ADD CONSTRAINT execucao_pkey PRIMARY KEY (execucao_id);

ALTER TABLE ONLY public.manutencao
    ADD CONSTRAINT manutencao_pkey PRIMARY KEY (mntnc_id);

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT notificacao_pkey PRIMARY KEY (notf_id);

ALTER TABLE ONLY public.projeto
    ADD CONSTRAINT projeto_pkey PRIMARY KEY (proj_id);

ALTER TABLE ONLY public.projeto_user
    ADD CONSTRAINT projeto_user_pkey PRIMARY KEY (proj_user_id);

ALTER TABLE ONLY public.etapa
    ADD CONSTRAINT uq_proj_etapa UNIQUE (proj_id, tipo);

ALTER TABLE ONLY public.projeto_user
    ADD CONSTRAINT uq_proj_user UNIQUE (proj_id, usuario_id);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_cpf_key UNIQUE (cpf);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_login_key UNIQUE (login);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (usuario_id);

CREATE UNIQUE INDEX uq_execucao_aberta ON public.execucao USING btree (etapa_id) WHERE (data_fim IS NULL);

ALTER TABLE ONLY public.etapa
    ADD CONSTRAINT fk_etapa_proj FOREIGN KEY (proj_id) REFERENCES public.projeto(proj_id);

ALTER TABLE ONLY public.execucao
    ADD CONSTRAINT fk_exec_etapa FOREIGN KEY (etapa_id) REFERENCES public.etapa(etapa_id);

ALTER TABLE ONLY public.manutencao
    ADD CONSTRAINT fk_mntnc_proj FOREIGN KEY (proj_id) REFERENCES public.projeto(proj_id);

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT fk_notf_etapa FOREIGN KEY (etapa_id) REFERENCES public.etapa(etapa_id);

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT fk_notf_proj FOREIGN KEY (proj_id) REFERENCES public.projeto(proj_id);

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT fk_notf_user FOREIGN KEY (usuario_destinatario_id) REFERENCES public.usuario(usuario_id);

ALTER TABLE ONLY public.projeto
    ADD CONSTRAINT fk_projeto_cliente FOREIGN KEY (cliente_id) REFERENCES public.cliente(cliente_id);

ALTER TABLE ONLY public.projeto
    ADD CONSTRAINT fk_projeto_usuario FOREIGN KEY (criado_por_id) REFERENCES public.usuario(usuario_id);

ALTER TABLE ONLY public.projeto_user
    ADD CONSTRAINT fk_projuser_proj FOREIGN KEY (proj_id) REFERENCES public.projeto(proj_id);

ALTER TABLE ONLY public.projeto_user
    ADD CONSTRAINT fk_projuser_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(usuario_id);

INSERT INTO public.usuario (nome, cpf, perfil, login, senha, salario, horas_mensais)
VALUES
('Administrador', '00000000001', 'Administrador', 'demo.marice', '$2b$10$HLcR3k25X.TqU/FxwIpskuWSYAK7P4wcBGDcDvvXJ6SZiE3kFmage', 3000.00, 220.00),
('Marceneiro', '00000000002', 'Marceneiro', 'marceneiro', '$2b$10$5/YWdSG5iPpsWpzgMgyFjOsq1.6WF5n4U2L.NDRaE8CFgaIyglkki', 2500.00, 220.00);

INSERT INTO public.cliente (nome, cpf, telefone) VALUES ('Cliente Exemplo', '00000000003', '49988887777');
