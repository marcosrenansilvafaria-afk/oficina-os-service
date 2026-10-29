import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { resetInMemoryRepositories } from './../src/infraestructure/singletons';

type HttpServer = Parameters<typeof request>[0];

function bodyAsRecord(res: request.Response): Record<string, unknown> {
  if (typeof res.body === 'object' && res.body !== null) {
    return res.body as Record<string, unknown>;
  }
  throw new Error('Expected object response body');
}

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value === 'string') {
    return value;
  }
  throw new Error(`Expected string field ${key}`);
}

function readNumber(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value === 'number') {
    return value;
  }
  throw new Error(`Expected number field ${key}`);
}

function readRecord(
  body: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = body[key];
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  throw new Error(`Expected object field ${key}`);
}

function okStatus(res: request.Response) {
  if (res.status !== 200 && res.status !== 201) {
    const bodyText =
      typeof res.body === 'object' && res.body !== null
        ? JSON.stringify(res.body)
        : String(res.body);
    throw new Error(`Unexpected status ${res.status}: ${bodyText}`);
  }
}

describe('Workflow e2e', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let accessToken: string;

  const api = () => request(httpServer);

  beforeAll(async () => {
    resetInMemoryRepositories();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as HttpServer;

    const loginRes = await api()
      .post('/auth/login')
      .send({ email: 'admin@oficina.com', senha: 'admin123' });

    accessToken = readString(bodyAsRecord(loginRes), 'access_token');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should run full OS workflow with real servico/peca data', async () => {
    // create part
    const pecaRes = await api()
      .post('/pecas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Filtro', preco: 50, estoque: 10 });
    okStatus(pecaRes);
    const pecaId = readString(bodyAsRecord(pecaRes), 'id');
    expect(pecaId).toBeDefined();

    // create service
    const servRes = await api()
      .post('/servicos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Troca óleo', preco: 120 });
    okStatus(servRes);
    const servId = readString(bodyAsRecord(servRes), 'id');
    expect(servId).toBeDefined();

    // create order
    const osRes = await api()
      .post('/os')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    okStatus(osRes);
    const osId = readString(bodyAsRecord(osRes), 'id');
    expect(osId).toBeDefined();

    // iniciar diagnostico (obrigatório para adicionar itens)
    const diagRes = await api()
      .post(`/os/${osId}/diagnostico`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(diagRes);

    // add part item
    const addPecaRes = await api()
      .post(`/os/${osId}/item`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tipo: 'PECA', pecaId, quantidade: 2 });
    okStatus(addPecaRes);

    // add service item
    const addServRes = await api()
      .post(`/os/${osId}/item`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tipo: 'SERVICO', servicoId: servId, quantidade: 1 });
    okStatus(addServRes);

    // gerar orcamento
    const gerarRes = await api()
      .post(`/os/${osId}/orcamento`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(gerarRes);

    // simular envio ao cliente
    const enviarRes = await api()
      .post(`/os/${osId}/enviar-orcamento`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(enviarRes);
    expect(readString(bodyAsRecord(enviarRes), 'status')).toBe('ENVIADO');

    // aprovar
    const aprovarRes = await api()
      .post(`/os/${osId}/aprovar`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(aprovarRes);

    // iniciar execucao
    const executarRes = await api()
      .post(`/os/${osId}/executar`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(executarRes);

    // finalizar
    const finalizarRes = await api()
      .post(`/os/${osId}/finalizar`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(finalizarRes);
    const finalizarBody = bodyAsRecord(finalizarRes);
    expect(finalizarBody.tempoExecucaoMs).not.toBeNull();

    // SLA (criacao -> finalizacao) deve ser consultado antes de entregar,
    // pois a métrica considera apenas OS em status FINALIZADA (exclui ENTREGUE).
    const slaRes = await api().get('/os/sla-atendimento').send();
    okStatus(slaRes);
    expect(
      readNumber(bodyAsRecord(slaRes), 'totalOrdensConcluidas'),
    ).toBeGreaterThanOrEqual(1);

    // entregar
    const entregarRes = await api()
      .post(`/os/${osId}/entregar`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    okStatus(entregarRes);

    // fetch and verify OS exists
    const fetchRes = await api().get(`/os/${osId}`).send();
    okStatus(fetchRes);
    const fetchBody = bodyAsRecord(fetchRes);
    expect(readString(fetchBody, 'id')).toBe(osId);
    expect(readString(readRecord(fetchBody, 'envioOrcamento'), 'status')).toBe(
      'ENVIADO',
    );

    // (após entrega a OS não entra no SLA por decisão de escopo)
  }, 20000);
});
