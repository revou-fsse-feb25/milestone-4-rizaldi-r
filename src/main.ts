import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RepositoryExceptionFilter } from './_common/filters/repository-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // error message
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new RepositoryExceptionFilter(httpAdapterHost));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
