const SparkMD5 =require('spark-md5')
/**
 * @description: md加密
 * }
 * @return {*}
 */
const md5 = (name, size, lastModified) => {
  const spark = new SparkMD5()
  spark.append(`name=${name}size=${size}lastModified=${lastModified}`)
  return spark.end()
}
module.exports = md5
