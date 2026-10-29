import { CriarOrdemServico } from './application/use-cases/criar-ordem-servico';
import { AdicionarItemOrdemServico } from './application/use-cases/adicionar-item-ordem-servico';
import { GerarOrcamento } from './application/use-cases/gerar-orcamento';
import { AprovarOrcamento } from './application/use-cases/aprovar-orcamento';
import { IniciarDiagnostico } from './application/use-cases/iniciar-diagnostico';
import {
  clienteRepo,
  veiculoRepo,
  ordemRepo,
  pecaRepo,
  servicoRepo,
} from './infraestructure/singletons';

const criar = new CriarOrdemServico(ordemRepo, clienteRepo, veiculoRepo);
const iniciarDiag = new IniciarDiagnostico(ordemRepo);
const add = new AdicionarItemOrdemServico(ordemRepo, pecaRepo, servicoRepo);
const gerar = new GerarOrcamento(ordemRepo);
const aprovar = new AprovarOrcamento(ordemRepo);

async function run() {
  const os = await criar.execute();

  await iniciarDiag.execute(os.id);
  await add.execute(os.id, {
    tipo: 'SERVICO',
    descricao: 'Troca óleo',
    preco: 100,
    quantidade: 1,
  });

  await gerar.execute(os.id);
  await aprovar.execute(os.id);

  console.log(os.getStatus());
}

void run();
