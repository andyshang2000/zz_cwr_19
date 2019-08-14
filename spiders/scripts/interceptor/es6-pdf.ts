/**
 * 涉及到的知识点
 * 1、页面生成PDF
 */
import * as puppeteer from 'puppeteer'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'

/*log对象*/
const log = console.log

interface PdfData {
  name: string
  href: string
}

async function main (): Promise<void> {
  /*实例化浏览器对象*/
  const browser = await puppeteer.launch({
    timeout: 100000,
    ignoreHTTPSErrors: true
  })
  log(chalk.green('服务正常启动'))

  /*开始抓取数据*/
  try {
    /*实例化页面*/
    let page = await browser.newPage()
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

    /*起始页面*/
    await page.goto('http://es6.ruanyifeng.com/#README')
    await page.waitFor(5000)
    log(chalk.yellow('页面初次加载完毕'))

    /*获取文档列表*/
    const pdfList = await page.evaluate(() => {

      /*页面根Url*/
      const rootUrl = 'http://es6.ruanyifeng.com/'

      /*保存对象列表*/
      const pdfUrlList: PdfData[] = []

      /*分析左侧导航，获取所有PDF的链接*/
      let urlList = document.querySelectorAll('#sidebar > ol > li > a')
      for (let url of urlList) {
        let pdfUrlData: PdfData = {
          name: undefined,
          href: undefined
        }
        if (url) {
          pdfUrlData.name = url.innerHTML
          pdfUrlData.href = rootUrl + url.getAttribute('href').trim()
        }
        pdfUrlList.push(pdfUrlData)
      }

      /*返回所有PDF的链接的名称*/
      return pdfUrlList
    })

    /*打印页面生成PDF*/
    await page.pdf({ path: `./data/es6-pdf/${pdfList[0].name}.pdf` })
    page.close()

    for (let i = 1; i < pdfList.length; i++) {
      log(chalk.yellow('正在下载第：' + i + '\t个PDF文件'))
      page = await browser.newPage()
      await page.goto(pdfList[i].href)
      await page.waitFor(5000)
      await page.pdf({ path: `./data/es6-pdf/${pdfList[i].name}.pdf` })
      log(chalk.yellow(pdfList[i].href + '\tPDF保存成功'))
      page.close()
      await timeout(10000)
    }

    /*任务结束，关闭浏览器对象*/
    await browser.close()
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
