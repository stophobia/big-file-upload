import { defineStore } from 'pinia'
import { computed, ref, Ref } from 'vue'
import {
  createTaskId,
  UploadFileTask,
  useUploadFileTask
} from '../hooks/upload-file-task'

export const useUploadFileStore = defineStore('counter', () => {
  const uploadTaskList: Ref<UploadFileTask[]> = ref([])

  // const uploading = computed(() => {
  //   return uploadTaskList.value.some((item) => item.uploading)
  // })

  // 获取上传任务，如果不存在创建任务
  function getUploadFileTaskCreateIfNeeded(file: File, autoStart = true) {
    const taskId = createTaskId(file)
    const task = uploadTaskList.value.find((item) => {
      return item.id === taskId
    })
    if (task) {
      return task
    }
    const newTask = useUploadFileTask(file, {
      taskComplete: (task, info) => {
        const index = uploadTaskList.value.findIndex((item) => {
          return (item.id = task.id)
        })
        const newTaskList = uploadTaskList.value
        newTaskList.splice(index, 1)
        uploadTaskList.value = [...newTaskList]
      }
    })
    const newTaskList = uploadTaskList.value.slice()
    uploadTaskList.value = [...newTaskList, newTask]
    if (autoStart) {
      newTask.startUpload()
    }

    return newTask
  }

  return { uploadTaskList, getUploadFileTaskCreateIfNeeded }
})
