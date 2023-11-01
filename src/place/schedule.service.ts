import { Injectable } from '@nestjs/common/decorators'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import { RestaurantRepository } from './restaurant.repository'

@Injectable()
export class ScheduleService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private restaurantRepository: RestaurantRepository,
  ) {}

  async getRestaurantData() {
    try {
      const key = await this.configService.get<string>('schedule.apiKey')
      const foodList = ['jpnfood', 'chifood', 'lunch']
      const pIndex = 1
      const pSize = 1000
      let GenrestrtFood = ''
      let uniqueData

      for (const food of foodList) {
        let collectedData = []

        const apiUrl = `https://openapi.gg.go.kr/Genrestrt${food}?KEY=${key}&Type=json&pIndex=${pIndex}&pSize=${pSize}`
        const response = await lastValueFrom(this.httpService.get(apiUrl))
        GenrestrtFood = 'Genrestrt' + food
        const totalCount =
          response.data[GenrestrtFood][0].head[0].list_total_count // 데이터 총 수
        collectedData = collectedData.concat(
          response.data[GenrestrtFood][1].row,
        )

        const totalPages = Math.ceil(totalCount / pSize)
        for (let index = 2; index <= totalPages; index++) {
          const nextPageUrl = `https://openapi.gg.go.kr/Genrestrt${food}?KEY=${key}&Type=json&pIndex=${index}&pSize=${pSize}`
          const nextPageResponse = await lastValueFrom(
            this.httpService.get(nextPageUrl),
          )
          collectedData = collectedData.concat(
            nextPageResponse.data[GenrestrtFood][1].row,
          )
        }
        collectedData = collectedData
          .filter(
            (data) =>
              data.BSN_STATE_NM !== '폐업' &&
              data.REFINE_ROADNM_ADDR !== null &&
              data.REFINE_WGS84_LAT !== null &&
              data.REFINE_WGS84_LOGT !== null,
          )
          .map((data) => {
            return {
              nameAddress: `${data.BIZPLC_NM}${data.REFINE_ROADNM_ADDR.replace(
                /\s/g,
                '',
              )}`, // nameAddress 필드에 BIZPLC_NM 값과 띄어쓰기를 제거한 REFINE_ROADNM_ADDR 값을 조합하여 할당
              countyName: data.SIGUN_NM, // countyName 필드에 SIGUN_NM 값을 할당
              name: data.BIZPLC_NM, // name 필드에 BIZPLC_NM 값을 할당
              type: data.SANITTN_BIZCOND_NM, // type 필드에 SANITTN_BIZCOND_NM 값을 할당
              address: data.REFINE_ROADNM_ADDR, // address 필드에 REFINE_ROADNM_ADDR 값을 할당
              lat: data.REFINE_WGS84_LAT, // lat 필드에 REFINE_WGS84_LAT 값을 할당
              lon: data.REFINE_WGS84_LOGT, // lon 필드에 REFINE_WGS84_LOGT 값을 할당
              score: 0, // score 필드에 초기 점수를 할당
            }
          })

        uniqueData = Array.from(
          new Set(collectedData.map((item) => item.nameAddress)),
        ).map((nameAddress) => {
          return collectedData.find((item) => item.nameAddress === nameAddress)
        })
        await this.restaurantRepository.upsert(uniqueData, ['nameAddress'])
      }
    } catch (error) {
      console.error(error)
    }
  }
}
