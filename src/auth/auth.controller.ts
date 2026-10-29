import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Realizar login e retornar access token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Token gerado com sucesso',
    schema: {
      example: {
        access_token: 'jwt.token.aqui',
      },
    },
  })
  @Post('login')
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }
}
