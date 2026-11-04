# SistemaLauffens

Sistema de acompanhamento da produção de móveis da Lauffens, com projetos, etapas, controle de tempo, manutenção, custos de mão de obra e notificações.

## O que foi implementado pelos membros
Ryan Morais = database(completo), cliente, auth, projeto, projeto_user, usuario

Eduardo Mariano = notificacao, manutencao, execucao, etapa

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

**Decisão pendente:** RF21 permite informar o valor-base depois do cadastro, mas o SQL atual exige `valor_base NOT NULL` e positivo. Escolher entre exigir esse valor ao cadastrar ou ajustar o banco para permitir preenchimento posterior. Não usar zero como substituto, pois o CHECK o rejeita.

### Participação no projeto — projeto_user

Requisitos relacionados: RF19, RF20 e RF22.

- **Vincular funcionário:** associar um marceneiro a um projeto.
- **Salvar as referências:** registrar salário, horas mensais e custo por hora utilizados naquele vínculo, a partir dos dados do funcionário. O custo por hora é salário dividido pelas horas mensais.
- **Listar participantes do projeto:** consultar os funcionários e suas referências de custo.
- **Listar participações do usuário:** mostrar os projetos aos quais o funcionário está vinculado.
- **Buscar vínculo:** consultar uma participação específica quando necessário.

O mesmo usuário não pode ser vinculado duas vezes ao mesmo projeto (`UNIQUE(proj_id, usuario_id)`). As referências não devem ser recalculadas automaticamente quando o salário atual do usuário mudar.

**Decisão pendente:** definir se será permitido remover ou alterar participantes depois do início da produção e como preservar o cálculo histórico. Remoção de vínculo não deve ser um DELETE liberado sem essa regra.

### Etapa

Requisitos relacionados: RF03, RF05, RF06, RF09 e RF13.

- **Criar o planejamento:** cadastrar as etapas do projeto e seus tempos planejados em minutos. Essa criação pode fazer parte do cadastro do projeto, sem exigir uma rota independente.
- **Listar por projeto e buscar por ID:** consultar status, planejamento e tempos registrados.
- **Editar o planejamento:** alterar os dados permitidos antes ou durante a execução, conforme uma regra definida para o projeto.
- **Iniciar, pausar e retomar:** coordenar o status da etapa com os registros de execução.
- **Concluir:** encerrar a execução aberta, registrar a data final, atualizar o status e permitir o prosseguimento para a próxima etapa.
- **Consultar tempo acumulado:** somar os períodos de execução, sem contabilizar as pausas.

Tipos disponíveis: Corte, Fitagem, Refinamento e Embalamento. Um projeto não pode ter duas etapas do mesmo tipo. O tempo planejado deve ser positivo.

O tempo realizado pode ser calculado pelas execuções; o SQL atual não possui uma coluna de tempo total na etapa. Não prever exclusão livre de etapas que já possuem histórico.

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
