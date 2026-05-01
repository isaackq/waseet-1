import { ApiProperty } from '@nestjs/swagger';

export class Token {
  @ApiProperty({
    description: 'Access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5.........',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5.........',
  })
  refreshToken: string;
}
