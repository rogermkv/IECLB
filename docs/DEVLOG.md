# IECLB — DEVLOG

## 2026-10-12 — Checkout Linux e validação do candidato oficial

- Repositório real descoberto pela listagem pública GitHub; clone e commit publicado c233b8e60777a759f98b62642d87b256b36a93f1 confirmados; detached HEAD sem descartar histórico. AGENTS.md ausente; README/config/db/rotas/scripts revisados.
- npm ci backend/frontend com lockfiles e hooks controlados; bcrypt/sqlite3 nativos PASS; build com API mesma origem PASS. Fontes e lockfiles rastreados não alterados.
- Teste real SQLite/API/login/CRUD/SPA e Chromium PASS com dados sintéticos; única adaptação em cópia temporária: bindloopback. Fixtures/banco/processo temporários removidos. Playwright e bibliotecas de navegador preparados em /tmp/cache, sem sudo ou instalação de pacotes no sistema. Falhas iniciais do navegador eram bibliotecas ausentes e foram resolvidas por extração em /tmp; não problema de código.
- Novos arquivos docs/PROJECT_STATE.md,DEVLOG.md,devsigec-validation-20261012.json; ops/devsigec/README.md,candidate-loopback.patch,ieclb.service,ieclb-internal.conf,environment.template. Não instalados.
- Produção não acessada; nenhuma planilha importada nem banco/mídia real copiado; sem commit/push. Migração ainda não concluída: diferenças PROD pendentes e estrutura/serviço/Nginx permanentes bloqueados por acesso administrativo. Próximo: revisar diffs e aplicar runtime por procedimento autorizado.

## 2026-10-12 — Candidato publicado no DEVSIGEC

- Nova missão autoriza infraestruturaDEV. Helperrootdelimitado instalado no terminal e verificado; publicação/DBbootstrap/start automatizados, não rootexecutandocódigodeapp.
- RuntimeUIDmkv-ieclb/API3335/Nginx8081,SQLite próprio6tabelas/dadosfictícios; serviçosactiveenabled. Testesautenticação/CRUD/frontendChromium/persistênciarestartPASS; prontidãoHTTPaguardada apóscurlinitial502. DiferençasPRODpendentes não descartadasnemparidadeafirmada.
- Checkoutfontepreservado; arquivosops/docspreexistentes mantidos. .env/DB/configunitNginxnovos em/opt+etc restritos,credenciaisprivadasforaGit/docs. Sem produção/commit/push. Próximo: analisar diffs sanitizados recebidos pelo relay e completar paridade.

## 2026-10-12 — Fluxos essenciais e integridade corrigida no DEV

Agenda,RSVP/privacidade,oração/moderação eSecretaria testados comdadosfictícios. Detectada falhareal decascataSQLite; PRAGMAforeign_keys=ON adicionadoaoinitDatabase,semDDL/migration. Branchcodex/devsigec-migration criada,semcommit/push. Patchops/devsigec/foreign-key-integrity.patch.

Primeira cópia deruntimeperdeu grupo e502 disparourollback; promoção refeita comrotinavalidadaUID/grupo/symlinks. Runtimeanterior efailed mantidos. Exclusãoemcascata efluxosPASS; login/frontendChromium/persistênciarestart revalidadosPASS. Dados detrânsitoteste limpos. Produção/diffs ainda não aplicados; paridadependente.


## 2026-10-12 — Diferenças produção examinadas e paridade de bind concluída

Patches config.js/server.js recebidos porSSHestrito e preservadosprivadamente. Mudançaprodução somenteHOSTdefaultloopbackebindexplícito; contextoJWTredigido nãofoiaplicado. Incorporadoemcheckout e runtimeDEV, preservandocorreçãoFK/healthalias/credenciais/JWT/banco/storage. BackupdosdoisJSemreleases e promoção comrestart/health/rollback. Fontebasec233b8e60777a759f98b62642d87b256b36a93f1; origin/main vivo eSHApublicado confirmadosiguais. Validador existente rerodado:auth/CRUDfictício/restart/persistência/navegador/cleanup/CISNEsaudávelPASS. Diferençasconhecidas foramresolvidas,sem alegar comparação de todososarquivos ativosPROD. Semprodução/commit/push. Arquivosfontealterados nesta etapa:config.js/server.js; db.jsFKanteriorpreservado.


## 2026-10-12 — Fechamento: SSH e migrações DEV validados

A conexão SSH direta foi concluída com chave dedicada, identidade verificada e restrições remotas. Os quatro aplicativos novos estão ativos, com bancos/storage próprios e testes reais de API, autenticação, navegador e persistência. CISNE preservado e saudável. SHAs local/main GitHub/produção conferidos; ajustes DEV documentados, sem commit ou push. Relatório legível: /home/herpich/projetos/mkv-infra/docs/MKV_ENTREGA_20261012.md.

