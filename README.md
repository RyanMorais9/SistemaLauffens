# SistemaLauffens

Sistema de acompanhamento da produção de móveis da Lauffens, com projetos, etapas, controle de tempo, manutenção, custos de mão de obra e notificações.

## O que foi implementado pelos membros
Ryan Morais = database(completo), cliente, auth, projeto, projeto_user, usuario, manutencao

Eduardo Mariano = notificacao, execucao, etapa

## Guia das operações a implementar

Este documento é um roteiro de desenvolvimento, não uma lista de funcionalidades já concluídas. As operações abaixo consideram o SQL do projeto e os requisitos da pasta `Documentos/TodasInformaçõesIntegrador`. As sugestões complementares estão identificadas como tal.

Não é necessário criar CRUD completo para todas as tabelas. Algumas operações são ações do sistema, como iniciar uma execução, concluir uma etapa ou gerar uma notificação.

### Cliente

Operações de apoio ao cadastro dos projetos:

- **Cadastrar:** receber nome, CPF e telefone. Nome e CPF são obrigatórios; CPF não pode repetir.
- **Listar:** apresentar os clientes, inicialmente em ordem alfabética.
- **Buscar por ID:** consultar os dados de um cliente.
- **Buscar por CPF:** localizar um cliente pelo CPF, tratado como texto para preservar zeros no início.
- **Editar:** atualizar nome, CPF e telefone, mantendo a regra de CPF único.
- **Consultar projetos do cliente:** consulta complementar útil para mostrar seu histórico.
- **Contar:** opcional, caso uma tela precise apresentar a quantidade de clientes.

Exclusão não faz parte do escopo inicial proposto. Se for adicionada, definir como tratar clientes com projetos vinculados antes de implementar.

### Usuário

Requisitos relacionados: RF01, RF02 e RF19.

- **Cadastrar:** registrar identificação, credenciais, perfil, salário e horas mensais. CPF e login devem ser únicos; salário e horas mensais devem ser positivos.
- **Listar e buscar:** consultar usuários sem devolver senha ou seu hash nas respostas.
- **Editar:** atualizar os dados permitidos conforme o perfil do usuário autenticado.
- **Atualizar salário e horas mensais:** preservar as referências já registradas em projetos anteriores.
- **Autenticar:** conferir as credenciais e disponibilizar as funcionalidades conforme as permissões. Armazenar senha como hash, nunca em texto puro.
- **Registrar ou atualizar push_token:** associar o dispositivo ao recebimento de notificações.
- **Desativar:** sugestão para impedir novos acessos usando `ativo = false`, preservando o histórico. A autenticação deve considerar esse campo.

Não prever exclusão física de usuários no fluxo inicial. A política de quem pode cadastrar e alterar perfis precisa ser definida na implementação das permissões.

### Projeto

Requisitos relacionados: RF03, RF04, RF07 a RF11, RF13, RF18, RF21 e RF23.

- **Cadastrar:** associar cliente, usuário criador, nome, porte, prazo e planejamento das etapas.
- **Listar e buscar por ID:** apresentar identificação, status, etapa em execução e tempos registrados.
- **Filtrar e ordenar:** permitir acompanhamento por status, porte e critérios de tempo conforme as telas.
- **Editar:** alterar os dados permitidos do projeto e seu planejamento.
- **Registrar valor-base:** informar o valor utilizado no cálculo final.
- **Gerenciar status:** controlar as transições entre Planejado, Em andamento, Atrasado e Concluído conforme as regras de execução.
- **Registrar início automaticamente:** usar o início da primeira etapa.
- **Finalizar:** verificar se todas as etapas estão concluídas, registrar a data final e preservar o histórico.
- **Calcular e registrar valores finais:** somar o valor-base ao custo de mão de obra ao concluir o projeto.

Não oferecer edição livre dos tempos e valores calculados no cadastro comum. Exclusão de projetos não está prevista nos requisitos consultados.

O cadastro aceita a ausência de `valor_base`, representada por `null` no model. Quando informado, o valor deve ser positivo e conter até duas casas decimais. O primeiro preenchimento pode ocorrer durante a produção ou após seu término, antes da conclusão financeira. Um valor já preenchido só pode ser alterado antes do início. Projetos concluídos ou cancelados não podem ser editados.

### API de projetos

Rotas de consulta exigem JWT. Cadastro, edição, valor-base e gerenciamento de status exigem também perfil Administrativo.

