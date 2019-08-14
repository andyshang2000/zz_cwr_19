/**
 * 涉及到的知识点
 * 1、没哈，原来有的难题这回都没有了
 * 2、获取页面元素要进行判断，不能让任务中止
 */
import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'

const log = console.log

interface CommentData {
  score: string
  commentDetail: string
  time: string
}

async function main (): Promise<void> {

  /*实例化浏览器对象*/
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 100000,
    ignoreHTTPSErrors: true
  })
  log(chalk.green('服务正常启动'))

  /*开始抓取数据*/
  try {
    /*实例化页面*/
    const page = await browser.newPage()
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
    await page.goto('http://hotels.ctrip.com/hotel/375265.html')
    log(chalk.yellow('页面初次加载完毕'))

    /*处理和解析数据*/
    const handleData = async (index) => {
      /*获取页面数据*/
      const list = await page.evaluate(() => {

        /*保存对象列表*/
        const commentDataList: CommentData[] = []

        /*获取页面元素*/
        let commentList = document.querySelectorAll('.comment_block.J_asyncCmt')
        for (let comment of commentList) {
          /*构造数据对象*/
          let commentData: CommentData = {
            score: undefined,
            commentDetail: undefined,
            time: undefined
          }

          /*得分*/
          let score = comment.querySelector('.score > .n')
          if (score) {
            commentData.score = score.innerHTML
          }

          /*评论内容*/
          let commentDetail = comment.querySelector('.J_commentDetail')
          if (commentDetail) {
            commentData.commentDetail = commentDetail.innerHTML
          }

          /*评论时间*/
          let time = comment.querySelector('.time')
          if (time) {
            commentData.time = time.innerHTML
          }
          commentDataList.push(commentData)
        }

        /*返回值，统一处理*/
        return commentDataList
      })

      /*接收到返回值，保存文件或者数据库*/
      const filePath = path.resolve(__dirname, 'D:\\Tmp\\ctrip\\' + index + '.txt')
      fileSystem.writeFile(filePath, JSON.stringify(list), {}, function (err) {
        if (err) {
          log(chalk.red('写入文件失败'))
        } else {
          log(chalk.yellow('写入文件成功'))
        }
      })
    }

    /*列表任务页面抓取*/
    for (let i = 1; i <= 50; i++) {
      await page.goto('http://hotels.ctrip.com/hotel/dianping/375265_p' + i + 't0.html')

      /*等待页面加载*/
      await page.waitFor(5000)
      console.clear()
      log(chalk.yellow('页面数据加载完毕'))
      await handleData(i)

      /*延缓下一次任务进行时间，防止被封禁*/
      await page.waitFor(5000)
    }

    /*任务结束，关闭浏览器对象*/
    await browser.close()
    log(chalk.green('服务正常结束'))
  } catch (error) {
    console.log(error)
    log(chalk.red('服务意外终止'))
  } finally {
    process.exit(0)
  }
}

/*调用方法*/
// noinspection JSIgnoredPromiseFromCall
main()
