/**
 * 涉及到的知识点：
 * 1、模拟登陆
 * 2、设置cookies
 * 3、截图和图像识别
 */
import * as puppeteer from 'puppeteer'
import chalk from 'chalk'

/*log对象*/
const log = console.log


async function main (): Promise<void> {
  /*实例化浏览器对象*/
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 100000,
    ignoreHTTPSErrors: true
  })
  log(chalk.green('服务正常启动'))


}


main()

