# FreelaCash - A Plataforma de Pagamentos para a Economia Gig
FreelaCash é um sistema de pagamento P2P projetado para a economia gig, conectando freelancers a clientes para a realização de pequenos e médios projetos. Nossa plataforma atua como um intermediário de confiança, garantindo que o pagamento seja efetuado e que o trabalho seja entregue com segurança e transparência.

## 2. Conceito e Funcionalidade

A ideia central do FreelaCash é eliminar a insegurança nas transações entre clientes e freelancers. Para isso, utilizamos um **sistema de custódia (escrow)** como pilar de segurança:

1.  **Acordo:** Cliente e freelancer definem o escopo e o valor do projeto.
2.  **Depósito Seguro:** O cliente deposita o pagamento na plataforma FreelaCash, onde o valor fica retido de forma segura. Isso garante ao freelancer que os fundos para o seu trabalho estão disponíveis.
3.  **Execução:** Com o pagamento garantido, o freelancer executa e entrega o projeto.
4.  **Liberação:** Após o cliente aprovar a entrega, a FreelaCash transfere o valor instantaneamente, via P2P, para a carteira digital do freelancer.

Esse processo protege o cliente de não receber o trabalho e o freelancer de não ser pago por seu esforço.

## 3. Objetivo

Construir um ecossistema de transações seguro e transparente para o mercado freelancer, resolvendo o problema da desconfiança mútua entre clientes e prestadores de serviço. Para isso, o sistema irá:

* **Para o Cliente:** Garantir que o valor investido só seja liberado após o recebimento e aprovação formal do projeto, assegurando a entrega e a conformidade com o que foi solicitado.
* **Para o Freelancer:** Assegurar o pagamento integral pelo trabalho concluído, eliminando o risco de inadimplência ou atrasos após a entrega ser aprovada.
* **Como Mecanismo:** Automatizar este fluxo através de um sistema de custódia (escrow), onde os fundos ficam retidos de forma neutra pela plataforma até que os critérios de conclusão do projeto sejam cumpridos e validados pelo cliente.

## 4. Principais Funcionalidades

-   **Carteira Digital Integrada:** Cada usuário (cliente e freelancer) possui uma carteira na plataforma para gerenciar depósitos, saldos e saques.
-   **Sistema de Pagamento em Custódia (Escrow):** O valor do projeto é mantido em segurança pela plataforma até a aprovação final do cliente.
-   **Transferências P2P Instantâneas:** O pagamento é liberado para o freelancer no momento da aprovação, sem demoras.
-   **Score de Reputação:** Essencial no nosso modelo. Freelancers constroem um score baseado em entregas bem-sucedidas e no prazo. Clientes são avaliados pela rapidez nos pagamentos e justiça nas avaliações. Um bom score atrai os melhores profissionais e projetos.
-   **Segurança e Antifraude:** Além do escrow, a plataforma monitora o comportamento dos usuários para sinalizar atividades suspeitas (ex: um cliente que abre muitas disputas ou um freelancer que nunca entrega os projetos).
-   **Dashboard de Gerenciamento:** Um painel de controle para que usuários acompanhem o andamento dos projetos, histórico de transações e a evolução de sua reputação.

## 5. Arquitetura da Solução

A arquitetura do FreelaCash foi desenhada para ser escalável, segura e de alta performance.

-   **Frontend (Aplicação Web):** A interface com o usuário, desenvolvida com tecnologias modernas para garantir uma experiência rica e responsiva. É aqui que clientes e freelancers gerenciam seus projetos e finanças.
-   **Backend (API Server):** O cérebro da operação. Responsável por toda a lógica de negócio, incluindo o gerenciamento de usuários, projetos, o sistema de escrow e as transações financeiras.
-   **Banco de Dados:** O sistema de armazenamento de dados, projetado para garantir a integridade e a segurança das informações financeiras e dos usuários.
-   **Gateway de Pagamento:** Serviço externo integrado para processar os depósitos iniciais dos clientes na plataforma (via Pix, cartão de crédito, etc.).

