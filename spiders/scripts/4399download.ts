import * as puppeteer from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { download } from "./download_swf"

const log = console.log
function endWith(str: string, target: string) {
	let start = str.length - target.length;
	let sub = str.substring(start);
	return sub == target;
}
//测试命令
//ts-node 4399download.ts 火柴人.swf http://www.4399.com/flash/207016.htm
const [node, tsPath, outfileName, startPage, outDir = "../data/4399.com/swf", headless = true, ...args] = process.argv;

fs.mkdir(outDir, function (err) {
	if (err) {
		console.log("目录已存在");
	}
	else {
		console.log("创建目录成功");
	}
})
const filePath = path.resolve(__dirname, outDir + "/" + outfileName);

var browser;
var swfurl;

async function main(): Promise<void> {
	/*实例化浏览器对象*/
	browser = await puppeteer.launch({
		headless: headless,
		timeout: 30000,
		//args:['--proxy-server=127.0.0.1:8080', '--ignore-certificate-errors'],
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
		await page.on('dialog', async dialog => {
			await page.waitFor(2000);
			await dialog.dismiss();
		});
		await page.goto(startPage, { timeout: 0 });
		await page.waitFor(2000);
		let intr_box = await page.$(".intr.cf");
		let swfdiv = await page.$("#swfdiv");
		if (intr_box) {
			let start = await intr_box.$(".play>.btn");
			await start.click();
			await page.waitFor(1000);
			swfurl = await page.evaluate(() => {
				let embed = document.querySelector("#flashgame1");
				if (embed)
					return (embed as HTMLEmbedElement).src;
				else
					return (document.querySelector("#flash22") as HTMLIFrameElement).src;
			});
		} else if (swfdiv) {
			swfurl = await page.evaluate(() => {
				let embed = document.querySelector("#flashgame1");
				if (embed)
					return (embed as HTMLEmbedElement).src;
				else
					return (document.querySelector("#flash22") as HTMLIFrameElement).src;
			});
		} else {
			throw new Error("非法的url");
		}
		if (endWith(swfurl, ".htm")) {
			await page.goto(swfurl);
			swfurl = await page.evaluate(() => {
				return (document.querySelector("object>embed") as HTMLEmbedElement).src;
			});
		}
		await browser.close();
		await download(swfurl, filePath);
	} catch (error) {
		console.log(error);
		log(chalk.red('服务意外终止'));
		process.exit(1);
	} finally {
		//process.exit(0)
	}
}
/*程序入口*/
main()
