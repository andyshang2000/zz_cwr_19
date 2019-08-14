/**
 * 涉及到的知识点（注意身体！）
 * 1、双层循环
 * 2、下载图片
 */
import * as puppeteer from 'puppeteer'
import * as request from 'request'
import * as agent from 'socks5-http-client/lib/Agent'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
/*延时方法引入*/
// import { timeout } from '../utils/timeout'

/*log对象*/
const log = console.log

/*保存文件路径*/
const basePath = 'D:/home/mm/'

function mkdirsSync (dirname) {
  if (fileSystem.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fileSystem.mkdirSync(dirname)
      return true
    }
  }
}

async function main (startPage): Promise<void> {

  /*实例化浏览器对象*/
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 300000,
    ignoreHTTPSErrors: true,
    args: ['--proxy-server=socks5://127.0.0.1:1080']
  })
  log(chalk.green('服务正常启动'))

  /*开始抓取数据*/
  try {
    /*实例化页面*/
    const page = await browser.newPage()
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

    /*起始页面*/
    await page.goto('http://www.mmjpg.com/')
    log(chalk.yellow('页面初次加载完毕'))

    /*获取这一页所有的MM图片*/
    const handleMMData = async () => {
      // noinspection UnnecessaryLocalVariableJS
      const mmList = await page.evaluate(() => {

        /*保存对象列表*/
        const mmDataList: String[] = []

        /*获取页面图片元素*/
        let imageList = document.querySelectorAll('body > div.main > div.pic > ul > li > a')

        for (let image of imageList) {
          if (image) {
            mmDataList.push(image.getAttribute('href'))
          }
        }
        return mmDataList
      })
      return mmList
    }

    /*获取MM图片总数*/
    const getImageNum = async () => {
      const imageNum = await page.evaluate(() => {

        /*保存对象列表*/
        let imageNum: string = ''

        /*获取总页数*/
        let imageNumNode = document.querySelector('#page > a:nth-child(9)')
        if (imageNumNode) {
          imageNum = imageNumNode.innerHTML
        }
        return imageNum
      })
      return ~~imageNum
    }

    /*下载MM图片*/
    const downloadImage = async (referer) => {
      const imageUrl = await page.evaluate(() => {

        /*保存对象列表*/
        let imageUrl: string = ''

        /*获取总页数*/
        let image = document.querySelector('#content > a > img')
        if (image) {
          imageUrl = image.getAttribute('src')
        }
        return imageUrl
      })

      /*下载图片*/
      // http://fm.shiyunjj.com/2018/1552/1izn.jpg
      const newImageUr = imageUrl.replace('http://fm.shiyunjj.com/', '')
      const filePathList = newImageUr.split('/')
      if (filePathList.length === 3) {
        const filePath = path.resolve(__dirname, basePath + filePathList[0] + '/' + filePathList[1])
        if (mkdirsSync(filePath)) {
          request({
            url: imageUrl,
            agentClass: agent,
            agentOptions: {
              socksHost: '127.0.0.1',
              socksPort: 1080
            },
            headers: {
              'Referer': referer,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3573.0 Safari/537.36'
            }
          }).pipe(fileSystem.createWriteStream(path.resolve(__dirname, filePath + '/' + filePathList[2])))
        }
      }
    }

    /*循环处理，抓取任务*/
    for (let i = startPage; i <= 104; i++) {
      if (i === 1) {
        await page.goto('http://www.mmjpg.com/')
      } else {
        await page.goto('http://www.mmjpg.com/home/' + i)
      }
      await page.waitFor(5000)
      console.clear()
      log(chalk.yellow('页面数据加载完毕'))

      /*获取当前页的MM列表*/
      let mmUrlList = await handleMMData()
      log(chalk.yellow('获取当前页的MM列表'))
      for (let mmUrl of mmUrlList) {
        log(chalk.yellow('加载MM图片页：' + mmUrl))

        /* 获取该MM的照片数*/
        await page.goto(mmUrl)
        let mmUrlNum = await getImageNum()
        log(chalk.yellow('获取当前MM：' + mmUrl + '\t的图片数：' + mmUrlNum))
        for (let j = 1; j <= mmUrlNum; j++) {

          /*下载每一张图片*/
          log(chalk.yellow('下载MM的第' + j + '张图片：' + mmUrl + '/' + j))
          await page.goto(mmUrl + '/' + j)
          await downloadImage(mmUrl + '/' + j)

          /*必要的等待是为了保持善良*/
          /*加了代理之后访问速度比较慢，所以就不开延时了*/
          // await timeout(2000)
        }
      }
      await page.waitFor(5000)
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

// main(1)
// 14页剩下后4个
// main(15)
// 30页最后一个MM剩几张图片
// main(31)
// 32页剩下后4个
// 34页剩下后2个
// 40页剩下后4个
// 66页剩下后4个
main(67)
