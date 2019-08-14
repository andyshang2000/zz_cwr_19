/**
* 涉及到的知识点
* 1、没哈，原来有的难题这回都没有了
* 2、获取页面元素要进行判断，不能让任务中止
*/
import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'

const log = console.log

interface CommentData {
score: string
commentDetail: string
time: string
}

var browser;

async function fetchgame (url): Promise<void> {
	const page = await browser.newPage()
	try {
		await page.goto(url);
		console.log(url)
		
		const list = await page.evaluate(() => {
			//unity
			let iframe = document.querySelector("#html5-content")
			if(iframe == null){
				let itemRoot = document.querySelector(".item-root")
			}
		})
	} catch (error) {
		console.log(error)
		log(chalk.red('服务意外终止'))
	} finally {
		page.close();
	}
}

async function main (): Promise<void> {
	/*实例化浏览器对象*/
	browser = await puppeteer.launch({
		headless: false,
		timeout: 100000,
		args:['--proxy-server=127.0.0.1:8080', '--ignore-certificate-errors'],
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
		await page.goto('https://zh.y8.com/categories/girls?page=100')
		log(chalk.yellow('页面初次加载完毕'))

		let aTags = await page.evaluate(() => {
			let as = [...document.querySelectorAll('.thumbarea>a')];
			console.log('....... .......  ======= .......')
			console.log(as.length)
			return as.map((a) =>{
				console.log('....... .......  ======= .......')
				console.log(a)
				return {
					href: a['href'].trim(),
					name: a['text']
				}
			});
		});
		for (var i = 1; i < aTags.length; i++) {
			var a = aTags[i];
			await fetchgame(a.href);
			await timeout(2000);
		}

		/*任务结束，关闭浏览器对象*/
		await browser.close()
		log(chalk.green('服务正常结束'))
	} catch (error) {
		console.log(error)
		log(chalk.red('服务意外终止'))
	} finally {
		//process.exit(0)
	}
}

/*调用方法*/
// noinspection JSIgnoredPromiseFromCall
main()
