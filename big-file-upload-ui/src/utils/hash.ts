import SparkMD5 from 'spark-md5'
/**
 * @description: md encryption
 * @param {*
 * file: file object
 * chunkSize: unit size : default Read in chunks of 2MB
 * }
 * @return {*}
 */
const md5 = (file: Blob, chunkSize = 2097152) => {
  return new Promise<string>((resolve, reject) => {
    let blobSlice =
      File.prototype.slice ||
      File.prototype.mozSlice ||
      File.prototype.webkitSlice
    let chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    let spark = new SparkMD5.ArrayBuffer() // Append array buffer.
    let fileReader = new FileReader() // read file
    fileReader.onload = function (e) {
      spark.append(e.target.result)
      currentChunk++
      if (currentChunk < chunks) {
        loadNext()
      } else {
        let md5 = spark.end() // Complete the calculation of md5 and return the hexadecimal result.
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

// Use web-worker to calculate hash
const calculateHash = (file: File) => {
  console.log(file)
  return new Promise((resolve) => {
    // Add worker attribute
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
    // File size
    const size = file.size
    let offset = 2 * 1024 * 1024
    let chunks = [file.slice(0, offset)]
    // Front 100K
    let cur = offset
    while (cur < size) {
      // Add the last piece all in
      if (cur + offset >= size) {
        chunks.push(file.slice(cur, cur + offset))
      } else {
        // In the middle, remove two bytes from the front to the middle.
        const mid = cur + offset / 2
        const end = cur + offset
        chunks.push(file.slice(cur, cur + 2))
        chunks.push(file.slice(mid, mid + 2))
        chunks.push(file.slice(end - 2, end))
      }
      // Take the first two bytes
      cur += offset
    }
    // Splicing
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
