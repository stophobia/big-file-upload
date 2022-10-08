<script setup lang="ts">
import { computed, ComputedRef, defineComponent, ref } from 'vue'
// import request from 'umi-request';
import { UploadOutlined } from '@ant-design/icons-vue'
import { UploadProps } from 'ant-design-vue'
import { useUploadFile } from '@/hooks/upload-file'

// defineProps<{ msg: string }>()
defineComponent({ UploadOutlined })

const fileList = ref<NonNullable<UploadProps['fileList']>>([])
// const file  = ref<UploadFile|undefined>(undefined);

const file: ComputedRef<File | undefined> = computed(() => {
  return fileList.value.length > 0
    ? (fileList.value[0] as unknown as File)
    : undefined
})

const { startUpload, timeCost, uploading, percent } = useUploadFile(file)

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

const handleUpload = async () => {
  startUpload()
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
    <span>计算时间：{{timeCost}}</span>
    <div>
      进度{{percent}}
    </div>

  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
