/**
 * 涉及到的知识点（注意身体！）
 * 1、代理（依赖SSR）
 * 2、拦截请求获取数据
 */
import * as puppeteer from 'puppeteer'
import chalk from 'chalk'
/*延时方法引入*/
import { timeout } from '../../utils/timeout'

/*log对象*/
const log = console.log

/*抓取头条新闻*/
async function main (): Promise<void> {
  /*实例化浏览器对象*/
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 100000,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--proxy-server=socks5://127.0.0.1:1080']
  })
  log(chalk.green('服务正常启动'))

  /*开始抓取数据*/
  try {
    /*实例化页面*/
    let page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setDefaultNavigationTimeout(300000)
    await page.setViewport({
      width: 1366,
      height: 768
    })
    page.on('console', msg => {
      if (typeof msg === 'object') {
        console.dir(msg)
      } else {
        log(chalk.blue(msg))
      }
    })

    page.on('request', request => {
      if (request.url().search('https://www.toutiao.com/api/pc/feed/?') >= 0) {
        log(chalk.yellow('拦截到指定URL：' + request.url()))
        page.on('response', response => {
          if (response.url().search('https://www.toutiao.com/api/pc/feed/?') >= 0) {
            response.text().then(function (result) {
              log('处理返回结果：' + result)
            })
          }
        })
        request.continue()
      } else {
        request.continue()
      }
    })

    /*起始页面*/
    await page.goto('https://www.toutiao.com/')
    await page.waitFor(5000)
    log(chalk.yellow('页面初次加载完毕'))

    const dataList = await page.$$('div.feed-infinite-wrapper > ul > li')
    let dataListNum = dataList.length

    let scrollToPageBar = async (dataListNum) => {
      /*判断list数量是否比上次多了*/
      let nowDataList = await page.$$('div.feed-infinite-wrapper > ul > li')
      let nowDataListNum = nowDataList.length
      while (nowDataListNum === dataListNum) {
        console.log(dataListNum)
        console.log(nowDataListNum)
        await timeout(5000)
        nowDataList = await page.$$('div.feed-infinite-wrapper > ul > li')
      }
      return nowDataListNum
    }

    for (let i = 0; i < 5; i++) {
      dataListNum = await scrollToPageBar(dataListNum)
    }

    /*任务结束，关闭浏览器对象*/
    await browser.close()
    log(chalk.green('服务正常结束'))
  } catch (error) {
    console.log(error)
    log(chalk.red('服务意外终止'))
    await browser.close()
  } finally {
    process.exit(0)
  }
}

// noinspection JSIgnoredPromiseFromCall
main()
