import { Between, Repository } from 'typeorm'
import { CustomRepository } from '../common/decorator/typeorm-ex.decorator'
import { Restaurant } from './entities/restaurant.entity'
import { statusEnum } from './types/restaurant.enum'
@CustomRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async getRestaurantsInRange(query): Promise<Restaurant[]> {
    const { lat, lon, range, filter } = query

    // 위도와 경도에 범위를 더하거나 뺀 값으로 사각형의 네 꼭짓점 구하기
    const latRange = range / 111 // 대략적으로 1도는 111km
    const lonRange = range / 88 // 대략적으로 1도는 88km

    const minLat = lat - latRange
    const maxLat = lat + latRange
    const minLon = lon - lonRange
    const maxLon = lon + lonRange

    // 데이터베이스에서 사각형 범위에 있는 영업 중인 식당을 찾음.
    const restaurants = await this.find({
      where: {
        lat: Between(minLat, maxLat),
        lon: Between(minLon, maxLon),
        status: statusEnum.open,
        type: filter,
      },
    })
    return restaurants
  }

  async findRestaurantById(id: number) {
    const restaurant = await this.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.reviews', 'review')
      .orderBy('review.createdAt', 'DESC')
      .where('restaurant.id = :id', { id })
      .getOne()
    return restaurant
  }

  async findPopularRestaurantById(id: number) {
    const popularRestaurant = await this.createQueryBuilder('popularRestaurant')
      .leftJoinAndSelect('popularRestaurant.reviews', 'review')
      .where('popularRestaurant.id = :id', { id })
      .andWhere('popularRestaurant.score >= 4')
      .orderBy('review.createdAt', 'DESC')
      .getOne()
    return popularRestaurant
  }
}
