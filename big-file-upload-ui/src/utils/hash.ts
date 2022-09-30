import SparkMD5 from 'spark-md5'
/**
 * @description: md加密
 * @param {*
 * file:文件对象
 * chunkSize:单位大小   default Read in chunks of 2MB
 * }
 * @return {*}
 */
const md5 = (file: Blob, chunkSize = 2097152) => {
  return new Promise((resolve, reject) => {
    let blobSlice =
      File.prototype.slice ||
      File.prototype.mozSlice ||
      File.prototype.webkitSlice
    let chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    let spark = new SparkMD5.ArrayBuffer() //追加数组缓冲区。
    let fileReader = new FileReader() //读取文件
    fileReader.onload = function (e) {
      spark.append(e.target.result)
      currentChunk++
      if (currentChunk < chunks) {
        loadNext()
      } else {
        let md5 = spark.end() //完成md5的计算，返回十六进制结果。
        resolve(md5)
        // console.log(md5);
      }
    }

    fileReader.onerror = function (e) {
      reject(e)
    }

    function loadNext() {
      let start = currentChunk * chunkSize
      let end = start + chunkSize
      if (end > file.size) {
        end = file.size
      }
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }
    loadNext()
  })
}
export default md5

// 使用 web-worker 计算 hash
const calculateHash = (file: File) => {
  console.log(file)
  return new Promise((resolve) => {
    // 添加 worker 属性
    // this.worker = new Worker('/hash.js');
    // this.worker.postMessage({ fileChunkList });
    // this.worker.onmessage = (e) => {
    //   const { percentage, hash } = e.data;
    //   this.hashPercentage = percentage;
    //   if (hash) {
    //     resolve(hash);
    //   }
    // };
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    // 文件大小
    const size = file.size
    let offset = 2 * 1024 * 1024
    let chunks = [file.slice(0, offset)]
    // 前面100K
    let cur = offset
    while (cur < size) {
      // 最后一块全部加进来
      if (cur + offset >= size) {
        chunks.push(file.slice(cur, cur + offset))
      } else {
        // 中间的 前中后去两个字节
        const mid = cur + offset / 2
        const end = cur + offset
        chunks.push(file.slice(cur, cur + 2))
        chunks.push(file.slice(mid, mid + 2))
        chunks.push(file.slice(end - 2, end))
      }
      // 前取两个字节
      cur += offset
    }
    // 拼接
    reader.readAsArrayBuffer(new Blob(chunks))
    reader.onload = (e) => {
      spark.append(e.target.result)
      resolve(spark.end())
    }
  })
}

const calculateFileHash = (file: File) => {
  console.log(file)
  const spark = new SparkMD5()
  spark.append(
    `name=${file.name}size=${file.size}lastModified=${file.lastModified}`
  )
  return spark.end()
}

export { calculateHash, calculateFileHash }
