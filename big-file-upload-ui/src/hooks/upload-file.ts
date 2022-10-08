import axios from 'axios'
import { computed, ComputedRef, Ref, ref } from 'vue'
import md5 from '../utils/hash'

import QueueCreate from 'promise-queue-plus/create'
// import Queue from 'promise-queue-plus'

import { uploadFileBlock, mergeFileChunks, fileUploadCheck } from '@/api/upload'

import {
  FileChunk,
  FileUploadCheckResult,
  FileUploadChunk
} from '@/models/upload-file-model'

/// 切片大小
const CHUNK_SIZE = 3 * 1024 * 1024

export function useUploadFile(
  file: Ref<File | undefined> | ComputedRef<File | undefined>,
  config?: { chunkSize?: number }
) {
  // 控制上传任务的队列
  const Queue = QueueCreate(Promise)
  // Queue.use(Promise)
  //Realize a queue with a maximum concurrency of 1
  var queue1 = Queue(6, {
    retry: 3, //Number of retries
    retryIsJump: true, //retry now?
    timeout: 60000, //The timeout period
    workResolve: async function (value: any, queue: any) {
      console.log('workResolve ' + JSON.stringify(value))
      uploadedSize.value += (value.fileChunk as FileChunk).size
    },
    workReject: function (reason: any, queue: any) {
      // uploading.value = false
      console.log('上传失败' + reason + ' ' + JSON.stringify(queue))
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
        console.log('queueEnd 上传失败')
      }
    }
  })

  // 是否上传中
  const uploading = ref<boolean>(false)
  // 分片大小
  const chunkSize = config?.chunkSize ?? CHUNK_SIZE
  // 检测文件的状态
  const fileUploadCheckResult = ref<FileUploadCheckResult | undefined>(
    undefined
  )
  // 已上传的大小
  const uploadedSize = ref<number>(0)
  // 上传开始时间
  const start = ref<number>(0)
  // 上传使用的时间
  const timeCost = ref<number>(0)

  const percent = computed(() => {
    if (file.value && file.value?.size > 0) {
      let val = uploadedSize.value / file.value!.size
      val = Math.min(1, val)
      return parseFloat(val.toFixed(3))
    }
    return 0
  })


  /// 2.文件切割，过滤已上传的块
  const createFileUploadChunks = async (
    file: File,
    chunkSize = CHUNK_SIZE
  ): Promise<FileChunk[]> => {
    uploadedSize.value = 0
    const map: Map<number, FileUploadChunk> = new Map()
    if (fileUploadCheckResult.value && fileUploadCheckResult.value.data) {
      fileUploadCheckResult.value.data.forEach((item) => {
        // 计算已上传的数据
        uploadedSize.value += chunkSize
        map.set(item.index, item)
      })
    }
    const fileChunkList: FileChunk[] = []
    let cur = 0
    let index = 0
    while (cur < file.size) {
      // 过滤已上传的
      if (!map.get(cur)) {
        // file.slice 返回一个 blob对象
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

  /// 3.上传切片
  async function uploadChunk(fileChunk: FileChunk, uploadId: string) {
    const fileBlob = fileChunk.fileBlob
    const index = fileChunk.index
    const md5Digest = await md5(fileBlob)
    console.log({ md5Digest })
    const r = await axios.post(
      '/file/upload/' + uploadId + '/part',
      {
        files: new File(
          [fileBlob],
          uploadId + '-' + md5Digest + '.part' + index
        ),
        index: index,
        md5Digest: md5Digest,
        uploadId: uploadId
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data'
          //  'Content-Type' :'application/x-www-form-urlencoded'
        },
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
    )
    return {
      data: r.data,
      fileChunk
    }
  }

 
  const startUpload = async () => {
    const uploadFile = file.value

    if (!uploadFile) {
      console.log('未选择文件')

      return
    }

    // 获取文件上传的状态
    fileUploadCheckResult.value = await fileUploadCheck(uploadFile!, chunkSize)
    console.log(
      ' fileUploadCheckResult.value' +
        JSON.stringify(fileUploadCheckResult.value)
    )
    if (fileUploadCheckResult.value.finish) {
      console.log('文件已存在')
      uploadedSize.value = file.value.size
      return
    }

    // 获取需要上传的切片
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
      console.log('onError 完成 出错了 ' + err)
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
        console.log('开始merge')
        await mergeFileChunks(fileUploadCheckResult.value?.uploadId!)
        console.log('上传完成')
        const end = new Date().getTime()
        console.log('用时' + (timeCost.value = end - start.value)) // 116.9 MB 6路并发 用时1697
        uploading.value = false
      })
      .catch((e: any) => {
        console.log('上传完成 出错' + e)
      })
    queue1.start()
    return
  }

  return { startUpload, timeCost, uploading, percent }
}
