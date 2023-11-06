export interface FileUploadChunk {
  index: number // Sharded index
  // md5Digest?: string // Split MD5
  // exist: boolean // Whether the fragment has been uploaded
}

export interface FileChunk {
  fileBlob: Blob
  index: number
  size: number
  percent: number
}

export interface FileUploadCheckParams {
  name: string // file name
  size: number // file size
  partSize: number // Part size
  lastModified: number // File modification time
}

/// Check file return value
export interface FileUploadCheckResult {
  uploadId: string // File upload record identifier, md5(name=xxx.xxxsize=1234lastModified=16628000) as the unique identifier
  partCount: number //Number of shards
  data: FileUploadChunk[] // Historical shard list
  finish: boolean // Does it exist?
}
