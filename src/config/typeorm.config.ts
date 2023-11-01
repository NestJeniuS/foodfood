import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const typeORMConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOSTNAME') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT')) || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || '0000',
    database: configService.get<string>('DB_DATABASE') || 'postgres',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
    namingStrategy: new SnakeNamingStrategy(),
    // logging: true,
  };
};
