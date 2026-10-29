import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Role } from './roles.enum';

type MockUser = {
  id: string;
  email: string;
  senha: string;
  role: Role;
};

@Injectable()
export class AuthService {
  private readonly users: MockUser[] = [
    {
      id: 'user-admin-1',
      email: 'admin@oficina.com',
      senha: 'admin123',
      role: Role.ADMIN,
    },
    {
      id: 'user-atendente-1',
      email: 'atendente@oficina.com',
      senha: 'atendente123',
      role: Role.ATENDENTE,
    },
    {
      id: 'user-mecanico-1',
      email: 'mecanico@oficina.com',
      senha: 'mecanico123',
      role: Role.MECANICO,
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async login(input: LoginDto) {
    const user = this.users.find(
      (u) => u.email === input.email && u.senha === input.senha,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
