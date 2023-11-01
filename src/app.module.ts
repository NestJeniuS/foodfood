import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeORMConfig } from './config/typeorm.config'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { RestaurantModule } from './place/restaurant.module'
import scheduleConfig from './config/schedule.config'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema,
      load: [scheduleConfig],
      cache: true,
      envFilePath: [
        process.env.NODE_ENV === 'production'
          ? '.production.env'
          : '.development.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await typeORMConfig(configService),
    }),
    AuthModule,
    UserModule,
    RestaurantModule,
  ],
})
export class AppModule {}
