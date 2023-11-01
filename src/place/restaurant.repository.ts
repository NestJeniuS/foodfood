import { Repository } from 'typeorm'
import { CustomRepository } from '../common/decorator/typeorm-ex.decorator'
import { Restaurant } from './entities/restaurant.entity'

@CustomRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {}
