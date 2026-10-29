import { Injectable } from '@nestjs/common';
import { Veiculo } from '../../domain/entities/veiculo';
import { IVeiculoRepository } from '../../domain/repositories/veiculo-repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaVeiculoRepository implements IVeiculoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(veiculo: Veiculo): Promise<void> {
    await this.prisma.veiculo.upsert({
      where: { id: veiculo.id },
      update: {
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        marca: veiculo.marca,
        ano: veiculo.ano,
      },
      create: {
        id: veiculo.id,
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        marca: veiculo.marca,
        ano: veiculo.ano,
      },
    });
  }

  async getById(id: string): Promise<Veiculo | null> {
    const record = await this.prisma.veiculo.findUnique({ where: { id } });
    if (!record) return null;
    return new Veiculo(
      record.id,
      record.placa,
      record.modelo,
      record.marca,
      record.ano,
    );
  }

  async all(): Promise<Veiculo[]> {
    const records = await this.prisma.veiculo.findMany();
    return records.map(
      (r) => new Veiculo(r.id, r.placa, r.modelo, r.marca, r.ano),
    );
  }

  async clear(): Promise<void> {
    await this.prisma.veiculo.deleteMany();
  }
}
