import { Controller, Get, Param } from '@nestjs/common'
import { RestaurantService } from './restaurant.service'
import { ScheduleService } from './schedule.service'

@Controller('restaurant')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly scheduleService: ScheduleService,
  ) {}
  @Get()
  getRestaurantData() {
    return this.scheduleService.getRestaurantData()
  }

  // @Get()
  // findAll() {
  //   return this.restaurantService.findAll()
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.restaurantService.findOne(+id)
  // }
}
