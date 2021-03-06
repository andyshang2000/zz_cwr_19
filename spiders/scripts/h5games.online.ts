import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'
import { fstat } from 'fs-extra';

const log = console.log
//ts-node h5games.online.ts all.json http://h5games.online/catalogue.php
interface GameData {
	title: string
	img: string
	url: string
	desc: string
	tags: string
	cat: string
	date: string
	played: number
	gametype: string
}
interface Result {
	data: GameData[]
	index: {}
}

fileSystem.mkdir("../data/h5games.online", function (err) {
	if (err) {
		console.log("目录已存在");
	}
	else {
		console.log("创建目录成功");
	}
})
const [node, tsPath, outfileName, startPage, headless = false, ...args] = process.argv;
const filePath = path.resolve(__dirname, '../data/h5games.online/' + outfileName);
console.log(filePath);
var category = "";
var browser;
var ResultData: Result = { "data": [], "index": {} };
var gamesDatas=[];
var indexDatas = {};
var nextIndex = 0;

/读数据文件*/
function readJson(jsonFilePath: string) {
	if (fileSystem.existsSync(jsonFilePath)) {
		let content = fileSystem.readFileSync(jsonFilePath, 'utf-8');
		if (content)
			return JSON.parse(content);
		return null;
	}
	else {
		return null;
	}
}
// /*初始化上次抓取进度*/
ResultData = readJson(filePath);
if (ResultData) {
	gamesDatas = ResultData.data;
	indexDatas = ResultData.index;
	nextIndex = Object.keys(indexDatas).length;
}
else
	ResultData = { "data": [], "index": {} };



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
		/*起始页面*/
		await page.goto(startPage, { timeout: 0 });
		await page.waitFor(3000);
		log(chalk.yellow('页面初次加载完毕'));

		let jsonUrl=await page.evaluate(()=>{
			return (document.querySelector("#json>a") as HTMLAnchorElement).href;
		})
		let res=await page.goto(jsonUrl, {timeout:0});
		let jsonArray=await res.json();
		for(;nextIndex<jsonArray.length;++nextIndex){
			let gameData: GameData = {
				title: undefined,
				img: undefined,
				url: undefined,
				desc: "",
				tags: "",
				cat: undefined,
				date: undefined,
				played: 0,
				gametype: "h5"
			};
			gameData.title=jsonArray[nextIndex].title;
			if(indexDatas.hasOwnProperty(jsonArray[nextIndex].title)){
				--nextIndex;
				continue;
			}
			gameData.img=jsonArray[nextIndex].thumb;
			gameData.url=jsonArray[nextIndex].link;
			gameData.desc=jsonArray[nextIndex].description;
			gameData.tags=jsonArray[nextIndex].tags;
			gameData.cat=jsonArray[nextIndex].category;
			gameData.date=new Date().toLocaleString();
			gamesDatas.push(gameData);
			indexDatas[gameData.title] = nextIndex;
			ResultData.data = gamesDatas;
			ResultData.index = indexDatas;
			//console.log(ResultData);
			fileSystem.writeFile(filePath, JSON.stringify(ResultData), {}, function (err) {
				if (err) {
					log(chalk.red('写入文件失败'));
				} else {
					log(chalk.yellow('写入文件成功'));
				}
			});
		}
		/*任务结束，关闭浏览器对象*/
		await browser.close();
		log(chalk.green('服务正常结束'));
	} catch (error) {
		console.log(error);
		log(chalk.red('服务意外终止'));
	} finally {
		//process.exit(0)
	}
}
/*程序入口*/
main()
