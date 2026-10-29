import { Injectable } from '@nestjs/common';
import {
  OrdemServico,
  StatusOrdemServico,
} from '../../domain/entities/ordem-servico';
import { ItemOrdemServico } from '../../domain/entities/item-ordem-servico';
import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaOrdemRepository implements IOrdemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(ordem: OrdemServico): Promise<void> {
    await this.prisma.ordemServico.upsert({
      where: { id: ordem.id },
      update: {
        status: ordem.getStatus(),
        valorTotal: ordem.getValorTotal(),
        finalizadaEm: ordem.getFinalizadaEm() ?? null,
      },
      create: {
        id: ordem.id,
        clienteId: ordem.clienteId!,
        veiculoId: ordem.veiculoId!,
        status: ordem.getStatus(),
        valorTotal: ordem.getValorTotal(),
        criadaEm: ordem.getCriadaEm(),
        finalizadaEm: ordem.getFinalizadaEm() ?? null,
      },
    });

    await this.prisma.itemOrdemServico.deleteMany({
      where: { ordemServicoId: ordem.id },
    });

    const itens = ordem.getItens();
    if (itens.length > 0) {
      await this.prisma.itemOrdemServico.createMany({
        data: itens.map((item) => ({
          ordemServicoId: ordem.id,
          tipo: item.tipo,
          descricao: item.descricao,
          preco: item.preco,
          quantidade: item.quantidade,
        })),
      });
    }
  }

  async getById(id: string): Promise<OrdemServico | null> {
    const record = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: { itens: true },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.ordemServico.count({ where: { id } });
    return count > 0;
  }

  async all(): Promise<OrdemServico[]> {
    const records = await this.prisma.ordemServico.findMany({
      include: { itens: true },
    });
    return records.map((r) => this.toEntity(r));
  }

  async clear(): Promise<void> {
    await this.prisma.itemOrdemServico.deleteMany();
    await this.prisma.ordemServico.deleteMany();
  }

  private toEntity(record: {
    id: string;
    clienteId: string;
    veiculoId: string;
    status: string;
    valorTotal: number;
    criadaEm: Date;
    finalizadaEm: Date | null;
    itens: {
      tipo: string;
      descricao: string;
      preco: number;
      quantidade: number;
    }[];
  }): OrdemServico {
    const itens = record.itens.map(
      (i) =>
        new ItemOrdemServico(
          i.tipo as 'SERVICO' | 'PECA',
          i.descricao,
          i.preco,
          i.quantidade,
        ),
    );

    return OrdemServico.reconstitute(
      record.id,
      record.clienteId,
      record.veiculoId,
      record.status as StatusOrdemServico,
      itens,
      record.valorTotal,
      record.criadaEm,
      record.finalizadaEm ?? undefined,
    );
  }
}
