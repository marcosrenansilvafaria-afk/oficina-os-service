import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { CriarOrdemServico } from './criar-ordem-servico';
import { GerarOrcamento } from './gerar-orcamento';
import { IniciarDiagnostico } from './iniciar-diagnostico';
import { RecusarOrcamento } from './recusar-orcamento';

describe('RecusarOrcamento', () => {
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

  it('deve transicionar de AGUARDANDO_APROVACAO para EM_DIAGNOSTICO', async () => {
    const { repo, os } = await prepararOsEmAguardando();
    const useCase = new RecusarOrcamento(repo);

    const atualizada = await useCase.execute(os.id);

    expect(atualizada.getStatus()).toBe('EM_DIAGNOSTICO');
  });

  it('deve falhar quando status nao for AGUARDANDO_APROVACAO', async () => {
    const repo = new InMemoryOrdemRepository();
    const os = await new CriarOrdemServico(repo).execute();
    const useCase = new RecusarOrcamento(repo);

    await expect(useCase.execute(os.id)).rejects.toThrow(
      'Orçamento não está disponível para recusa',
    );
  });

  it('deve falhar quando OS nao existe', async () => {
    const repo = new InMemoryOrdemRepository();
    const useCase = new RecusarOrcamento(repo);

    await expect(useCase.execute('nao-existe')).rejects.toThrow(
      'OS não encontrada',
    );
  });
});
