export interface FileUploadChunk {
  index: number // 分片索引
  // md5Digest?: string // 分片MD5
  // exist: boolean // 分片是否已上传
}

export interface FileChunk {
  fileBlob: Blob
  index: number
  size: number
  percent: number
}

export interface FileUploadCheckParams {
  name: string // 文件名
  size: number // 文件大小
  partSize: number // 分片大小
  lastModified: number // 文件修改时间
}

/// 检测文件返回值
export interface FileUploadCheckResult {
  uploadId: string // 文件上传记录标识，md5(name=xxx.xxxsize=1234lastModified=16628000) 作为唯一标识
  partCount: number //分片数量
  data: FileUploadChunk[] // 历史分片列表
  finish: boolean // 是否存在
}
