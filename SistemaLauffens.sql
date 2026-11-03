/*Excluir tabelas se existirem*/
drop table if exists cliente;
drop table if exists etapa;
drop table if exists execucao;
drop table if exists manutencao;
drop table if exists notificacao;
drop table if exists projeto;
drop table if exists projeto_user;
drop table if exists usuario;

/*Excluir tipos se existirem*/
drop type if exists status_push;
drop type if exists tipo_notf;
drop type if exists status_mntnc;
drop type if exists motivo_mntnc;
drop type if exists motivo_exec;
drop type if exists status_etapa;
drop type if exists tipo_etapa;
drop type if exists status_proj;
drop type if exists porte;
drop type if exists perfil;



create type perfil as enum('Administrador', 'Marceneiro');
create table usuario(
    usuario_id serial primary key, 
    nome varchar(120) not null, 
    cpf char(11) unique not null, 
    telefone varchar(20), 
    nascimento date, 
    perfil perfil not null,
    login varchar(30) unique not null,
    senha varchar(255) not null,
    salario numeric(8, 2) check(salario > 0) not null,
    horas_mensais numeric(8, 2) check(horas_mensais > 0) not null,
    push_token text, /* armazena o identificador de um dispositivo para notificações, usuario nao precisa preencher */
    ativo boolean not null default true
    );

create table cliente(
    cliente_id serial primary key, 
    nome varchar(120) not null, 
    cpf char(11) unique not null, 
    telefone varchar(20)
);

create type porte as enum('Pequeno', 'Médio', 'Grande');
create type status_proj as enum('Planejado', 'Em andamento', 'Atrasado', 'Cancelado', 'Concluído');
create table projeto(
    proj_id serial primary key, 
    cliente_id integer not null,
    criado_por_id integer not null,
    nome varchar(120) not null,
    porte porte not null,
    status status_proj not null,
    prazo_planejado date not null, /* data planejada para fim*/
    data_inicio timestamptz,
    data_fim timestamptz check(data_fim is null or (data_inicio is not null and data_fim >= data_inicio)),
    valor_base numeric(9, 2) check(valor_base > 0) not null,
    custo_mao_de_obra_final numeric(9, 2) check(custo_mao_de_obra_final > 0),
    valor_final numeric(9, 2) check(valor_final > 0),

    constraint fk_projeto_cliente foreign key(cliente_id) references cliente(cliente_id),
    constraint fk_projeto_usuario foreign key(criado_por_id) references usuario(usuario_id)
);

create table projeto_user(
    proj_user_id serial primary key,
    proj_id integer not null,
    usuario_id integer not null,
    salario_referencia numeric(8, 2) check(salario_referencia > 0) not null,
    horas_mensais_referencia numeric(8, 2) check(horas_mensais_referencia > 0) not null,
    custo_hora_referencia numeric(8, 2) check(custo_hora_referencia > 0) not null,
    vinculado_em timestamptz not null default current_timestamp,

    constraint fk_projUser_proj foreign key(proj_id) references projeto(proj_id),
    constraint fk_projUser_usuario foreign key(usuario_id) references usuario(usuario_id),
    constraint uq_proj_user unique(proj_id, usuario_id) /* vários funcionários podem participar de um projeto, mas o mesmo funcionário não será cadastrado duas vezes no mesmo projeto. */
);

create type tipo_etapa as enum('Corte', 'Fitagem', 'Refinamento', 'Embalamento');
create type status_etapa as enum('Planejada', 'Em andamento', 'Pausada', 'Concluída');
create table etapa(
    etapa_id serial primary key,
    proj_id integer not null,
    tipo tipo_etapa not null,
    status status_etapa not null,
    data_inicio timestamptz,
    data_fim timestamptz check(data_fim is null or (data_inicio is not null and data_fim >= data_inicio)),
    tempo_planejado integer check(tempo_planejado > 0) not null, /* minutos */

    constraint fk_etapa_proj foreign key(proj_id) references projeto(proj_id),
    constraint uq_proj_etapa unique(proj_id, tipo) /* permite cadastrar Corte, Fitagem, Refinamento e Embalamento para o mesmo projeto, mas impede duas etapas de Corte no mesmo projeto. */
);

create type motivo_exec as enum('Pausa', 'Finalizado');
create table execucao(
    execucao_id serial primary key,
    etapa_id integer not null,
    data_inicio timestamptz not null default current_timestamp,   
    data_fim timestamptz check(data_fim is null or data_fim >= data_inicio),
    motivo_encerramento motivo_exec,

    constraint fk_exec_etapa foreign key(etapa_id) references etapa(etapa_id),

    constraint chk_motivo check(
        (data_fim is null and motivo_encerramento is null)
        or
        (data_fim is not null and motivo_encerramento is not null)
    )  
);
create unique index uq_execucao_aberta
on execucao(etapa_id)
where data_fim is null;

/* não impede uma etapa de ter várias execuções, 
oque seria o caso de adicionar apenas um unique em etapa_id. 
Ele apenas garante que uma etapa nunca tenha 
duas execuções abertas simultaneamente, */

create type motivo_mntnc as enum('Ajuste','Reparo','Defeito','Problema na instalação', 'Outro');
create type status_mntnc as enum('Aberta', 'Resolvida');
create table manutencao(
    mntnc_id serial primary key,
    proj_id integer not null,
    data_retorno date not null,
    motivo motivo_mntnc, 
    descricao text not null,
    status status_mntnc,
    data_conclusao date check(data_conclusao is null or data_conclusao >= data_retorno),

    constraint fk_mntnc_proj foreign key(proj_id) references projeto(proj_id)
);

create type tipo_notf as enum('Atraso', 'Etapa concluída');
create type status_push as enum('Pendente', 'Enviada', 'Falhou');
create table notificacao(
    notf_id serial primary key,
    usuario_destinatario_id integer not null,
    proj_id integer not null,
    etapa_id integer not null,
    tipo tipo_notf,
    titulo varchar(50) not null,
    mensagem text not null,
    criada_em timestamptz not null default current_timestamp,
    lida_em timestamptz,
    enviada_push_em timestamptz,
    status_push status_push default 'Pendente',

    constraint fk_notf_user foreign key(usuario_destinatario_id) references usuario(usuario_id),
    constraint fk_notf_proj foreign key(proj_id) references projeto(proj_id),
    constraint fk_notf_etapa foreign key(etapa_id) references etapa(etapa_id)
);
