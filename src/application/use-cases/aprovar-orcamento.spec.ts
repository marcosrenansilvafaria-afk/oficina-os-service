import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { AprovarOrcamento } from './aprovar-orcamento';
import { CriarOrdemServico } from './criar-ordem-servico';
import { GerarOrcamento } from './gerar-orcamento';
import { IniciarDiagnostico } from './iniciar-diagnostico';

describe('AprovarOrcamento', () => {
  it('deve aprovar orcamento quando status for AGUARDANDO_APROVACAO', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const criar = new CriarOrdemServico(ordemRepo);
    const iniciarDiag = new IniciarDiagnostico(ordemRepo);
    const addItem = new AdicionarItemOrdemServico(ordemRepo);
    const gerar = new GerarOrcamento(ordemRepo);
    const aprovar = new AprovarOrcamento(ordemRepo);

    const os = await criar.execute();
    await iniciarDiag.execute(os.id);
    await addItem.execute(os.id, {
      tipo: 'SERVICO',
      descricao: 'Troca',
      preco: 100,
      quantidade: 1,
    });
    await gerar.execute(os.id);

    const atualizada = await aprovar.execute(os.id);

    expect(atualizada.getStatus()).toBe('APROVADA');
  });

  it('deve falhar quando OS nao existe', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const aprovar = new AprovarOrcamento(ordemRepo);

    await expect(aprovar.execute('nao-existe')).rejects.toThrow(
      'OS não encontrada',
    );
  });
});
