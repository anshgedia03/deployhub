import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/interface/auth.interface';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
