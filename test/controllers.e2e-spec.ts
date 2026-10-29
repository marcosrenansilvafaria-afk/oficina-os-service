import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { resetInMemoryRepositories } from '../src/infraestructure/singletons';

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

function responseMessage(res: request.Response): string {
  const body = bodyAsRecord(res);
  const message = body.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.map((entry) => String(entry)).join(' ');
  }

  return '';
}

describe('Controllers integration (e2e)', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let accessToken: string;

  const api = () => request(httpServer);

  beforeEach(async () => {
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

  afterEach(async () => {
    await app.close();
  });

  it('POST /clientes should return 401 without token', async () => {
    const res = await api()
      .post('/clientes')
      .send({ nome: 'Joao', documento: '12345678901' });

    expect(res.status).toBe(401);
  });

  it('POST /clientes should validate required fields', async () => {
    const res = await api()
      .post('/clientes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Joao' });

    expect(res.status).toBe(400);
    expect(responseMessage(res)).toContain('nome e documento são obrigatórios');
  });

  it('POST /clientes then GET /clientes/:id should return created resource', async () => {
    const create = await api()
      .post('/clientes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Joao', documento: '123.456.789-01' });

    const createBody = bodyAsRecord(create);
    const createdId = readString(createBody, 'id');
    const createdDocumento = readString(createBody, 'documento');

    expect(create.status).toBe(201);
    expect(createdId).toBeDefined();
    expect(createdDocumento).toBe('12345678901');

    const get = await api()
      .get(`/clientes/${createdId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const getBody = bodyAsRecord(get);
    const fetchedId = readString(getBody, 'id');

    expect(get.status).toBe(200);
    expect(fetchedId).toBe(createdId);
  });

  it('GET /clientes/:id should return 404 for missing id', async () => {
    const res = await api()
      .get('/clientes/inexistente')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(responseMessage(res)).toContain('Cliente não encontrado');
  });

  it('POST /veiculos should validate required fields', async () => {
    const res = await api()
      .post('/veiculos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ placa: 'ABC1D23' });

    expect(res.status).toBe(400);
    expect(responseMessage(res)).toContain(
      'placa, modelo, marca e ano são obrigatórios',
    );
  });

  it('POST /clientes should reject invalid documento format', async () => {
    const res = await api()
      .post('/clientes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Joao', documento: '123' });

    expect(res.status).toBe(400);
    expect(responseMessage(res)).toContain('documento inválido');
  });

  it('POST /veiculos should reject invalid placa format', async () => {
    const res = await api()
      .post('/veiculos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ placa: 'AAAA', modelo: 'Onix', marca: 'GM', ano: 2022 });

    expect(res.status).toBe(400);
    expect(responseMessage(res)).toContain('placa inválida');
  });

  it('POST /pecas then PATCH /pecas/:id/estoque should validate numeric delta', async () => {
    const create = await api()
      .post('/pecas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Filtro', preco: 30, estoque: 10 });

    const createBody = bodyAsRecord(create);
    const pecaId = readString(createBody, 'id');

    expect(create.status).toBe(201);

    const patch = await api()
      .patch(`/pecas/${pecaId}/estoque`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 'abc' });

    expect(patch.status).toBe(400);
    expect(responseMessage(patch)).toContain('delta numérico obrigatório');
  });

  it('POST /os should reject invalid clienteId and veiculoId', async () => {
    const invalidCliente = await api()
      .post('/os')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ clienteId: 'c-x' });
    expect(invalidCliente.status).toBe(400);
    expect(responseMessage(invalidCliente)).toContain('clienteId inválido');

    const invalidVeiculo = await api()
      .post('/os')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ veiculoId: 'v-x' });
    expect(invalidVeiculo.status).toBe(400);
    expect(responseMessage(invalidVeiculo)).toContain('veiculoId inválido');
  });

  it('POST /os/:id/orcamento should return 404 for missing OS', async () => {
    const res = await api()
      .post('/os/inexistente/orcamento')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(res.status).toBe(404);
    expect(responseMessage(res)).toContain('OS não encontrada');
  });

  it('POST /os/:id/enviar-orcamento should return 404 for missing OS', async () => {
    const res = await api()
      .post('/os/inexistente/enviar-orcamento')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(res.status).toBe(404);
    expect(responseMessage(res)).toContain('OS não encontrada');
  });
});
