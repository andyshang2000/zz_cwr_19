/**
 * 涉及到的知识点：
 * 1、页面点击事件
 * 2、iframe页面抓取
 */
import * as puppeteer from 'puppeteer'
import chalk from 'chalk'
/*延时方法引入*/
import { timeout } from '../../utils/timeout'

/*log对象*/
const log = console.log

/*抓取音乐的歌词和评论*/
async function main (musicUrls: String[]): Promise<void> {
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
    await page.goto('https://music.163.com/')
    await page.waitFor(5000)
    log(chalk.yellow('页面初次加载完毕'))

    /*访问歌曲主页*/
    for (let musicUrl of musicUrls) {
      await page.goto(musicUrl)
      await page.waitFor(5000)

      /*获取iframe节点*/
      let iframe = await page.frames().find(frame => frame.name() === 'contentFrame')

      /*点击 展开按钮*/
      const unfoldButton = await iframe.$('#flag_ctrl')
      await unfoldButton.click()

      /*获取歌曲歌词*/
      const LYRIC_SELECTOR = await iframe.$('#lyric-content')
      const lyricContent = await iframe.evaluate(e => {
        return e.innerText
      }, LYRIC_SELECTOR)
      log(chalk.yellow('歌曲歌词：' + lyricContent))

      /*获取评论数*/
      const COMMENT_NUM_SELECTOR = await iframe.$('.j-flag')
      const commentNum = await iframe.evaluate(e => {
        return e.innerText
      }, COMMENT_NUM_SELECTOR)
      log(chalk.yellow('歌曲评论数：' + commentNum))


      /*获取评论总页数*/
      const commentPageNum = Math.ceil((commentNum - 15) / 20)

      /*循环获取评论列表*/
      for (let i = 1; i <= commentPageNum; i++) {

        /*获取评论列表*/
        const commentList = await iframe.$$eval('.itm', elements => {
          // noinspection UnnecessaryLocalVariableJS
          const ctn = elements.map(v => {
            return v.innerText.replace(/\s/g, '')
          })
          return ctn
        })
        log(chalk.yellow('获取到歌曲评论：' + commentList))

        /*点击 展开按钮*/
        const unfoldButton = await iframe.$('div.m-cmmt > div.j-flag > div > a.zbtn.znxt')
        await unfoldButton.click()

        /*必要的等待，防止IP被封禁*/
        await timeout(5000)
      }

      await page.waitFor(5000)
      /*必要的等待，防止IP被封禁*/
      await timeout(5000)
    }

  } catch (error) {
    console.log(error)
    log(chalk.red('服务意外终止'))
    await browser.close()
  } finally {
    process.exit(0)
  }
}

main(['https://music.163.com/#/song?id=478303470'])

