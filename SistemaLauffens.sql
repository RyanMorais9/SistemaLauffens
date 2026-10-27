drop table if exist cliente;
drop table if exist etapa;
drop table if exist execucao;
drop table if exist manutencao;
drop table if exist notificacao;
drop table if exist projeto;
drop table if exist projeto_user;
drop table if exist usuario;


create type perfil as enum('Administrador', 'Marceneiro');
create table usuario();

create table cliente();

create type porte as enum('Pequeno', 'Médio', 'Grande');
create type status_proj as enum('Planejado', 'Em andamento', 'Atrasado', 'Concluído');
create table projeto();

create table projeto_user();

create type tipo_etapa as enum('Corte', 'Fitagem', 'Refinamento', 'Embalamento');
create type status_etapa as enum('Planejada', 'Em andamento', 'Pausada', 'Concluída')
create table etapa();

create table execucao();

create type status_manunt as enum('Aberta', 'Resolvida');
create table manutencao();

create type tipo_notf as enum('Atraso', 'Etapa concluída');
create type status_push as enum('Pendente', 'Enviada', 'Falhou');
create table notificacaoo();