<script setup lang="ts">
import { computed, ComputedRef, defineComponent, Ref, ref } from 'vue'
// import request from 'umi-request';
import { UploadOutlined } from '@ant-design/icons-vue'
import { UploadProps } from 'ant-design-vue'

import { useUploadFileStore } from '../store/upload-file-store'
import { UploadFileTask } from '../hooks/upload-file-task'

// defineProps<{ msg: string }>()
defineComponent({ UploadOutlined })

const store = useUploadFileStore()

const fileList = ref<NonNullable<UploadProps['fileList']>>([])
// const file  = ref<UploadFile|undefined>(undefined);

const file: ComputedRef<File | undefined> = computed(() => {
  return fileList.value.length > 0
    ? (fileList.value[0] as unknown as File)
    : undefined
})

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
const taskRef: Ref<UploadFileTask | undefined> = ref(undefined)
const handleUpload = async () => {
  if (file.value) {
    taskRef.value = store.getUploadFileTaskCreateIfNeeded(file.value)
  }
}

const uploading = computed(() => {
  return taskRef.value ? taskRef.value.uploading : false
})

const timeCost = computed(() => {
  return taskRef.value ? taskRef.value.timeCost : 0
})

const percent = computed(() => {
  return taskRef.value ? taskRef.value.percent : 0
})
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
    <span>计算时间：{{timeCost}}</span>
    <div>
      <!-- 进度{{ taskRef  ? taskRef.percent : 0}}
       -->
      进度 {{percent}}
    </div>

  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
