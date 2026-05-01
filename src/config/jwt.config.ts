import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  signOptions: { algorithm: 'HS256', expiresIn: '1h' },
  accessTokenTTL: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10), // Default to 3600 seconds if not set
  refreshTokenTTL: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
}));
