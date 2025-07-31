import { Request } from 'express';
import { PayloadDto } from '../res/payload.dto';

export type RequestItf = Request & {
  user?: PayloadDto;
};