Nenhum aplicativo, banco ou serviço de produção alterado; apenas autenticação mínima autorizada pela sessão SIGEC. Novas transferências reais e timer de backup continuam suspensos. Backup futuro exige identidade/roles readonly e validação de captura/restore/mídia; login real/fotos CISNE e PWA offline permanecem fora dos testes desta etapa.

## Alinhamento por sistema — IECLB concluído (13/10/2026 às 18:08:01 BRT)

Pedido atual: alinhar um aplicativo por vez. O IECLB ativo no DEVSIGEC foi restaurado a partir de captura consistente da produção, com backup prévio cifrado e recuperação desse backup validada. A comparação integral após restart e contra uma segunda captura passou: seis tabelas, 311 registros (308 eventos, um aviso, dois usuários), todos os campos, IDs, hashes de senha e sequências SQLite iguais. Sem arquivos de uploads em ambos os ambientes. Contas sintéticas anteriores do DEV ficaram no backup, não no banco alinhado.

Código aprovado/main/publicado: c233b8e60777a759f98b62642d87b256b36a93f1. Planilha bd.xlsx conferida por SHA-256 e instalada sem executar importação; arquivo público de diagnóstico DEV removido. Permanecem duas adaptações anteriores de backend: foreign_keys=ON e alias /health. Fontes frontend iguais; build local usa API da própria origem e não é byte a byte igual ao compilado de produção. Dependências instaladas não comparadas byte a byte. Banco, JWT e credenciais técnicas do DEV continuam próprios; .env preservado.

Login real bcrypt/JWT e painel Chromium passaram com conta temporária exclusiva do teste, removida integralmente; nenhum usuário/senha original redefinido. Login digitando senha real de produção NÃO TESTADO. Integridade SQLite/FKs, sequências e persistência após restart passaram. Rollback para o DEV anterior foi exercitado durante correção do caminho do Chromium. Cinco APIs continuam HTTP 200; configurações e PIDs dos outros quatro aplicativos preservados. Produção não alterada, acesso SSH restrito somente leitura.

Site: http://192.168.0.98:8081. Evidência: /home/herpich/projetos/mkv-infra/docs/ieclb-environment-alignment.json. Relatório: /home/herpich/projetos/mkv-infra/docs/IECLB_ALINHAMENTO_AMBIENTES.md. Backup privado: /opt/apps/ieclb/backups/before-environment-alignment-20261013t210338_95665183-f5ef2e; snapshot restic 710ceb2467be7a381cedfa5a1cbb2bd19ef4248d52f835221b7c1bbab6e7df68. Nenhum segredo ou hash de senha publicado. Sem commit/push/reset/stash/migration de aplicação; alterações locais anteriores preservadas.

A igualdade foi validada na captura de 13/10/2026 às 18:08:01 BRT; novas escritas podem gerar divergência. O timer existente às 03:00 BRT atualiza espelho/QA, não o banco ativo do DEV. Não foi criada nova automação de sobrescrita. Alinhamento integral dos outros aplicativos e promoção de contingência ainda pendentes; próximo sistema recomendado: SIGEC. As seções anteriores abaixo registram estados históricos, inclusive a auditoria que encontrou diferenças no IECLB antes desta restauração.


## Comparação atual dos cinco aplicativos — 14/10/2026, 17:09:17–17:09:43 BRT

Verificação somente leitura concluída contra novas capturas de produção e DEV ativo. Dados de negócio/identidades/hashes originais/53 arquivos (27.796.989 bytes) coincidem nos cinco aplicativos. IECLB311/311 registros e dois usuários; SIGEC 3.067/3.067 e 25 usuários; IPACOL 1.820/1.820 e sete usuários. Carteira 264/263 registros, seis usuários: somente Session diverge (11/10;duas só na origem/uma só no DEV), demais 20 tabelas iguais. CISNE 174/174, cinco usuários: um registro users diverge apenas lastLoginAt/updatedAt, demais campos/hashes e 22 tabelas iguais. Divergências operacionais compatíveis com logins independentes; não houve alteração para mascará-las. Nenhuma senha real pedida/redefinida.

Comparação integral de colunas/PKs/linhas, índices/constraints/sequências PostgreSQL e schema completo/integridade/FKs/tabelas internas SQLite PASS nos respectivos exames. Arquivos por SHA/tamanho iguais: Carteira 32, CISNE 20, IPACOL 1; uploads IECLB/SIGEC vazios. Dois bancos/roles PostgreSQL temporários isolados 16/17 restaurados para conferir dumps, removidos após comparação; snapshots privados preservados. Todos os DB/media/env/PIDs DEV iguais antes/depois; controlador compartilhado inalterado. Cinco APIs JSON 200 e cinco páginas HTML 200; Carteira TLS com CA confiável. Produção somente leitura, serviços ativos/SHAs mantidos; sem deploy/migration/seed/restart/commit/push/reset/stash.

