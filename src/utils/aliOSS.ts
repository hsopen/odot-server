import OSS from 'ali-oss'
import getEnv from './getEnv'

const client = new OSS({
  region: getEnv.S3_REGION, // OSS 的地域
  accessKeyId: getEnv.S3_ID,
  accessKeySecret: getEnv.S3_SECRET,
  bucket: getEnv.S3_BUCKET, // 你的 Bucket 名称
})

export default client
