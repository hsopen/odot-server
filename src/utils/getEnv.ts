import dotenv from 'dotenv'
import env from 'env-var'

dotenv.config()

export default {
  PORT: env.get('PORT').required().asPortNumber(),
}
