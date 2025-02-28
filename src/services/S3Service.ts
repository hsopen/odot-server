import { Buffer } from 'node:buffer'
import client from '../utils/aliOSS'
import logger from '../utils/logger'

const s3Service = {

  /**
   * 获取文件预签名链接
   * @param filePath 文件路径
   * @param expires 过期时间
   * @returns 返回url或null
   */
  async getFileSignature(filePath: string, expires?: number) {
    try {
      if (expires) {
        const url: string = client.signatureUrl(filePath, {
          expires,
          method: 'GET',
        })
        return url
      }
      else {
        const url: string = client.signatureUrl(filePath, {
          method: 'GET',
        })
        return url
      }
    }
    catch (err) {
      logger.error(err)
      return null
    }
  },

  /**
   * 上传文件
   * @param filePath 文件路径
   * @param file 文件数据
   * @param fileSize 文件大小限制
   * @returns 上传的结果
   */
  async uploadFile(filePath: string, file: Buffer | string, fileSize: number): Promise<boolean> {
    try {
      // 检查文件大小
      if (file instanceof Buffer && file.length > fileSize) {
        throw new Error('File size exceeds the 5MB limit')
      }
      // 上传文件
      await client.put(filePath, file)

      // 返回上传结果
      return true
    }
    catch (error) {
      console.error('Error uploading file:', error)
      return false
    }
  },
}

export default s3Service
