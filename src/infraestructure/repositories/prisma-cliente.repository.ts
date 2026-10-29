import { Injectable } from '@nestjs/common';
import { Cliente } from '../../domain/entities/cliente';
import { IClienteRepository } from '../../domain/repositories/cliente-repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaClienteRepository implements IClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(cliente: Cliente): Promise<void> {
    await this.prisma.cliente.upsert({
      where: { id: cliente.id },
      update: { nome: cliente.nome, documento: cliente.documento },
      create: {
        id: cliente.id,
        nome: cliente.nome,
        documento: cliente.documento,
      },
    });
  }

  async getById(id: string): Promise<Cliente | null> {
    const record = await this.prisma.cliente.findUnique({ where: { id } });
    if (!record) return null;
    return new Cliente(record.id, record.nome, record.documento);
  }

  async all(): Promise<Cliente[]> {
    const records = await this.prisma.cliente.findMany();
    return records.map((r) => new Cliente(r.id, r.nome, r.documento));
  }

  async clear(): Promise<void> {
    await this.prisma.cliente.deleteMany();
  }
}
