import { Module } from '@nestjs/common'
import { RestaurantService } from './restaurant.service'
import { RestaurantController } from './restaurant.controller'
import { HttpModule } from '@nestjs/axios/dist'
import { ScheduleService } from './schedule.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Restaurant } from './entities/restaurant.entity'
import { TypeOrmExModule } from 'src/common/decorator/typeoprm-ex.module'
import { RestaurantRepository } from './restaurant.repository'

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Restaurant]),
    TypeOrmExModule.forCustomRepository([RestaurantRepository]),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService, ScheduleService],
})
export class RestaurantModule {}
