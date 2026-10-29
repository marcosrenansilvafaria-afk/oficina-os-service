export enum Role {
  ADMIN = 'ADMIN',
  MECANICO = 'MECANICO',
  ATENDENTE = 'ATENDENTE',
  // Emitido pela Lambda de autenticacao por CPF (Repositorio 2 da Fase 3),
  // nao pelo fluxo de login interno deste app.
  CLIENTE = 'CLIENTE',
}
