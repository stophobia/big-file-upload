import { FileUploadCheckResult } from '@/models/upload-file-model'
import axios from 'axios'

/// upload file block
export const uploadFileBlock = async (params: {
  uploadId: string
  index: number
  fileBlob: Blob
  md5Digest: string
  onUploadProgress?: (progressEvent: any) => void
}) => {
  const { uploadId, index, fileBlob, md5Digest, onUploadProgress } = params
  const r = await axios.post(
    '/file/upload/' + uploadId + '/part',
    {
      files: new File([fileBlob], uploadId + '-' + md5Digest + '.part' + index),
      index: index,
      md5Digest: md5Digest,
      uploadId: uploadId
    },
    {
      headers: {
        'Content-Type': 'multipart/form-data'
        //  'Content-Type' :'application/x-www-form-urlencoded'
      },
      onUploadProgress: onUploadProgress
    }
  )

  return r.data
}

/// merge file
export async function mergeFileChunks(uploadId: string) {
  const r = await axios.post('/file/merge', {
    uploadId: uploadId
  })
  return r.data
}

// 1. Check the uploaded file status. Whether the upload has been completed and the upload progress
// What is returned after the file has been uploaded?
/// check file
export async function fileUploadCheck(
  file: File,
  chunkSize: number
): Promise<FileUploadCheckResult> {
  const r = await axios.post('/file/upload/check', {
    name: file.name,
    size: file.size, // File size
    partSize: chunkSize, // fragment size
    lastModified: file.lastModified // File modification time
  })
  console.log(r)
  return r.data as FileUploadCheckResult
}
