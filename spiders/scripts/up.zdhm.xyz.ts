import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'
import { fstat } from 'fs-extra';

const log = console.log
//ts-node up.zdhm.xyz.ts xyz.json http://up.zdhm.xyz true
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

fileSystem.mkdir("../data/up.zdhm.xyz", function (err) {
	if (err) {
		console.log("目录已存在");
	}
	else {
		console.log("创建目录成功");
	}
})
const [node, tsPath, outfileName, startPage, headless = false, ...args] = process.argv;
const filePath = path.resolve(__dirname, '../data/up.zdhm.xyz/' + outfileName);
console.log(filePath);
var category = "";
var browser;
var ResultData: Result = { "data": [], "index": {} };
var gamedatas=[];
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
	gamedatas = ResultData.data;
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
		
		/*起始页面*/
		await page.goto(startPage, { timeout: 0 });
		await page.waitFor(3000);
		log(chalk.yellow('页面初次加载完毕'));
		const handleData = async () => {
			let data = await page.evaluate(() => {
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
					let detail=document.querySelector(".detail");
					gameData.title = detail.querySelector("img").title;
					gameData.img = detail.querySelector("img").src;
					gameData.cat=detail.querySelector(".tag").textContent.trim();
					let playedStr=detail.querySelector(".play").innerHTML.trim().split(" ")[1];
					playedStr=playedStr.replace(",","");
					gameData.played =parseInt(playedStr.replace("K+","000"));
					let tagItem=document.querySelectorAll(".tag-item");
					let tagArr=[];
					for(let i=0;i<tagItem.length;++i){
						tagArr.push(tagItem[i].textContent.trim());
					}
					gameData.tags=tagArr.join(",");
					gameData.desc=detail.querySelector(".desc").innerHTML.trim();
					gameData.date = new Date().toLocaleString();
				return gameData;
			});
			if (indexDatas.hasOwnProperty(data.title)){
				nextIndex--;
				return;
			}
			data.url=page.url();
			indexDatas[data.title]=nextIndex;
			gamedatas.push(data);
			/*整理数据写入文件*/
			ResultData.data = gamedatas;
			ResultData.index = indexDatas;
			fileSystem.writeFile(filePath, JSON.stringify(ResultData), {}, function (err) {
				if (err) {
					log(chalk.red('写入文件失败'));
				} else {
					log(chalk.yellow('写入文件成功'));
				}
			});
		};
		
		for(let i=nextIndex+1;i<=1592;++i,++nextIndex){
			let url="http://up.zdhm.xyz/detail?id="+i;
			let res = await page.goto(url,{timeout:0});
			if(res.status()!=200){
				nextIndex--;
				console.log(res.status());
				continue;
			}

			await page.waitFor(3000);
			await handleData();
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