Main oficial dos cinco confirmado via GitHub, igual à publicação. Código DEV comparado ao inventário completo de 13/10: CISNE fontes/compilados iguais; SIGEC executável igual/só .gitignore difere; IECLB FK/health/buildsameorigin, IPACOL bind/storage/raiz/tsbuildinfo e Carteira auth/server continuam diferenças documentadas. Hashes atuais fora do Git na produção UNKNOWN, pois gateway atual não os exporta; nenhum bypass de SSH. Carteira auth da fonte vsGit ainda UNKNOWN; arquivo UTF8quoted IPACOL fonte fingerprintnull. Checkouts sujos preservados, Carteira checkout 326 antigo versus runtime 1b38 correto; nenhuma base antiga usada para desenvolver.

Dados coincidem excluindo explicitamente estados de login; não declarar cinco bancos 100% idênticos, runtime byte a byte igual, espelhamento contínuo ou contingência pronta. Capturas sequenciais por aplicativo, sem instante global atômico. Timer diário 03:00 BRT atualiza espelho/QA e preserva DEV ativo. Próximo recomendado: se desejado, tratar atualização ativa/contingência e diferenças de código em escopo próprio; esta solicitação de comparação foi concluída, sem aprovação pendente.

Documentação alterada somente: PROJECT_STATE/DEVLOG CISNE/mkv-infra e estados/logs dos cinco repos, relatório MKV_COMPARACAO_CINCO_APLICATIVOS_APOS_ALINHAMENTO.md/evidência mkv-five-apps-post-alignment-comparison.json, quadro consolidado e nota da auditoria histórica. Resultados anteriores preservados. Artefatos/scripts privados fora do Git.


## Backup diário dos cinco aplicativos — 14/10/2026 às 17:45 BRT

Pedido autorizado: backup diário de todos os dados/registros/arquivos produção 99→DEVSIGEC 98. Cinco timers 03:00 America/Sao_Paulo enabled/active/Persistent, próximo 15/10 às 03:00 BRT. Ciclos completos coordenados com flock (um por vez), retry on-failure 15 min/limite 3 inícios em 2 h e alertas persistentes/journal locais. Sem canal externo. Retenção 7 diárias/4 semanais/3 mensais + últimas 2 preservada. Backups cifrados e espelhos originais privados; não sobrescrevem DEV ativo nem neutralizam originais.

Novo wrapper estável /usr/local/sbin/mkv-daily-production-backup e verificador /usr/local/sbin/mkv-encrypted-backup-verify root 0700/lista fechada de 5 apps/host DEV; todo ciclo diário agora abre o próprio snapshot cifrado e restaura isoladamente, compara todos os campos/IDs/hashes de senha/schema/sequências/constraints/arquivos e remove dados/roles temporários. Nenhuma dependência de /tmp/Windows/Codex. Source ops scripts e cinco pares de drop-ins 30-backup-retry.conf/40-serialize-backup.conf instalados; controlador global e helper CISNE inalterados. Sem app código/bancos/produção alterados.

Teste final pela unidade real dos cinco PASS/exit0 + recuperação cifrada PASS: IECLB 6 tabelas/311 registros, SIGEC 14/3.067, IPACOL 47/1.820, Carteira 21/264, CISNE 23/174; 53 arquivos/27.796.989 bytes, todos dados/hashes/arquivos originais íntegros. Falha anterior Carteira não reproduzida, assert específico UNKNOWN; backup/restauração já passavam. Execuções simultâneas mostraram falhas QA posteriores IPACOL/CISNE; serialização aplicada e ciclos finais completos passaram. Histórico mantido, não mascarado. Repo restic inteiro lido/check --read-data PASS; integridade de todos packs retidos. Estados ativos de DEV: todos campos/schema/sequências/arquivos/env/PIDs iguais antes/depois; cinco health APIs JSON 200. Produção somente leitura, cinco serviços ativos/SHAs mantidos. Sem migrations/seed/commit/push/reset/stash; checkouts sujos preservados.

Documentação: MKV_BACKUP_DIARIO_PRODUCAO.md/evidência mkv-daily-production-backup-validation.json, PROJECT_STATE/DEVLOG dos cinco repos/CISNE/mkv-infra e notas de prontidão/consolidação atualizados. Configs anteriores/diagnósticos/provas privados fora Git; nenhum segredo/PII/hash de senha publicado. Limite: recuperação até última captura válida; diário não garante perda zero, janela normalmente ~24 h pode aumentar em falhas. Snapshots por app, sem transação global banco+arquivos. Não equivale a atualização ativa dos sites DEV ou failover ensaiado. Rotina solicitada concluída, sem aprovação pendente; próxima execução agendada automaticamente.
