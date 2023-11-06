const md5 = require('../utils/hash')
const path = require('path')
const router = require('koa-router')()
const { uploadFile } = require('../utils/upload')
const fs = require('fs')
router.prefix('/file')

router.get('/upload/test', function (ctx, next) {
  ctx.body = 'this is a file/upload/test response!'
})

/// detection file
router.post('/upload/check', async function (ctx, next) {
  let postData = ctx.request.body
  console.log('/upload/check postData' + JSON.stringify(postData))
  try {
    const uploadId = md5(postData.name, postData.size, postData.lastModified)
    const fileSavePath = filePath(uploadId)
    const finish = fs.existsSync(fileSavePath)
    const data = []
    if (!finish) {
      let serverFilePartsPath = filePartsPath(uploadId)
      console.log({ serverFilePartsPath })
      if (fs.existsSync(serverFilePartsPath)) {
        const files = await getFileListWithPath(serverFilePartsPath)
        files.forEach((file) => {
          const index = parseInt(file.split('.part')[1])
          data.push({ index })
        })
      }
    }
    ctx.body = {
      uploadId: uploadId,
      partCount: 0,
      data: data,
      finish: finish
    }
  } catch (error) {
    ctx.body = error
  }
})

/// File Upload
router.post('/upload/:uploadId/part', async function (ctx, next) {
  let postData = ctx.request.body
  console.log('/merge postData' + JSON.stringify(postData))
  console.log('/merge request' + JSON.stringify(ctx))

  // Upload file request processing
  let result = { success: false }
  let serverFilePath = path.join(__dirname, '../../server', 'upload-files')
  console.log({ serverFilePath })
  // let postData = ctx.request.body
  // Upload file event
  result = await uploadFile(ctx, {
    fileType: path.join('update-file-parts'),
    path: serverFilePath
  })

  ctx.body = result
})

/// File merge
router.post('/merge', async function (ctx, next) {
  let postData = ctx.request.body
  console.log('/merge postData' + JSON.stringify(postData))
  const uploadId = postData.uploadId
  let serverFilePartsPath = filePartsPath(uploadId)

  console.log({ serverFilePartsPath })
  if (fs.existsSync(serverFilePartsPath)) {
    // ctx.body = 'this is a file/merge response ' + uploadId
    try {
      const files = await getFileListWithPath(serverFilePartsPath)
      files.sort(function (a, b) {
        const index1 = parseInt(a.split('.part')[1])
        const index2 = parseInt(b.split('.part')[1])
        return index1 - index2
      })
      console.log(JSON.stringify(files))
      const saveDir = saveDirPath()
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir)
      }
      // Merge file blocks
      const savePath = filePath(uploadId)
      files.forEach((file) => {
        const content = fs.readFileSync(path.join(serverFilePartsPath, file))
        fs.appendFileSync(savePath, content)
      })
      // Delete file blocks
      fs.rm(
        serverFilePartsPath,
        {
          recursive: true
        },
        () => {}
      )
      ctx.body = JSON.stringify(files)
    } catch (error) {
      console.log(error)
    }

    return
  } else {
    ctx.body = 'error this is a file/merge response ' + uploadId
  }
})

const saveDirPath = () => {
  return path.join(__dirname, '../../server', 'upload-files', 'files')
}

const filePath = (uploadId) => {
  return path.join(saveDirPath(), uploadId + '.zip')
}

const filePartsPath = (uploadId) => {
  return path.join(
    __dirname,
    '../../server',
    'upload-files',
    'update-file-parts',
    uploadId
  )
}

const getFileListWithPath = async (path) => {
  const files = await new Promise((res, rej) => {
    fs.readdir(path, (error, files) => {
      if (error) {
        rej(error)
      } else {
        res(files)
      }
    })
  })
  return files
}

module.exports = router
