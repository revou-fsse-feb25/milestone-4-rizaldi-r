import { PayloadDto } from '../res/payload.dto';

declare global {
  namespace Express {
    interface Request {
      user?: PayloadDto;
    }
  }
}