| Método e rota | Comportamento |
|---|---|
| `POST /projetos` | Cadastra projeto e as quatro etapas em uma única transação. |
| `GET /projetos` | Lista projetos com cliente, etapas, etapa atual e tempos acumulados. |
| `GET /projetos/:id` | Retorna o mesmo acompanhamento para um projeto. |
| `PATCH /projetos/:id` | Edita nome, porte, prazo e valor-base, respeitando o estado do projeto. O planejamento das etapas é editado pelas rotas de etapas. |
| `POST /projetos/:id` | Informa `valor_base`. |
| `PUT /projetos/:id` | Recebe `status` e valida a transição. |

Exemplo de cadastro (tempos em minutos):

```json
{
  "nome": "Cozinha planejada",
  "cliente_id": 1,
  "porte": "Médio",
  "prazo_planejado": "2027-03-20",
  "etapas": [
    { "tipo": "Corte", "tempo_planejado": 270 },
    { "tipo": "Fitagem", "tempo_planejado": 180 },
    { "tipo": "Refinamento", "tempo_planejado": 180 },
    { "tipo": "Embalamento", "tempo_planejado": 120 }
  ]
}
```

As quatro etapas são obrigatórias, sem tipos duplicados. Se qualquer gravação falhar, o cadastro inteiro é desfeito. O cliente precisa existir. `valor_base` é opcional no cadastro; não envie zero como substituto.

Filtros de `GET /projetos`: `status`, `porte`, `data_inicio`, `data_fim`, `ordenar_por=tempo|data_inicio` e `ordem=asc|desc`. Datas usam dias em UTC, incluindo o dia final. A ordenação por tempo considera os períodos trabalhados dentro do intervalo selecionado; o total histórico permanece em `tempo_total_segundos`.

O acompanhamento calcula o status `Atrasado` ao consultar, se o prazo de entrega já passou ou uma etapa ultrapassou seu tempo planejado. Isso não dispara notificações nem depende de uma tarefa em segundo plano. O filtro de status usa esse mesmo cálculo. Projetos concluídos e cancelados preservam seu status.

O início permanece automático pela primeira etapa. Não é permitido voltar a Planejado após haver execução, iniciar manualmente ou marcar Concluído pelo gerenciamento de status. O cancelamento é definitivo: encerra períodos abertos como Pausa e deixa a etapa correspondente Pausada, preservando seu histórico, na mesma transação. Um projeto em atraso não pode receber status Planejado/Em andamento sem corrigir a causa do atraso.

A conclusão automática permanece em `etapas.service.js`. Se faltar apenas o valor-base, a produção pode terminar e a resposta identifica a pendência; depois de informar o valor, `POST /etapas/projeto/:projetoId/concluir` repete os cálculos e preserva a data original do fim da produção. Funcionários vinculados são obrigatórios desde o início.

### Participação no projeto — projeto_user

Requisitos relacionados: RF19, RF20 e RF22.

- **Vincular funcionário:** associar um marceneiro a um projeto.
- **Salvar as referências:** registrar salário, horas mensais e custo por hora utilizados naquele vínculo, a partir dos dados do funcionário. O custo por hora é salário dividido pelas horas mensais.
- **Listar participantes do projeto:** consultar os funcionários e suas referências de custo.
- **Listar participações do usuário:** mostrar os projetos aos quais o funcionário está vinculado.
- **Buscar vínculo:** consultar uma participação específica quando necessário.

O mesmo usuário não pode ser vinculado duas vezes ao mesmo projeto (`UNIQUE(proj_id, usuario_id)`). As referências não devem ser recalculadas automaticamente quando o salário atual do usuário mudar.

A implementação pronta de `src/projeto_user/` foi revertida para que o módulo seja construído passo a passo pelo autor. O model foi mantido; os quatro arquivos de routes, controller, service e repository estão vazios e ainda não estão conectados ao `index.js`. A tabela abaixo é um roteiro de rotas propostas, ainda não disponíveis. As permissões previstas são JWT e perfil Administrativo, pois as consultas apresentam referências salariais.

| Método e rota | Comportamento |
|---|---|
| `POST /projetos-usuarios` | Recebe somente `proj_id` e `usuario_id`; vincula um marceneiro ativo e grava as referências atuais. |
| `GET /projetos-usuarios/projeto/:projetoId` | Lista a equipe do projeto. |
| `GET /projetos-usuarios/usuario/:usuarioId` | Lista participações do funcionário. |
| `GET /projetos-usuarios/:id` | Consulta o vínculo por `proj_user_id`. |
| `DELETE /projetos-usuarios/:id` | Remove o vínculo somente antes do início da produção. |

Regra planejada para a implementação: depois do início, a equipe fica congelada, impedindo adicionar, remover ou editar referências salariais. O sistema deverá calcular `custo_hora_referencia = salario / horas_mensais`, arredondado em duas casas decimais conforme o model. Alterar o salário atual do funcionário não altera vínculos anteriores. Senhas não são incluídas nas consultas.

