<script setup lang="ts">
import { defineComponent, ref } from 'vue'
// import request from 'umi-request';
import { UploadOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'

import axios from 'axios'

import {
  FileUploadCheckResult,
  FileChunk,
  FileUploadChunk
} from '@/models/upload-file-model'
import md5 from '../utils/hash'

defineProps<{ msg: string }>()
defineComponent({ UploadOutlined })

const fileList = ref<NonNullable<UploadProps['fileList']>>([])
const uploading = ref<boolean>(false)
const time = ref<number>(0)

const handleRemove: UploadProps['onRemove'] = (file) => {
  const index = fileList.value.indexOf(file)
  const newFileList = fileList.value.slice()
  newFileList.splice(index, 1)
  fileList.value = newFileList
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  fileList.value = [file]
  return false
}

const handleUpload = () => {
  uploadFile(fileList.value[0] as unknown as File)
  // fileUploadCheck(fileList.value[0] as unknown as File)
  // var start = new Date().getTime() // 开始时间
  // uploading.value = true
  // const hash = calculateHash2(fileList.value[0] as unknown as File)
  // var end = new Date().getTime() // 结束时间
  // time.value = end - start
  // console.log('hash:' + hash)
  // uploading.value = false

  //   .then((hash) => {
  //     var end = new Date().getTime() // 结束时间
  //     time.value = end - start
  //     console.log('hash:' + hash)
  //     uploading.value = false
  //   })
  //   .catch((e) => {
  //     console.log('hash error ' + e)
  //     uploading.value = false
  //   })

  // const formData = new FormData()
  // fileList.value.forEach((file: UploadProps['fileList'][number]) => {
  //   formData.append('files[]', file as any)
  // })
  // uploading.value = true
  // // You can use any AJAX library you like
  // axios
  //   .post(
  //     '/file/upload/part',
  //     {
  //       files: fileList.value[0],
  //       uploadId: fileUploadCheckResult.value.uploadId
  //     },
  //     {
  //       headers: {
  //         'Content-Type': 'multipart/form-data'
  //       }
  //     }
  //   )
  //   .then(() => {
  //     fileList.value = []
  //     uploading.value = false
  //     message.success('upload successfully.')
  //   })
  //   .catch(() => {
  //   uploading.value = false
  //   message.error('upload failed.')
  // })
}

const fileUploadCheckResult = ref<FileUploadCheckResult | undefined>(undefined)
const percentage = ref<number>(0)
const uploadedSize = ref<number>(0)

/// 1.检测上传文件状态。是否已经上传完成、上传进度
// 文件已上传返回什么？
const fileUploadCheck = async (
  file: File,
  chunkSize = CHUNK_SIZE
): Promise<FileUploadCheckResult> => {
  const r = await axios.post('/file/upload/check', {
    name: file.name,
    size: file.size, // 文件大小
    partSize: chunkSize, // 分片大小
    lastModified: file.lastModified // 文件修改时间
  })
  console.log(r)
  return r.data as FileUploadCheckResult
  // return new Promise((res, rej) => {
  //   return res({} as FileUploadCheckResult)
  // })
}

/// 2.文件切片
const CHUNK_SIZE = 3 * 1024 * 1024
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
        percent: 0,
      })
    }
    cur += chunkSize
    index += 1
  }
  return fileChunkList
}

/// 3.上传切片
const uploadFile = async (file: File) => {
  //  const md5Digest2 = await md5(file)
  // console.log({md5Digest2});

  const chunkSize = CHUNK_SIZE
  // 获取文件上传的状态
  fileUploadCheckResult.value = await fileUploadCheck(file, chunkSize)
  console.log(
    ' fileUploadCheckResult.value' + JSON.stringify(fileUploadCheckResult.value)
  )

  if (fileUploadCheckResult.value.finish) {
    console.log('文件已存在')
    return
  }

  // 获取需要上传的切片
  const fileChunkList: FileChunk[] = await createFileUploadChunks(
    file,
    chunkSize
  )

  uploading.value = true
  const uploadId = fileUploadCheckResult.value.uploadId
  // You can use any AJAX library you like
  // const a = file.slice(0, 2*1024*1024)
  const start = new Date().getTime()
  for (const element of fileChunkList) {
    await uploadChunk(element, uploadId)
  }
  console.log('开始merge2')
  await mergeFileChunks(fileUploadCheckResult.value.uploadId)
  console.log('上传完成')
  const end = new Date().getTime()
  console.log('用时' + (end - start)) //116.9 MB 用时3794
  uploading.value = false

  return
}

const uploadChunk = async (fileChunk: FileChunk, uploadId: string) => {
  const fileBlob = fileChunk.fileBlob
  const index = fileChunk.index
  const md5Digest = await md5(fileBlob)
  console.log({ md5Digest })
  await axios
    .post(
      '/file/upload/part',
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
        }
      }
    )
    .then(() => { })
    .catch(() => { })
}

/// 4.合并切片
const mergeFileChunks = async (uploadId: string) => {
  const r = await axios.post('/file/merge', {
    uploadId: uploadId
  })
  console.log(r)
}
</script>

<template>
  <div class="clearfix">
    <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove">
      <a-button>
        <upload-outlined></upload-outlined>
        Select File
      </a-button>
    </a-upload>
    <a-button type="primary" :disabled="fileList.length === 0" :loading="uploading" style="margin-top: 16px"
      @click="handleUpload">
      {{ uploading ? 'Uploading' : 'Start Upload' }}
    </a-button>
    <span>计算时间：{{time}}</span>

  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
