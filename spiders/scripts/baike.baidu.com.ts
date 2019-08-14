/**
page.evalute()中传入一个函数(只做获取页面元素的逻辑并返回给外部函数处理数据)
*/
import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'

const log = console.log

//const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database("D:/Ezreal/1967988842-spider-master/spider/baike.db");
//var insert = db.prepare("INSERT OR REPLACE INTO baike VALUES(NULL,?,?)");
interface CatchData {
	urlSet: string[]
	key: string
	tags: string[]
}
interface OutData {
	key: string
	tags: string[]
}

var hrefArray: string[] = []
hrefArray.push("https://baike.baidu.com/")
async function main(): Promise<void> {

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
		var _self = this
		const page = await browser.newPage()
		await page.setViewport({
			width: 1366,
			height: 768
		})
		const goToHref = async (a) => {

			await page.goto(a)
			console.log("进入页面:" + a)
			/*任务结束，关闭浏览器对象*/
			let result = await page.evaluate(() => {
				let data: CatchData = {
					urlSet: [],
					key: undefined,
					tags: []
				};
				let key = document.getElementById("query") as HTMLInputElement;
				if (key)
					data.key = key.value;
				let ddTag = document.querySelector("#open-tag-item");
				if (ddTag) {
					let tags = ddTag.querySelectorAll(".taglist");
					for (let i = 0; i < tags.length; ++i) {
						data.tags.push(tags[i].innerHTML);
					}
				}
				let hrefList = document.querySelectorAll("a");
				for (let i = 0; i < hrefList.length; ++i) {
					let reg = new RegExp("^((https://baike.baidu.com/item)|/item)")
					if (reg.test(hrefList[i].href))
						data.urlSet.push(hrefList[i].href)
				}
				return data
			})

			let outData: OutData = {
				key: undefined,
				tags: undefined
			}
			outData.key = result.key;
			outData.tags = result.tags;
			if (outData.key) {
				const filePath = path.resolve(__dirname, '../data/baike.baidu.com/' + outData.key + '.json')
				fileSystem.writeFile(filePath, JSON.stringify(outData), {}, function (err) {
					if (err) {
						log(chalk.red('写入文件失败'))
					} else {
						log(chalk.yellow('写入文件成功'))
					}
				})
			}

			//console.log(JSON.stringify(outData));
			for (let url of result.urlSet) {
				if (hrefArray.indexOf(url) != -1)
					continue;
				hrefArray.push(url)
				await goToHref(url);
				await page.waitFor(2000)
			}


		}

		await goToHref('https://baike.baidu.com/')
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