As operações de equipe deverão coordenar o bloqueio do projeto na transação com o início de etapa e o cancelamento, evitando remover o último funcionário ao mesmo tempo em que a produção inicia. Não deverá existir rota para enviar manualmente salário ou custo de referência.

### Etapa

Requisitos relacionados: RF03, RF05, RF06, RF09 e RF13.

- **Criar o planejamento:** cadastrar as etapas do projeto e seus tempos planejados em minutos. Essa criação pode fazer parte do cadastro do projeto, sem exigir uma rota independente.
- **Listar por projeto e buscar por ID:** consultar status, planejamento e tempos registrados.
- **Editar o planejamento:** alterar os dados permitidos antes ou durante a execução, conforme uma regra definida para o projeto.
- **Iniciar, pausar e retomar:** coordenar o status da etapa com os registros de execução.
- **Concluir:** encerrar a execução aberta, registrar a data final, atualizar o status e permitir o prosseguimento para a próxima etapa.
- **Consultar tempo acumulado:** somar os períodos de execução, sem contabilizar as pausas.

Tipos disponíveis: Corte, Fitagem, Refinamento e Embalamento. Um projeto não pode ter duas etapas do mesmo tipo. O tempo planejado deve ser positivo.

O tempo realizado é calculado pelas execuções e consolidado em `tempo_total_segundos` na conclusão da etapa. Não prever exclusão livre de etapas que já possuem histórico.

### API de etapas e execuções

Todas as rotas de etapas e execuções exigem `Authorization: Bearer <token>`. Cadastro e edição do planejamento exigem perfil Administrativo.

- `tempo_planejado` continua em **minutos**, agora entre `0.6` e `600000`, com até duas casas decimais. Isso representa de 0,01 a 10000 horas. Exemplo: 4,5 horas devem ser enviadas como `270` minutos.
- `GET /etapas` e `GET /etapas/projeto/:projetoId` incluem identificação do projeto, tempo acumulado, tempo no período e indicação `excedeu_planejamento`.
- Filtros: `proj_id` (na listagem geral), `porte`, `data_inicio`, `data_fim`, `ordenar_por=tempo|data_inicio`, `ordem=asc|desc`. Datas usam `AAAA-MM-DD`, em UTC; o dia final é incluído. São selecionadas etapas com períodos de trabalho que intersectam o intervalo. `tempo_periodo_segundos` contabiliza apenas a parte trabalhada dentro dele; `tempo_total_segundos` mantém o histórico completo.
- Exemplo: `GET /etapas?data_inicio=2026-11-01&data_fim=2026-11-30&ordenar_por=tempo&ordem=desc`.
- Iniciar, retomar ou concluir uma etapa exige ao menos um funcionário vinculado ao projeto. Sem vínculo, a operação retorna `409`, preservando o estado anterior. A conclusão da última etapa registra o fim da produção e retorna `finalizacao_projeto`, indicando se o projeto foi concluído ou se há outra pendência financeira.
- `POST /etapas/projeto/:projetoId/concluir` permite repetir a finalização após resolver a pendência. Exige todas as etapas concluídas, calcula os valores no servidor e preserva o horário original do fim da produção. Não recebe datas ou valores finais do cliente.
- A alteração manual do status do projeto não permite `Concluído`, nem reabrir um projeto concluído.

Os models em `database/models/` são a referência da implementação. `SistemaLauffens.sql` é um rascunho da estrutura.

A indicação de tempo excedido fornece dados para as notificações; geração de avisos, envio push e central de notificações pertencem ao módulo de notificações, ainda pendente.

### Execução

Requisitos relacionados: RF05, RF06 e RF22.

- **Iniciar:** criar um período de execução com data inicial e sem data final.
- **Consultar execução aberta:** identificar se a etapa está com cronômetro em andamento.
- **Pausar:** encerrar o período aberto, preenchendo data final e motivo `Pausa`.
- **Retomar:** criar um novo período de execução para a mesma etapa, preservando os anteriores.
- **Finalizar:** encerrar o período aberto com motivo `Finalizado`, em conjunto com a conclusão da etapa.
- **Listar por etapa e buscar por ID:** consultar o histórico dos períodos.
- **Calcular duração:** obter o tempo de cada período e o total da etapa, considerando também o período aberto quando a consulta pedir o tempo em andamento.

Só pode existir uma execução aberta por etapa. Data final e motivo de encerramento devem ser preenchidos juntos; o fim não pode ser anterior ao início. As alterações de execução e status da etapa devem ser consistentes, usando transação quando forem realizadas em conjunto.

