import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';

describe('AuthService', () => {
  it('deve gerar token para credenciais validas', async () => {
    const signAsyncMock = jest.fn().mockResolvedValue('token-valido');
    const jwtService = {
      signAsync: signAsyncMock,
    } as unknown as JwtService;
    const service = new AuthService(jwtService);

    const result = await service.login({
      email: 'admin@oficina.com',
      senha: 'admin123',
    });

    expect(result).toEqual({ access_token: 'token-valido' });
    expect(signAsyncMock).toHaveBeenCalledWith({
      sub: 'user-admin-1',
      role: Role.ADMIN,
    });
  });

  it('deve falhar com credenciais invalidas', async () => {
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const service = new AuthService(jwtService);

    await expect(
      service.login({ email: 'x@oficina.com', senha: 'errada' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
