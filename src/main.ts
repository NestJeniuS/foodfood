import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import * as moment from 'moment'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'silly', // prod에선 info 이하 로그레벨 출력, dev에선 silly이하 로그레벨 출력
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 날짜 형식
            winston.format.prettyPrint({ colorize: true }),
            winston.format.label({ label: 'foodfood' }), // 프로젝트 명
            winston.format.printf(({ level, message, label, timestamp }) => {
              let logColor
              /*
               * Log Level
               * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
               */
              switch (level) {
                case 'log':
                  logColor = '\x1b[34m' // 파란색
                  break
                case 'error':
                  logColor = '\x1b[31m' // 빨간색
                  break
                case 'warn':
                  logColor = '\x1b[33m' // 노란색
                  break
                default:
                  logColor = '\x1b[37m' // 흰색
                  break
              }

              return `[${label}] ${logColor}${timestamp} [${level.toUpperCase()}] - ${message}\x1b[0m` // [프로젝트명] 시간 [로그레벨] 메세지
            }),
          ),
        }),

        new winston.transports.File({
          level: 'error',
          filename: `error-${moment(new Date()).format('YYYY-MM-DD')}.log`, // // 에러 로그는 error-2023-10-31.log 형식으로 저장
          dirname: 'logs/errors', // logs/erros 폴더에 생성
          maxsize: 5000000,
          format: winston.format.combine(
            winston.format.errors({ stack: true }),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.label({ label: 'foodfood' }), // 프로젝트 이름
            winston.format.printf(({ level, message, label, timestamp }) => {
              let logColor

              switch (level) {
                case 'log':
                  logColor = '\x1b[34m' // 파란색
                  break
                case 'error':
                  logColor = '\x1b[31m' // 빨간색
                  break
                case 'warn':
                  logColor = '\x1b[33m' // 노란색
                  break
                default:
                  logColor = '\x1b[37m' // 흰색
                  break
              }

              return `[${label}] ${logColor}${timestamp} [${level.toUpperCase()}] - ${message}\x1b[0m`
            }),
            winston.format.json(), // 에러는 json형식으로 저장한다.
          ),
        }),

        new winston.transports.File({
          filename: `application-${moment(new Date()).format(
            'YYYY-MM-DD',
          )}.log`,
          dirname: 'logs',
          maxsize: 5000000,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.label({ label: 'foodfood' }),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} [${level.toUpperCase()}] - ${message}`
            }),
          ),
        }),
      ],
    }),
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('please insert project name')
    .setDescription('The [project name] API description')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('user')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('swagger', app, document)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: true,
    }),
  )

  const configService = app.get(ConfigService)
  const port = configService.get('PORT') || 3000
  await app.listen(port)
  Logger.log(`Application running on port ${port}`)
}
bootstrap()
