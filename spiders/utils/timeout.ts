import chalk from 'chalk'

/*log对象*/
const log = console.log

function timeout (delay) {
  log(chalk.yellow('必要的Timeout'))
  // 1、不要影响目标网站正常访问
  // 2、不要用多线程
  // 3、减缓每一次访问页面的速度
  // 4、尽量使用代理IP
  // 5、免费代理比较差，如果有重要需求。推荐使用付费的代理
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(0)
      }
    }, delay)
  })
}

export { timeout }
