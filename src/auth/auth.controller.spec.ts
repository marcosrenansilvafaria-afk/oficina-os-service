import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('deve delegar login para o service', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({ access_token: 'abc' }),
    };
    const controller = new AuthController(
      authService as unknown as AuthService,
    );

    const input = { email: 'admin@oficina.com', senha: 'admin123' };
    const result = await controller.login(input);

    expect(authService.login).toHaveBeenCalledWith(input);
    expect(result).toEqual({ access_token: 'abc' });
  });
});
