-- Bootstrap do database dedicado do OS Service na RDS compartilhada
-- (Repositorio 1 - oficina-db-infrastructure). Roda UMA UNICA VEZ, como
-- usuario master da RDS, de DENTRO da VPC (a RDS e privada - nem o GitHub
-- Actions nem uma maquina local fora da VPC conseguem conectar direto).
--
-- Quando o EKS (Repositorio 3) existir, execute via um pod temporario no
-- namespace "oficina":
--
--   kubectl run psql-bootstrap --rm -it --restart=Never -n oficina \
--     --image=postgres:16-alpine -- \
--     psql "postgresql://<usuario_master>:<senha_master>@<host_rds>:5432/oficina" \
--     -f - < scripts/bootstrap-database.sql
--
-- (ou cole o conteudo deste arquivo direto no psql interativo do pod).
--
-- Troque <SENHA_FORTE_AQUI> por uma senha gerada (ex: openssl rand -base64 24)
-- ANTES de rodar, e guarde o valor final em DATABASE_URL (GitHub Secret
-- deste repositorio) - nunca comite a senha real neste arquivo.

CREATE DATABASE os_service;

CREATE ROLE os_service_app WITH LOGIN PASSWORD '<SENHA_FORTE_AQUI>';

-- Isolamento: os_service_app so tem permissao no database os_service,
-- nenhum outro servico/usuario acessa este database diretamente (requisito
-- da Sprint 2: "NENHUM outro servico tera acesso direto a este banco").
GRANT ALL PRIVILEGES ON DATABASE os_service TO os_service_app;

\c os_service

GRANT ALL ON SCHEMA public TO os_service_app;