O cronômetro é compartilhado por etapa, sem identificação individual do marceneiro, conforme RF05. Não criar CRUD genérico que permita editar ou excluir períodos livremente.

### Manutenção

Requisito relacionado: RF12.

- **Registrar retorno:** associar a manutenção ao projeto e registrar data de retorno, motivo e descrição.
- **Listar:** consultar manutenções, com filtros úteis por projeto e status.
- **Buscar por ID:** consultar os detalhes de um retorno.
- **Editar:** corrigir as informações permitidas da manutenção.
- **Marcar como resolvida:** atualizar status e data de conclusão.

Manter o vínculo com o projeto mesmo após a conclusão dele. A data de conclusão da manutenção não pode ser anterior à data de retorno. A operação de resolução é uma proposta para utilizar os campos de status e conclusão existentes no banco.

Exclusão não está prevista no escopo inicial.

### Notificação

Requisitos relacionados: RF14, RF24 e RF25.

- **Gerar automaticamente:** criar avisos de atraso e conclusão de etapa, identificando destinatário, projeto e etapa quando aplicável.
- **Listar as recebidas:** consultar apenas as notificações que o usuário autenticado tem permissão para visualizar.
- **Buscar por ID:** consultar um aviso, verificando o destinatário.
- **Filtrar não lidas:** selecionar registros com `lida_em` nulo.
- **Marcar como lida:** preencher `lida_em` após a leitura.
- **Contar não lidas:** consulta complementar útil para o indicador da interface.
- **Enviar push e registrar resultado:** enviar quando houver dispositivo habilitado e atualizar status e data do envio conforme o resultado.

Uma lista vazia é um resultado normal; a interface deve informar que não há avisos. Não disponibilizar cadastro manual, edição livre de conteúdo ou exclusão como CRUD inicial. A geração e o envio são ações internas do sistema.

**Decisão pendente:** o SQL exige `etapa_id` em toda notificação. Se um aviso de atraso do projeto puder existir sem etapa específica, ajustar essa obrigatoriedade no banco e no model.

### Dashboard e cálculos

Requisitos relacionados: RF15 a RF18 e RF22.

- Consultar tempos por etapa e projeto.
- Filtrar por períodos predefinidos ou personalizados e por porte do projeto.
- Ordenar por duração crescente ou decrescente.
- Comparar o tempo planejado com o realizado.
- Calcular custo de mão de obra usando o tempo efetivo do cronômetro compartilhado e a soma dos custos por hora de referência dos participantes, com unidades de tempo consistentes.

Essas funcionalidades são consultas e cálculos; não precisam de uma tabela ou CRUD próprio. A regra para mudanças de participantes durante a execução precisa ser resolvida antes de aplicar o cálculo a esses casos.

## Responsabilidade de cada arquivo do src

| Arquivo | Responsabilidade |
|---|---|
| `*.routes.js` | Definir os endereços e métodos HTTP e encaminhar ao controller. |
| `*.controller.js` | Ler parâmetros e corpo da requisição, chamar o service e responder com status HTTP e JSON. |
| `*.service.js` | Aplicar regras de negócio, permissões e coordenar operações e transações. |
| `*.repository.js` | Consultar e alterar o banco usando os models Sequelize. |

Fluxo: `rota → controller → service → repository → model → banco`.

Não é obrigatório criar uma rota para cada método do repository. Métodos internos podem existir apenas para apoiar uma operação do service.

## Respostas HTTP básicas

| Status | Quando usar |
|---|---|
| `200` | Consulta ou atualização bem-sucedida. Listagens sem registros retornam `[]`. |
| `201` | Registro criado com sucesso. |
| `400` | Dados ou parâmetros inválidos. |
| `401` | Autenticação ausente ou inválida. |
| `403` | Usuário autenticado sem permissão para a operação. |
| `404` | Registro específico não encontrado. |
| `409` | Duplicidade ou conflito com o estado atual, como CPF repetido ou execução já aberta. |
| `500` | Falha interna inesperada; registrar o erro técnico no servidor e enviar uma mensagem geral ao cliente. |

## Ordem sugerida de desenvolvimento

1. Cliente: cadastro, listagem, busca e edição.
2. Usuário: cadastro, autenticação e permissões.
3. Projeto e planejamento das etapas.
4. Participantes e referências de custo.
5. Execução: iniciar, pausar, retomar e concluir.
6. Finalização do projeto e cálculo dos valores.
7. Manutenção.
8. Notificações, dashboard e filtros.

Antes de integrar cada módulo, carregar os models e executar suas associações. Implementar as permissões antes de disponibilizar operações restritas.
