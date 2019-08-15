import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import { timeout } from '../utils/timeout'


const log = console.log
var browser;
const [node, tsPath, startPage, ...args] = process.argv

console.log("page=" + startPage);

async function main (): Promise<void> {
	browser = await puppeteer.launch({
		headless: false,
		timeout: 100000,
		args:['--proxy-server=127.0.0.1:8080', '--ignore-certificate-errors'],
		ignoreHTTPSErrors: true
	})
	try {
		const page = await browser.newPage()
		await page.setViewport({
			width: 1366,
			height: 768
		})
		log('加载：' + startPage)
		await page.goto(startPage)

		await page.evaluate(() => {})
		log('等待')
		await timeout(60*1000*2);
				
	} catch (error) {
		console.log(error)
		log('服务意外终止')
	} finally {
		process.exit(0)
	}
}

main()