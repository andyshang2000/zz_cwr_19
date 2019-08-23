import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'
import { fstat } from 'fs-extra';
//ts-node 4399.com.ts yz.json http://www.4399.com/flash_fl/5_1.htm
const log = console.log

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

fileSystem.mkdir("../data/4399.com", function (err) {
	if (err) {
		console.log(err);
	}
	else {
		console.log("创建目录成功");
	}
})
const [node, tsPath, outfileName, startPage, ...args] = process.argv;
const filePath = path.resolve(__dirname, '../data/4399.com/' + outfileName);
console.log(filePath);
var pageCount = 0;
var category = "";
var browser;
var ResultData: Result;
var gamesDatas = [];
var indexDatas = {};
var nextIndex = 0;
var pageNumber = 1;

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
	pageNumber = Math.floor(nextIndex / 99) + 1;
	console.log("初始页码-----------" + pageNumber);
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
		const page = await browser.newPage()
		await page.setViewport({
			width: 1366,
			height: 768
		})
		/*起始页面*/
		await page.goto(startPage, { timeout: 0 });
		log(chalk.yellow('页面初次加载完毕'));

		// const divsCounts = await page.$$eval('div', divs => divs.length);
		// console.log(divsCounts+"----------------------");
		// let imgs=await page.evaluate(()=>{
		// 	let arr=[];
		// 	//let gameDiv = document.querySelector('.list.affix.cf');
		// 	let gameNodes = document.querySelectorAll("img");
		// 	for(let i=0;i<gameNodes.length;++i){
		// 		//let gg = gameNodes[i].querySelector("img");
		// 		arr.push(gameNodes[i].src);
		// 	}
		// 	return arr;
		// })
		// console.log(imgs);

		pageCount = await page.evaluate(() => {
			let page_div = document.getElementsByClassName("pag")[1];
			let pageTags = page_div.getElementsByTagName("a");
			return parseInt(pageTags[pageTags.length - 2].innerHTML.trim());
		});
		category = await page.evaluate(() => {
			let cat_div = document.querySelector(".nav.m10");
			return cat_div.querySelector(".on").innerHTML.trim();
		});
		console.log("total pages:" + pageCount);
		console.log("game category:" + category);
		const handleData = async () => {
			let dataArray = await page.evaluate(idata => {
				const gamesData: GameData[] = [];
				let gameDiv = document.querySelector('.list.affix.cf');
				let gameNodes = gameDiv.querySelectorAll("a");
				for (let i = 0; i < gameNodes.length; ++i) {
					let gameData: GameData = {
						title: undefined,
						img: undefined,
						url: undefined,
						desc: "",
						tags: undefined,
						cat: undefined,
						date: undefined,
						played: undefined,
						gametype: "flash"
					};
					/*此处为进入当前game的url*/
					gameData.url = gameNodes[i].href;
					let imgTag = gameNodes[i].querySelector("img");
					gameData.title = imgTag.alt;
					gameData.img = imgTag.src;
					//过滤已经存在的title
					if (idata.hasOwnProperty(gameData.title))
						continue;
					gameData.date = new Date().toLocaleString();
					gamesData.push(gameData);
				}
				return gamesData;
			}, indexDatas);
			for (let i = 0; i < dataArray.length; ++i, ++nextIndex) {
				/*跳转到对应game页面抓取数据*/
				console.log(dataArray[i].img);
				console.log(dataArray[i].url);
				await page.goto(dataArray[i].url, { timeout: 0 });
				await page.waitFor(2000);
				let intr_box = await page.$(".intr.cf");
				if (intr_box) {

					dataArray[i].tags = await page.evaluate(() => {
						let a_tags = document.querySelectorAll(".spe>a");
						let tagArr = [];
						for (let j = 0; j < a_tags.length; ++j) {
							console.log(a_tags[i]);
							if (a_tags[j].textContent.trim() == "H5游戏")
								dataArray[j].gametype = "h5";
							tagArr.push(a_tags[j].textContent.trim());
						}
						return tagArr.join(" ");
					});
					dataArray[i].desc = await page.evaluate(() => {
						let intro = document.querySelector("#introduce");
						if (intro)
							return document.querySelector("#introduce>font").textContent.trim();
						return "";
					});

					let start = await intr_box.$(".play>.btn");
					await start.click();
					await page.waitFor(1000);
					if (dataArray[i].gametype == "h5") {
						dataArray[i].url = await page.evaluate(() => {
							return (document.querySelector("#flash22") as HTMLIFrameElement).src;
						});
					}
					else if (dataArray[i].gametype == "flash") {
						dataArray[i].url = await page.evaluate(() => {
							let embed = document.querySelector("#flashgame1");
							if (embed)
								return (embed as HTMLEmbedElement).src;
							else
								return (document.querySelector("#flash22") as HTMLIFrameElement).src;
						});
					}
				}
				else {
					dataArray[i].desc = await page.evaluate(() => {
						let instruction = document.querySelector(".game_cz");
						if (instruction) {
							let desc_p = instruction.getElementsByClassName("n_box")[0].getElementsByTagName("p")[2];
							if (!desc_p.textContent)
								desc_p = instruction.getElementsByClassName("n_box")[0].getElementsByTagName("p")[4];
							return desc_p.textContent.trim();
						}
					});
					/*根据gametype抓取url*/
					dataArray[i].url = await page.evaluate(() => {
						let embed = document.querySelector("#flash22");
						if (embed)
							return (embed as HTMLEmbedElement).src;
						else
							return (document.querySelector("#flashgame1") as HTMLIFrameElement).src;
					});
					dataArray[i].tags = await page.evaluate(() => {
						let tags_div = document.querySelector(".game_fl");
						if (tags_div) {
							let a_tags = tags_div.querySelectorAll("a");
							let tagArr = [];
							for (let j = 2; j < a_tags.length; ++j) {
								tagArr.push(a_tags[j].textContent.trim());
							}
							return tagArr.join(" ");
						}
					});
				}
				dataArray[i].cat = category;
				/*整理数据写入文件*/
				gamesDatas.push(dataArray[i]);
				indexDatas[dataArray[i].title] = nextIndex;
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
		};
		/*从起始页循环抓取数据*/
		for (; pageNumber <= pageCount; ++pageNumber) {
			//http://www.4399.com/flash_fl/5_1.htm
			//http://www.4399.com/flash_fl/more_5_2.htm
			let str = await startPage.substring(0, startPage.lastIndexOf("_") + 1);
			let index=str.lastIndexOf("/")+1;
			if(pageNumber==1)
				await page.goto(str + pageNumber + ".htm");
			else
				await page.goto(str.slice(0,index) +"more_"+str.slice(index)+pageNumber + ".htm");
			console.log("进入第" + pageNumber + "页")
			let flag = await page.$(".bg-c");
			if (flag)
				break;
			await page.waitFor(5000);
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
