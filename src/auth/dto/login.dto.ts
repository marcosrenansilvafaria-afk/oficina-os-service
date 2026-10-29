import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@oficina.com' })
  email!: string;

  @ApiProperty({ example: 'admin123' })
  senha!: string;
}
