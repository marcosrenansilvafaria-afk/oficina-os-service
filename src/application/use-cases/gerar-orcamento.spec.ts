import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { CriarOrdemServico } from './criar-ordem-servico';
import { GerarOrcamento } from './gerar-orcamento';
import { IniciarDiagnostico } from './iniciar-diagnostico';

describe('GerarOrcamento', () => {
  it('deve gerar orcamento e salvar OS atualizada', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const criar = new CriarOrdemServico(ordemRepo);
    const iniciarDiag = new IniciarDiagnostico(ordemRepo);
    const addItem = new AdicionarItemOrdemServico(ordemRepo);
    const gerar = new GerarOrcamento(ordemRepo);

    const os = await criar.execute();
    await iniciarDiag.execute(os.id);
    await addItem.execute(os.id, {
      tipo: 'SERVICO',
      descricao: 'Troca',
      preco: 200,
      quantidade: 1,
    });

    const atualizada = await gerar.execute(os.id);

    expect(atualizada.getStatus()).toBe('AGUARDANDO_APROVACAO');
    expect(atualizada.getValorTotal()).toBe(200);
    expect((await ordemRepo.getById(os.id))?.getStatus()).toBe(
      'AGUARDANDO_APROVACAO',
    );
  });

  it('deve falhar quando OS nao existe', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const gerar = new GerarOrcamento(ordemRepo);

    await expect(gerar.execute('inexistente')).rejects.toThrow(
      'OS não encontrada',
    );
  });
});
