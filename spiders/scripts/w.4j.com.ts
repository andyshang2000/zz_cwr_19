import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'
import { fstat } from 'fs-extra';
import { url } from 'inspector';

const log = console.log
//ts-node w.4j.com.ts yy.json http://w.4j.com/html5games
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

fileSystem.mkdir("../data/w.4j.com", function (err) {
	if (err) {
		console.log("目录已存在");
	}
	else {
		console.log("创建目录成功");
	}
})
const [node, tsPath, outfileName, startPage, ...args] = process.argv;
const filePath = path.resolve(__dirname, '../data/w.4j.com/' + outfileName);
console.log(filePath);
var category = "";
var browser;
var ResultData: Result;
var gamesDatas = [];
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
		headless: false,
		timeout: 30000,
		//args:['--proxy-server=127.0.0.1:8080', '--ignore-certificate-errors'],
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
		/*起始页面*/
		await page.goto(startPage, { timeout: 0 });
		log(chalk.yellow('页面初次加载完毕'));
		while(true){
			let more =await page.$(".morebox>a");
			console.log(more);
			if(!more)
				break;
			await page.click(".morebox>a",{timeout:0});
			await timeout(5000);
			console.log("点了");
			//await page.waitForNavigation();
		}
		const handleData = async () => {
			let dataArray = await page.evaluate((idata) => {
				const gamesData: GameData[] = [];
				let games = document.querySelectorAll('.thumb');
				for (let i = 0; i < games.length; ++i) {
					let gameData: GameData = {
						title: undefined,
						img: undefined,
						url: undefined,
						desc: undefined,
						tags: undefined,
						cat: undefined,
						date: undefined,
						played: undefined,
						gametype: undefined
					};
					gameData.cat="";
					gameData.played=0;
					gameData.gametype="h5";
					let imgNode = games[i].querySelector(".thumbImg") as HTMLImageElement;
					gameData.img = imgNode.src;
					gameData.url="http://w.4j.com/"+imgNode.getAttribute("nameid")+"-game?pubid=yourlogo";
					gameData.title = games[i].querySelector(".gamename").innerHTML.trim();
					//过滤已经存在的title
					if (idata.hasOwnProperty(gameData.title))
						continue;
					gameData.date = new Date().toLocaleString();
					gamesData.push(gameData);
				}
				return gamesData;
			},indexDatas);
			for(let i=0;i<dataArray.length;++i,++nextIndex){
				await page.goto(dataArray[i].url, { timeout: 0 });
				console.log(dataArray[i].url);


				dataArray[i].url=await page.evaluate(()=>{
					return (document.querySelector("#gameurl") as HTMLInputElement).value;
				});

				dataArray[i].tags=await page.evaluate(()=>{
					let str = document.getElementById("pubidDiv").getElementsByTagName("input")[5].value.trim();
					return str.split(", ").join(",");
				});
				dataArray[i].desc=await page.evaluate(()=>{
					return (document.getElementById("pubidDiv").getElementsByTagName("textarea")[0].innerHTML.trim());
				});
				gamesDatas.push(dataArray[i]);
				indexDatas[dataArray[i].title] = nextIndex;
				/*整理数据写入文件*/
				ResultData.data = gamesDatas;
				ResultData.index = indexDatas;
				fileSystem.writeFile(filePath, JSON.stringify(ResultData), {}, function (err) {
					if (err) {
						log(chalk.red('写入文件失败'));
					} else {
						log(chalk.yellow('写入文件成功'));
					}
				});
			}
			
		}


		/*从起始页循环抓取数据*/

		await handleData();
		await page.waitFor(3000);

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