## 6. Tecnologias Utilizadas

| Camada         | Tecnologia                             | Descrição                                                     |
| :------------- | :------------------------------------- | :------------------------------------------------------------ |
| **Frontend** | HTML com JavaScript, CSS  | Para uma interface de usuário moderna, reativa e de fácil manutenção. |
| **Backend** | Python com Flask                       | Para uma API RESTful robusta, segura e escalável.             |
| **Banco de Dados** | MySQL ou PostgreSQL                  | Sistemas de banco de dados relacionais confiáveis para transações (ACID). |
| **Cache** | Redis                                  | Para otimizar a performance, gerenciando sessões e dados em cache. |
| **Infraestrutura** | Cloud (AWS, Google Cloud), Docker    | Para garantir escalabilidade, disponibilidade e fácil implantação. |

## 7. Estrutura do Banco de Dados

O banco de dados é o coração do sistema, e sua estrutura foi pensada para suportar operações financeiras com segurança.

<img width="947" height="915" alt="image" src="https://github.com/user-attachments/assets/0a30e4b7-b53e-4ec5-a0ba-66d8668a3b33" />

## 8. Descrição das Entidades:

### USERS
Armazena informações dos usuários da plataforma.

- **user_id (PK)**: Identificador único do usuário
- **name**: Nome completo do usuário
- **email**: Endereço de e-mail para login e notificações
- **user_type**: Define se o usuário é 'freelancer' ou 'client'
- **reputation_score**: Pontuação de reputação calculada com base no histórico
- **created_at, updated_at**: Timestamps de controle

### WALLETS
Contas financeiras (carteiras) dos usuários.

- **wallet_id (PK)**: Identificador único da carteira
- **user_id (FK)**: Chave estrangeira para a tabela USERS
- **balance**: Saldo atual da carteira
- **currency**: Moeda da carteira (ex: 'BRL')

### PROJECTS
Detalhes sobre cada projeto contratado na plataforma.

- **project_id (PK)**: Identificador único do projeto
- **client_id (FK)**: ID do usuário cliente
- **freelancer_id (FK)**: ID do usuário freelancer
- **title, description**: Informações sobre o escopo do projeto
- **amount**: Valor total acordado para o projeto
- **status**: Status atual do projeto, fundamental para o fluxo de escrow

### TRANSACTIONS
Registra todas as movimentações financeiras.

- **transaction_id (PK)**: Identificador única da transação
- **source_wallet_id (FK)**: Carteira de origem dos fundos
- **destination_wallet_id (FK)**: Carteira de destino dos fundos
- **project_id (FK)**: Projeto ao qual a transação está associada
- **amount**: Valor da transação
- **transaction_type**: Tipo da transação (depósito, pagamento, saque, etc.)

## 9. Fluxo de Pagamento em Custódia (Escrow)

1. **Criação do Projeto**: O Cliente cria um projeto e define um valor
2. **Depósito**: O Cliente é redirecionado para um Gateway de Pagamento para depositar o valor do projeto
3. **Confirmação e Retenção**: O Gateway confirma o pagamento ao nosso Backend. O Backend cria uma transação do tipo deposit na carteira do Cliente e, em seguida, uma transação do tipo payment que move os fundos para uma carteira interna de custódia. O status do projeto muda para funded
4. **Entrega e Aprovação**: O Freelancer entrega o trabalho. O Cliente revisa e aprova na plataforma
5. **Liberação dos Fundos**: Ao receber a aprovação, o Backend executa uma transação do tipo release, movendo os fundos da carteira de custódia para a carteira do Freelancer. O status do projeto muda para completed
6. **Saque**: O Freelancer pode solicitar um withdrawal de sua carteira para sua conta bancária

## 10. Fluxo de Dados e Segurança

