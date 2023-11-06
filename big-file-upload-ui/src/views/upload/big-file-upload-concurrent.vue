<script setup lang="ts">
import { defineComponent, ref } from 'vue'
// import request from 'umi-request';
import { UploadOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import axios from 'axios'
import { uploadFileBlock, mergeFileChunks, fileUploadCheck } from '@/api/upload'
import { FileUploadCheckResult, FileChunk, FileUploadChunk } from '@/models/upload-file-model'
import md5 from '@/utils/hash'

defineComponent({ UploadOutlined })

/// big-file-upload-concurrent

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

// 2.file slice
const CHUNK_SIZE = 3 * 1024 * 1024
const createFileUploadChunks = async (
  file: File,
  chunkSize = CHUNK_SIZE
): Promise<FileChunk[]> => {
  uploadedSize.value = 0
  const map: Map<number, FileUploadChunk> = new Map()
  if (fileUploadCheckResult.value && fileUploadCheckResult.value.data) {
    fileUploadCheckResult.value.data.forEach((item) => {
      // if (item.exist) {
      // Calculate uploaded data
      uploadedSize.value += chunkSize
      map.set(item.index, item)
      // }
    })
  }

  const fileChunkList: FileChunk[] = []
  let cur = 0
  let index = 0
  while (cur < file.size) {
    // Filter uploaded
    if (!map.get(cur)) {
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
const uploadFile = async (file: File) => {
  //  const md5Digest2 = await md5(file)
  // console.log({md5Digest2});

  const chunkSize = CHUNK_SIZE
  // Get the status of file upload
  fileUploadCheckResult.value = await fileUploadCheck(file, chunkSize)
  console.log(
    ' fileUploadCheckResult.value' + JSON.stringify(fileUploadCheckResult.value)
  )

  if (fileUploadCheckResult.value.finish) {
    console.log('File already exists')
    return
  }

  // Get the slices to be uploaded
  const fileChunkList: FileChunk[] = await createFileUploadChunks(
    file,
    chunkSize
  )

  uploading.value = true
  const uploadId = fileUploadCheckResult.value.uploadId
  // You can use any AJAX library you like
  // const a = file.slice(0, 2*1024*1024)
  const start = new Date().getTime()
  const jobs: any[] = []
  fileChunkList.forEach(async (element) => {
    jobs.push(uploadChunk(element, uploadId))
  })

  Promise.all(jobs)
    .then(() => {
      console.log('Start merging')
      return mergeFileChunks(fileUploadCheckResult.value!.uploadId)
    })
    .then(() => {
      console.log('upload completed')
      uploading.value = false
      const end = new Date().getTime()
      time.value = end - start
      console.log('time cost' + (time.value))
    })
    .catch((e) => {
      console.log(e)
      uploading.value = false
    })

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
    <span>calculating time : {{time}}</span>

  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
