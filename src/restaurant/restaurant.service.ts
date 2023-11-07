import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { RestaurantRepository } from './restaurant.repository'
import { Logger } from '@nestjs/common'
import { GetRestaurantDto } from './dto/get-restaurant.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { ReviewRepository } from 'src/review/review.repository'
import { Restaurant } from './entities/restaurant.entity'
// import { CreateRestaurantDto } from './dto/create-restaurant.dto'
// import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { ICACHE_SERVICE } from 'src/common/provider.constant'
import { CacheService } from 'src/cache/cache.service'

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name)

  constructor(
    @InjectRepository(RestaurantRepository)
    private restaurantRepository: RestaurantRepository,
    @Inject(ICACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {}

  async getRestaurantsInRange(query: GetRestaurantDto): Promise<object[]> {
    try {
      const restaurants =
        await this.restaurantRepository.getRestaurantsInRange(query)
      const { lat, lon, range, orderBy } = query
      const point1 = [lon, lat] // 쿼리로 받아온 위치
      const filteredRestaurants = []

      for (let restaurant of restaurants) {
        let lat2 = Number(restaurant.lat)
        let lon2 = Number(restaurant.lon)
        let point2 = [lon2, lat2] // 식당의 위치
        const distance = this.latLonToKm(point1, point2)
        if (distance <= range) {
          const restaurantWithDistance = { ...restaurant, distance }
          filteredRestaurants.push(restaurantWithDistance)
        }
      }

      if (orderBy === 'Rating') {
        filteredRestaurants.sort((a, b) => b.score - a.score) // 평점 내림차순 정렬
      } else if (orderBy === 'Distance') {
        filteredRestaurants.sort((a, b) => a.distance - b.distance) // 거리 오름차순 정렬
      }

      return filteredRestaurants
    } catch (error) {
      this.logger.error(`${error}`)
      throw new InternalServerErrorException(
        '맛집 목록을 가져오는 데 실패했습니다.',
      )
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private latLonToKm(point1: number[], point2: number[]): number {
    const lat1 = point1[1]
    const lon1 = point1[0]
    const lat2 = point2[1]
    const lon2 = point2[0]

    const R = 6371 // km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const radLat1 = this.toRadians(lat1)
    const radLat2 = this.toRadians(lat2)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(radLat1) *
        Math.cos(radLat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  async getRestaurantById(id: number) {
    //유명 맛집 상세정보 캐싱적용
    const cacheKey = `RestaurantId:${id}`
    const popularRestaurant = await this.cacheService.getFromCache(cacheKey)
    // 캐싱데이터가 있다면 바로 반환
    if (popularRestaurant) return { popularRestaurant }
    try {
      const result = await this.restaurantRepository.findRestaurantById(id)

      const popularRestaurants =
        await this.restaurantRepository.findPopularRestaurantById(id)
      // score가 4점이상인 맛집은 캐싱후 반환
      if (!popularRestaurants) return { result }
      else {
        await this.cacheService.setCache(cacheKey, popularRestaurants, 600) // Cache for 10m
        return { popularRestaurants }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        '해당 리뷰를 불러오는데 실패했습니다.',
      )
    }
  }
}
