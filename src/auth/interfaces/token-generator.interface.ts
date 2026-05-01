import { User } from 'src/user/user.schema';
import { Token } from '../dto/response/token.response.dto';
export interface TokenGeneratorInterface {
  generateTokens(user: User): Promise<Token>;
  refreshToken(refreshToken: string): Promise<Pick<Token, 'accessToken'>>;
}
