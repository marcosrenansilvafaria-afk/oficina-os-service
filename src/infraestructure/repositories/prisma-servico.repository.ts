import { Injectable } from '@nestjs/common';
import { Servico } from '../../domain/entities/servico';
import { IServicoRepository } from '../../domain/repositories/servico-repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaServicoRepository implements IServicoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(servico: Servico): Promise<void> {
    await this.prisma.servico.upsert({
      where: { id: servico.id },
      update: { nome: servico.nome, preco: servico.preco },
      create: { id: servico.id, nome: servico.nome, preco: servico.preco },
    });
  }

  async getById(id: string): Promise<Servico | null> {
    const record = await this.prisma.servico.findUnique({ where: { id } });
    if (!record) return null;
    return new Servico(record.id, record.nome, record.preco);
  }

  async all(): Promise<Servico[]> {
    const records = await this.prisma.servico.findMany();
    return records.map((r) => new Servico(r.id, r.nome, r.preco));
  }

  async clear(): Promise<void> {
    await this.prisma.servico.deleteMany();
  }
}
