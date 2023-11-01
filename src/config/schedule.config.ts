import { registerAs } from '@nestjs/config'

export default registerAs('schedule', () => ({
  apiKey: process.env.API_KEY,
}))
