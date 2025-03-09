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
        throw new Error('File size exceeds the limit')
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

  /**
   * 删除文件
   * @param filePath 文件路径
   * @returns 是否删除成功
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await client.delete(filePath)
      return true
    }
    catch (error) {
      logger.error('Error deleting file:', error)
      return false
    }
  },

  /**
   * 删除文件夹（删除所有以该前缀开头的文件）
   * @param folderPath 文件夹路径（以 `/` 结尾）
   * @returns 是否删除成功
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      let hasMore = true
      let marker: string | undefined

      while (hasMore) {
        // 调用 list 方法时，传递两个参数：query 和 options
        const result = await client.list(
          {
            'prefix': folderPath,
            marker,
            'max-keys': 1000, // 每次最多列出1000个文件
          },
          {}, // 第二个参数是 options，可以为空对象
        )

        if (result.objects && result.objects.length > 0) {
          const deleteObjects = result.objects.map(obj => obj.name)
          await client.deleteMulti(deleteObjects)
        }

        // 检查是否还有更多文件
        hasMore = result.isTruncated
        marker = result.nextMarker
      }

      return true
    }
    catch (error) {
      logger.error('Error deleting folder:', error)
      return false
    }
  },
}

export default s3Service