- **Comunicação Criptografada**: Toda a comunicação entre o frontend e o backend é feita via HTTPS/TLS
- **Dados Sensíveis**: Senhas são armazenadas como hashes (ex: bcrypt). Detalhes de pagamento não são armazenados em nosso sistema; eles são gerenciados pelo Gateway de Pagamento, que é compatível com PCI DSS
- **Autenticação e Autorização**: O acesso à API é protegido por tokens JWT (JSON Web Tokens). Cada endpoint verifica se o usuário tem permissão para realizar a ação solicitada
- **Logs de Auditoria**: Todas as transações financeiras e mudanças de status de projetos geram logs detalhados para garantir a rastreabilidade

## 11. Plano de Implementação

### Requisitos Técnicos

#### Infraestrutura de Servidor

- **Servidor Web**: Nginx para proxy reverso e balanceamento de carga
- **Aplicação Backend**: Python 3.9+ com Flask/Gunicorn
- **Banco de Dados**: MySQL 8.0+ ou PostgreSQL 13+ gerenciado (ex: AWS RDS)
- **Cache**: Redis para sessões e cache de dados frequentes
- **Monitoramento**: Prometheus + Grafana para métricas e alertas

#### Integrações Externas

- **Gateway de Pagamento**: Integração com provedor que suporte Pix e Cartão de Crédito (ex: Mercado Pago, PagSeguro, Stripe)
- **Certificados SSL**: Let's Encrypt ou similar para HTTPS
- **CDN**: Cloudflare ou AWS CloudFront para entrega otimizada de assets estáticos

### Custos Estimados (Mensal)

- Servidores Cloud (2x instâncias): R$ 1.500/mês
- Banco de Dados Gerenciado: R$ 1.200/mês
- CDN e Storage: R$ 300/mês
- Taxas do Gateway de Pagamento: 2-4% por transação

## 12. Métricas de Sucesso (KPIs)

### KPIs Técnicos

- **Uptime**: > 99.9%
- **Latência da API**: < 200ms para 95% das requisições
- **Taxa de Erro**: < 0.1%

### KPIs de Negócio

- **Adoção de Usuários**: 5.000+ usuários ativos no primeiro ano
- **Volume de Transações (GTV)**: R$ 500 mil/mês após 6 meses
- **Satisfação do Cliente**: NPS > 60

## 13. Próximos Passos (Roadmap do MVP)

### Fase 1 (Core)
- Cadastro e autenticação de usuários (Freelancer/Cliente)
- Implementação das carteiras digitais
- Integração com Gateway de Pagamento para depósitos

### Fase 2 (Fluxo de Projetos)
- CRUD de Projetos (Criar, Ler, Atualizar, Deletar)
- Implementação do fluxo de escrow (depósito, liberação, disputa)
- Dashboard para visualização de projetos e transações

### Fase 3 (Lançamento Beta)
- Sistema de Score de Reputação (v1)
- Notificações por e-mail
- Deploy em ambiente de produção e convite para usuários beta

## 14. Estrutura de Arquivos do Projeto

```
freelacash/
├── backend/
│   ├── app.py               # API principal com Flask
│   └── requirements.txt     # Dependências Python
├── database/
│   └── schema.sql           # Script de criação do banco de dados
├── docs/
│   ├── ARCHITECTURE.md      # Documento de arquitetura e fluxos
│   └── IMPLEMENTATION_PLAN.md # Plano de implementação, custos e métricas
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── styles.css   # Estilos principais
│   │   │   └── components.css # Estilos de componentes
│   │   └── js/
│   │       ├── app.js       # JavaScript principal
│   │       ├── api.js       # Funções de API
│   │       └── components/
│   │           ├── dashboard.js
│   │           └── transactions.js
│   ├── pages/
│   │   ├── index.html       # Página inicial
│   │   ├── dashboard.html   # Dashboard do usuário
│   │   ├── projects.html    # Página de projetos
│   │   └── transactions.html # Página de transações
│   └── components/
│       ├── header.html      # Cabeçalho comum
│       └── sidebar.html     # Barra lateral
└── README.md                # Este arquivo
```
