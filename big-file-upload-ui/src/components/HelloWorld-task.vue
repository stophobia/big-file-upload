<script setup lang="ts">
import { computed, ComputedRef, defineComponent, Ref, ref } from 'vue'
// import request from 'umi-request';
import { UploadOutlined } from '@ant-design/icons-vue'
import { UploadFile, UploadProps } from 'ant-design-vue'
import {
  useUploadFileTask,
  UploadFileTask,
  createTaskId
} from '../hooks/upload-file-task'

/// 进一步封装上传任务


// defineProps<{ msg: string }>()
defineComponent({ UploadOutlined })

const fileList = ref<NonNullable<UploadProps['fileList']>>([])
const uploadTasks: Ref<UploadFileTask[]> = ref([])
// const file  = ref<UploadFile|undefined>(undefined);

const uploading = computed(() => {
  return uploadTasks.value.some((item) => item.uploading)
})

const handleRemove: UploadProps['onRemove'] = (file) => {
  const index = fileList.value.indexOf(file)
  const newFileList = fileList.value.slice()
  newFileList.splice(index, 1)
  fileList.value = newFileList
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  fileList.value = [...fileList.value, file]
  return false
}
const handleUpload = async () => {
  for (const item of fileList.value) {
    const file = item as unknown as File
    const taskId = createTaskId(file)

    const task = uploadTasks.value.find((item) => {
      return item.id === taskId
    })

    if (!task) {
      const newTask = useUploadFileTask(file, {
        taskComplete: (task, info) => {
          const index = uploadTasks.value.findIndex((item) => {
            return (item.id = task.id)
          })
          const newTaskList = uploadTasks.value
          newTaskList.splice(index, 1)
          uploadTasks.value = [...newTaskList]
        }
      })
      const newTaskList = uploadTasks.value.slice()
      uploadTasks.value = [...newTaskList, newTask]
      newTask.startUpload()
    }
  }
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
    <div v-for="item in uploadTasks" :key="item.id">
      <div>
        id:{{item.id}}
      </div>
      <span>计算时间：{{item.timeCost}}</span>
      <div>
        进度{{item.percent}}
      </div>
    </div>

  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
