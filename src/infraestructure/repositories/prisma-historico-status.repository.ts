import { Injectable } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/entities/ordem-servico';
import { IHistoricoStatusRepository } from '../../domain/repositories/historico-status-repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ordemServicoStatusDuracaoSegundos } from '../observability/metrics-registry';

@Injectable()
export class PrismaHistoricoStatusRepository implements IHistoricoStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(
    ordemServicoId: string,
    status: StatusOrdemServico,
  ): Promise<void> {
    const anterior = await this.prisma.ordemServicoStatusHistorico.findFirst({
      where: { ordemServicoId },
      orderBy: { alteradoEm: 'desc' },
    });

    const agora = new Date();

    if (anterior) {
      const duracaoSegundos =
        (agora.getTime() - anterior.alteradoEm.getTime()) / 1000;
      ordemServicoStatusDuracaoSegundos.observe(
        { status: anterior.status },
        duracaoSegundos,
      );
    }

    await this.prisma.ordemServicoStatusHistorico.create({
      data: { ordemServicoId, status, alteradoEm: agora },
    });
  }

  async clear(): Promise<void> {
    await this.prisma.ordemServicoStatusHistorico.deleteMany();
  }
}
