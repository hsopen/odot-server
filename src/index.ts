import cors from 'cors'
import express from 'express'
import router from './router'
import getEnv from './utils/getEnv'
import logger from './utils/logger'

const app = express()

app.use(cors({
  origin: getEnv.CORS,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', router)
app.listen(getEnv.PORT, () => {
  logger.info(`Server started on port ${getEnv.PORT}`)
})
