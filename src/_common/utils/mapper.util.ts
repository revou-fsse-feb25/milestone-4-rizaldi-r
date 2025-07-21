import { plainToInstance } from 'class-transformer';

export function mapEntityToDto<Dto, Entity>(
  dtoClass: new (...args: any[]) => Dto,
  entity: Entity,
): Dto {
  const resultDto = plainToInstance<Dto, Entity>(dtoClass, entity, {
    excludeExtraneousValues: true,
  });
  return resultDto;
}
