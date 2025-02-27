import { Buffer } from 'node:buffer'
import client from '../utils/aliOSS'

const s3Service = {
  /**
   * 直接上传文件
   * @param filePath 文件路径
   * @param file 文件数据
   * @returns 上传的结果
   */
  async uploadFile(filePath: string, file: Buffer | string): Promise<any> {
    try {
      // 检查文件类型是否为 webp
      if (typeof file === 'string') {
        const fileExtension = file.split('.').pop()?.toLowerCase()
        if (fileExtension !== 'webp') {
          throw new Error('File must be of type webp')
        }
      }
      else if (file instanceof Buffer) {
        // 处理 Buffer 类型的文件
        // 如果是 Buffer 类型的文件，无法直接检查扩展名，建议通过文件头（magic bytes）来验证
        const fileHeader = file.slice(0, 4).toString('hex')
        if (fileHeader !== '52494646') {
          throw new Error('File must be of type webp')
        }
      }

      // 上传文件
      const result = await client.put(filePath, file)

      // 返回上传结果
      return result
    }
    catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },
}

export default s3Service
