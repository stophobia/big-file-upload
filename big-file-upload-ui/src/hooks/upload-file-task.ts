import axios from 'axios'
import { computed, ComputedRef, Ref, ref } from 'vue'
import md5, { calculateFileHash } from '../utils/hash'

import QueueCreate from 'promise-queue-plus/create'
import {
  FileChunk,
  FileUploadCheckResult,
  FileUploadChunk
} from '@/models/upload-file-model'
// import Queue from 'promise-queue-plus'
import { uploadFileBlock, mergeFileChunks, fileUploadCheck } from '@/api/upload'
/// Section size
const CHUNK_SIZE = 3 * 1024 * 1024

export function useUploadFileTask(
  file: File,
  config?: {
    chunkSize?: number
    taskComplete?: (task: UploadFileTask, info?: any) => void
  }
): UploadFileTask {
  // Control the queue of upload tasks
  const Queue = QueueCreate(Promise)
  // Queue.use(Promise)
  // Realize a queue with a maximum concurrency of 1
  var queue1 = Queue(6, {
    retry: 3, // Number of retries
    retryIsJump: true, // retry now?
    timeout: 60000, // The timeout period
    workResolve: async function (value: any, queue: any) {
      console.log('workResolve ' + JSON.stringify(value))
      uploadedSize.value += (value.fileChunk as FileChunk).size
    },
    workReject: function (reason: any, queue: any) {
      // uploading.value = false
      console.log('upload failed' + reason + ' ' + JSON.stringify(queue))
    },
    workFinally: function (queue: any) {
      // console.log('workFinally')
    },
    queueStart: function (queue: any) {
      console.log('queueStart')
    },
    queueEnd: function (queue: any) {
      console.log('queueEnd')
      uploading.value = false
      if (percent.value === 1) {
      } else {
        console.log('queueEnd upload failed')
        if (config?.taskComplete) {
          config.taskComplete(task, 'upload failed')
        }
      }
    }
  })
  const id = createTaskId(file)
  // Is uploading
  const uploading = ref<boolean>(false)
  // Shard size
  const chunkSize = config?.chunkSize ?? CHUNK_SIZE
  // Check the status of a file
  const fileUploadCheckResult = ref<FileUploadCheckResult | undefined>(
    undefined
  )
  // Uploaded size
  const uploadedSize = ref<number>(0)
  // Upload start time
  const start = ref<number>(0)
  // Upload time used
  const timeCost = ref<number>(0)

  const percent = computed(() => {
    if (file && file.size > 0) {
      let val = uploadedSize.value / file.size
      val = Math.min(1, val)
      return parseFloat(val.toFixed(3))
    }
    return 0
  })

  // 2.File cutting, filtering uploaded chunks
  const createFileUploadChunks = async (
    file: File,
    chunkSize = CHUNK_SIZE
  ): Promise<FileChunk[]> => {
    uploadedSize.value = 0
    const map: Map<number, FileUploadChunk> = new Map()
    if (fileUploadCheckResult.value && fileUploadCheckResult.value.data) {
      fileUploadCheckResult.value.data.forEach((item) => {
        // Calculate uploaded data
        uploadedSize.value += chunkSize
        map.set(item.index, item)
      })
    }
    const fileChunkList: FileChunk[] = []
    let cur = 0
    let index = 0
    while (cur < file.size) {
      // Filter uploaded
      if (!map.get(index)) {
        // file.slice returns a blob object
        const chunkBold = file.slice(cur, cur + chunkSize)
        fileChunkList.push({
          fileBlob: chunkBold,
          index,
          size: chunkBold.size,
          percent: 0
        })
      }
      cur += chunkSize
      index += 1
    }
    return fileChunkList
  }

  /// 3.Upload slices
  async function uploadChunk(fileChunk: FileChunk, uploadId: string) {
    const fileBlob = fileChunk.fileBlob
    const index = fileChunk.index
    const md5Digest = await md5(fileBlob)
    console.log({ md5Digest })

    const params = {
      uploadId: uploadId,
      index: index,
      fileBlob: fileBlob,
      md5Digest: md5Digest,
      onUploadProgress: (progressEvent: any) => {
        fileChunk.percent =
          ((progressEvent.loaded / progressEvent.total) * 100) | 0
        console.log(
          'progressEvent' +
            progressEvent.loaded +
            ' ' +
            progressEvent.total +
            ' ' +
            fileChunk.percent
        )
      }
    }
    const data = await uploadFileBlock(params)
    return {
      data: data,
      fileChunk
    }
  }

  /// 4.Merge slices

  const startUpload = async () => {
    const uploadFile = file
    if (!uploadFile) {
      console.log('No file selected')
      if (config?.taskComplete) {
        config.taskComplete(task, 'No file selected')
      }
      return
    }

    // Get the status of file upload
    fileUploadCheckResult.value = await fileUploadCheck(uploadFile!, chunkSize)
    console.log(
      ' fileUploadCheckResult.value' +
        JSON.stringify(fileUploadCheckResult.value)
    )
    if (fileUploadCheckResult.value.finish) {
      console.log('File already exists')
      uploadedSize.value = file.size
      if (config?.taskComplete) {
        config.taskComplete(task)
      }
      return
    }

    // Get the slices to be uploaded
    const fileChunkList: FileChunk[] = await createFileUploadChunks(
      uploadFile!,
      chunkSize
    )

    uploading.value = true
    const uploadId = fileUploadCheckResult.value.uploadId
    // You can use any AJAX library you like
    // const a = file.slice(0, 2*1024*1024)
    var log = function (msg: any) {
      console.log(msg)
    }
    start.value = new Date().getTime()
    queue1.onError = function (err: any) {
      const msg = 'onError Done something went wrong' + err
      console.log(msg)
      if (config?.taskComplete) {
        config.taskComplete(task, msg)
      }
    }

    queue1
      .addLikeArray(
        fileChunkList,
        (element: FileChunk) => {
          return uploadChunk(element, uploadId)
        }
        // { workResolve: log }
      )
      .then(async () => {
        console.log('Start merging')
        await mergeFileChunks(fileUploadCheckResult.value?.uploadId!)
        console.log('upload completed')
        const end = new Date().getTime()
        console.log('time cost' + (timeCost.value = end - start.value))
        uploading.value = false

        if (config?.taskComplete) {
          config.taskComplete(task)
        }
      })
      .catch((e: any) => {
        console.log('Upload completed error' + e)
      })
    queue1.start()
    return
  }
  const task = { id, startUpload, timeCost, uploading, percent }
  return task
}

export interface UploadFileTask {
  id: string
  startUpload: () => Promise<void>
  timeCost: Ref<number>
  uploading: Ref<boolean>
  percent: ComputedRef<number>
}

export const createTaskId = (file: File) => {
  return calculateFileHash(file)
}
