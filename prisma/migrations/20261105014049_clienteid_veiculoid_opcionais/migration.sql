-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'EM_EXECUCAO', 'FINALIZADA', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('SERVICO', 'PECA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pecas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "veiculoId" TEXT,
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'RECEBIDA',
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico_status_historico" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "status" "StatusOrdemServico" NOT NULL,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordens_servico_status_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ordem_servico" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE INDEX "ordens_servico_status_historico_ordemServicoId_idx" ON "ordens_servico_status_historico"("ordemServicoId");

-- CreateIndex
CREATE INDEX "ordens_servico_status_historico_status_idx" ON "ordens_servico_status_historico"("status");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico_status_historico" ADD CONSTRAINT "ordens_servico_status_historico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem_servico" ADD CONSTRAINT "itens_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
