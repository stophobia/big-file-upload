<script setup lang="ts">
import { defineComponent, ref } from 'vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'

import { uploadFileBlock, mergeFileChunks, fileUploadCheck } from '@/api/upload'

import {
  FileUploadCheckResult,
  FileChunk,
  FileUploadChunk
} from '@/models/upload-file-model'

import md5 from '@/utils/hash'

defineComponent({ UploadOutlined })

/// big-file-upload-serial

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
}

const fileUploadCheckResult = ref<FileUploadCheckResult | undefined>(undefined)
const percentage = ref<number>(0)
const uploadedSize = ref<number>(0)


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
  time.value = end - start
  console.log('用时' + (time.value)) //116.9 MB 用时3794
  uploading.value = false

  return
}

const uploadChunk = async (fileChunk: FileChunk, uploadId: string) => {
  const fileBlob = fileChunk.fileBlob
  const index = fileChunk.index
  const md5Digest = await md5(fileBlob)
  console.log({ md5Digest })
  const params = {
    uploadId: uploadId,
    index: index,
    fileBlob: fileBlob,
    md5Digest: md5Digest,
  }
  const data = await uploadFileBlock(params)
}


</script>

<template>
  <div class="clearfix">
    <h1>
      big-file-upload-serial
    </h1>
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
