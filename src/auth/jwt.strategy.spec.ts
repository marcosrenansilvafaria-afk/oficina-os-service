import { Role } from './roles.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('deve mapear payload para user autenticado', () => {
    const strategy = new JwtStrategy();

    const result = strategy.validate({ sub: 'u-1', role: Role.MECANICO });

    expect(result).toEqual({ userId: 'u-1', role: Role.MECANICO });
  });
});
