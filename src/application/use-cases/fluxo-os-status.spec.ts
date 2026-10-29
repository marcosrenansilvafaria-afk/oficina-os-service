import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { AprovarOrcamento } from './aprovar-orcamento';
import { CriarOrdemServico } from './criar-ordem-servico';
import { EntregarVeiculo } from './entregar-veiculo';
import { FinalizarOrdemServico } from './finalizar-ordem-servico';
import { GerarOrcamento } from './gerar-orcamento';
import { IniciarDiagnostico } from './iniciar-diagnostico';
import { IniciarExecucao } from './iniciar-execucao';

describe('Fluxo de status da OS (use-cases)', () => {
  function prepararFluxo() {
    const repo = new InMemoryOrdemRepository();
    const criar = new CriarOrdemServico(repo);
    const iniciarDiag = new IniciarDiagnostico(repo);
    const addItem = new AdicionarItemOrdemServico(repo);
    const gerar = new GerarOrcamento(repo);
    const aprovar = new AprovarOrcamento(repo);
    const iniciarExec = new IniciarExecucao(repo);
    const finalizar = new FinalizarOrdemServico(repo);
    const entregar = new EntregarVeiculo(repo);

    return {
      repo,
      criar,
      iniciarDiag,
      addItem,
      gerar,
      aprovar,
      iniciarExec,
      finalizar,
      entregar,
    };
  }

  it('deve executar o fluxo completo de status ate ENTREGUE', async () => {
    const {
      criar,
      iniciarDiag,
      addItem,
      gerar,
      aprovar,
      iniciarExec,
      finalizar,
      entregar,
    } = prepararFluxo();

    const os = await criar.execute();
    await iniciarDiag.execute(os.id);
    await addItem.execute(os.id, {
      tipo: 'SERVICO',
      descricao: 'Servico',
      preco: 90,
      quantidade: 1,
    });
    await gerar.execute(os.id);
    await aprovar.execute(os.id);
    await iniciarExec.execute(os.id);
    await finalizar.execute(os.id);
    const entregue = await entregar.execute(os.id);

    expect(entregue.getStatus()).toBe('ENTREGUE');
  });

  it('deve falhar para iniciar execucao sem aprovacao', async () => {
    const { criar, iniciarExec } = prepararFluxo();
    const os = await criar.execute();

    await expect(iniciarExec.execute(os.id)).rejects.toThrow(
      'Não pode iniciar execução sem aprovação',
    );
  });

  it('deve falhar para finalizar fora de EM_EXECUCAO', async () => {
    const { criar, finalizar } = prepararFluxo();
    const os = await criar.execute();

    await expect(finalizar.execute(os.id)).rejects.toThrow(
      'Só pode finalizar se estiver em execução',
    );
  });

  it('deve falhar para entregar fora de FINALIZADA', async () => {
    const { criar, entregar } = prepararFluxo();
    const os = await criar.execute();

    await expect(entregar.execute(os.id)).rejects.toThrow(
      'Só pode entregar após finalização',
    );
  });

  it('deve retornar erro OS não encontrada para use-cases de status', async () => {
    const { iniciarDiag, iniciarExec, finalizar, entregar } = prepararFluxo();

    await expect(iniciarDiag.execute('x')).rejects.toThrow('OS não encontrada');
    await expect(iniciarExec.execute('x')).rejects.toThrow('OS não encontrada');
    await expect(finalizar.execute('x')).rejects.toThrow('OS não encontrada');
    await expect(entregar.execute('x')).rejects.toThrow('OS não encontrada');
  });
});
