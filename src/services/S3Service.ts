import { Buffer } from 'node:buffer'
import sharp from 'sharp'
import client from '../utils/aliOSS'

const s3Service = {

  /**
   * 直接上传文件
   * @param filePath 文件路径
   * @param file 文件数据
   * @returns 上传的结果
   */
  async uploadAvatar(filePath: string, file: Buffer | string): Promise<any> {
    try {
      // 检查文件大小
      if (file instanceof Buffer && file.length > 5 * 1024 * 1024) {
        throw new Error('File size exceeds the 5MB limit')
      }

      // 检查文件类型是否为 webp
      if (typeof file === 'string') {
        const fileExtension = file.split('.').pop()?.toLowerCase()
        if (fileExtension !== 'webp') {
          throw new Error('File must be of type webp')
        }
      }
      else if (file instanceof Buffer) {
        // 如果是 Buffer 类型的文件，检查文件头（magic bytes）
        const fileHeader = file.slice(0, 4).toString('hex')
        if (fileHeader !== '52494646') { // 'RIFF' 对应的十六进制值
          throw new Error('File must be of type webp')
        }

        // 使用 sharp 获取图片的宽度和高度
        const image = sharp(file)
        const metadata = await image.metadata()

        // 检查图像尺寸是否超过限制
        if (metadata.width && metadata.height) {
          if (metadata.width !== metadata.height) {
            throw new Error(`Image dimensions exceed the limit: ${800}x${800}`)
          }
        }
        else {
          throw new Error('Unable to read image dimensions')
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
