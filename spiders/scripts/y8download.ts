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
//ts-node y8download.ts prettygirl.swf https://zh.y8.com/games/mermaid_pretty_girl 
const [node, tsPath, outfileName, startPage, outDir = "../data/y8.com/swf", headless = true, ...args] = process.argv;

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

		swfurl = await page.evaluate(() => {
			let embed = document.querySelector("#gamefileEmbed");
			if (embed)
				return (embed as HTMLEmbedElement).src;
			else
				return "";
		});

		if(swfurl)
			await download(swfurl, filePath);
		else 
			throw new Error("非法的url");
		log(chalk.green('swf address:' + swfurl));
		await browser.close();
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
