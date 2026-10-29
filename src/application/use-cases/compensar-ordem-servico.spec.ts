import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { AprovarOrcamento } from './aprovar-orcamento';
import { CriarOrdemServico } from './criar-ordem-servico';
import { GerarOrcamento } from './gerar-orcamento';
import { IniciarDiagnostico } from './iniciar-diagnostico';
import { IniciarExecucao } from './iniciar-execucao';
import { CompensarOrdemServico } from './compensar-ordem-servico';

describe('CompensarOrdemServico', () => {
  async function prepararOsEmAguardando() {
    const repo = new InMemoryOrdemRepository();
    const os = await new CriarOrdemServico(repo).execute();
    await new IniciarDiagnostico(repo).execute(os.id);
    await new AdicionarItemOrdemServico(repo).execute(os.id, {
      tipo: 'SERVICO',
      descricao: 'Revisao',
      preco: 150,
      quantidade: 1,
    });
    await new GerarOrcamento(repo).execute(os.id);
    return { repo, os };
  }

  it('deve voltar para EM_DIAGNOSTICO quando origemFalha for PAGAMENTO', async () => {
    const { repo, os } = await prepararOsEmAguardando();
    const useCase = new CompensarOrdemServico(repo);

    const atualizada = await useCase.execute(os.id, 'PAGAMENTO');

    expect(atualizada.getStatus()).toBe('EM_DIAGNOSTICO');
  });

  it('deve ir para CANCELADA quando origemFalha for EXECUCAO', async () => {
    const { repo, os } = await prepararOsEmAguardando();
    await new AprovarOrcamento(repo).execute(os.id);
    await new IniciarExecucao(repo).execute(os.id);

    const useCase = new CompensarOrdemServico(repo);
    const atualizada = await useCase.execute(os.id, 'EXECUCAO');

    expect(atualizada.getStatus()).toBe('CANCELADA');
  });

  it('deve falhar quando OS nao existe', async () => {
    const repo = new InMemoryOrdemRepository();
    const useCase = new CompensarOrdemServico(repo);

    await expect(useCase.execute('nao-existe', 'PAGAMENTO')).rejects.toThrow(
      'OS não encontrada',
    );
  });
});
