import { Injectable } from '@nestjs/common';
import { Peca } from '../../domain/entities/peca';
import { IPecaRepository } from '../../domain/repositories/peca-repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPecaRepository implements IPecaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(peca: Peca): Promise<void> {
    await this.prisma.peca.upsert({
      where: { id: peca.id },
      update: { nome: peca.nome, preco: peca.preco, estoque: peca.estoque },
      create: {
        id: peca.id,
        nome: peca.nome,
        preco: peca.preco,
        estoque: peca.estoque,
      },
    });
  }

  async getById(id: string): Promise<Peca | null> {
    const record = await this.prisma.peca.findUnique({ where: { id } });
    if (!record) return null;
    return new Peca(record.id, record.nome, record.preco, record.estoque);
  }

  async all(): Promise<Peca[]> {
    const records = await this.prisma.peca.findMany();
    return records.map((r) => new Peca(r.id, r.nome, r.preco, r.estoque));
  }

  async clear(): Promise<void> {
    await this.prisma.peca.deleteMany();
  }
}
