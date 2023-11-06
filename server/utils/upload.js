const inspect = require('util').inspect
const path = require('path')
const os = require('os')
const fs = require('fs')
const Busboy = require('busboy')

/**
 * Synchronously create file directories
 * @param  {string} dirname Directory absolute address
 * @return {boolean}        Create catalog results
 */
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

/**
 * Get the suffix of the uploaded file
 * @param  {string} fileName Get the suffix of the uploaded file
 * @return {string}          File extension
 */
function getSuffixName(fileName) {
  let nameList = fileName.split('.')
  return nameList[nameList.length - 1]
}

/**
 * upload files
 * @param  {object} ctx     koa upper and lower sentence
 * @param  {object} options File upload parameters fileType file type, path file storage path
 * @return {promise}
 */
function uploadFile(ctx, options) {
  let req = ctx.req
  let res = ctx.res
  let busboy = Busboy({ headers: req.headers })

  // Get type
  let fileType = options.fileType || 'common'
  let filePath = path.join(options.path, fileType)

  return new Promise((resolve, reject) => {
    console.log('File uploading...')
    let result = {
      success: false,
      formData: {}
    }

    // Parse request file event
    busboy.on('file', function (fieldname, file, fileInfo) {
      console.log({ fileInfo, fieldname })
      let fileName = fileInfo.filename.split('.')[0]
      const list = fileName.split('-')
      fileName = list[1] + '.' + getSuffixName(fileInfo.filename)
      // let fileName =
      //   Math.random().toString(16).substring(2) +
      //   '.' +
      //   getSuffixName(fileInfo.filename)
      filePath = path.join(filePath, list[0]);
      let mkdirResult = mkdirsSync(filePath)
      let _uploadFilePath = path.join(filePath, fileName)
      let saveTo = path.join(_uploadFilePath)

      // Save the file to the specified path
      file.pipe(fs.createWriteStream(saveTo))

      // File write event ends
      file.on('end', function () {
        result.success = true
        result.message = 'File uploaded successfully'
        console.log('File uploaded successfully!')
        resolve(result)
      })
    })

    // Parse other field information in the form
    busboy.on('field', function (fieldname, val, info) {
      console.log(
        'form field data [' +
          fieldname +
          ']: value: ' +
          val +
          'info' +
          JSON.stringify(info)
      )
      result.formData[fieldname] = inspect(val)
    })

    // parse end event
    busboy.on('finish', function () {
      console.log('end on file')
      resolve(result)
    })

    // Parse error events
    busboy.on('error', function (err) {
      console.log('Error on file')
      reject(result)
    })

    req.pipe(busboy)
  })
}

module.exports = {
  uploadFile
}
