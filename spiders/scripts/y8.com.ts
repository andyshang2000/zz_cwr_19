import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { timeout } from '../utils/timeout'

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

const filePath = path.resolve(__dirname, '../data/y8.com/' + 'y8.json');
var pageCount = 0;
var category="";
var browser;
const [node, tsPath, startPage, ...args] = process.argv;
/读数据文件*/
function readJson(jsonFilePath: string) {
	if (fileSystem.existsSync(jsonFilePath)) {
		return JSON.parse(fileSystem.readFileSync(jsonFilePath, 'utf-8'));
	}
	else {
		return {};
	}
}
/*初始化上次抓取进度*/
const ResultData = readJson(filePath);
const gamesDatas = ResultData.data;
const indexDatas = ResultData.index;
var nextIndex = Object.keys(indexDatas).length;
var pageNumber = (nextIndex >> 6) + 1;
console.log("初始页码-----------" + pageNumber);

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
		pageCount=await page.evaluate(()=>{
			let lastHref=document.querySelector(".last.long").getAttribute("href").trim();
			return parseInt(lastHref.substring(lastHref.indexOf('=')+1));
		});
		category=await page.evaluate(()=>{
			return document.querySelector(".small-title.with-description").textContent.trim();
		})
		console.log("total pages:"+pageCount);
		console.log("game category:"+category);
		const handleData = async () => {
			let dataArray = await page.evaluate((idata) => {
				const gamesData: GameData[] = [];
				let gameNode = document.querySelectorAll('.item.thumb.videobox');
				for (let i = 0; i < gameNode.length; ++i) {
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
					let title = gameNode[i].querySelector(".title.ltr");
					gameData.title = title.innerHTML.trim();
					//过滤已经存在的title
					if (idata.hasOwnProperty(gameData.title))
						continue;
					gameData.tags = gameNode[i].getAttribute("data-label-ids").trim();

					let imgTag = gameNode[i].querySelector("img");
					gameData.img = imgTag.src;
					/*此处为进入当前game的url*/
					let aTag = gameNode[i].querySelector("a");
					gameData.url = aTag.href;

					gameData.date = new Date().toLocaleString();

					let playCounts = gameNode[i].querySelector(".plays-count");
					gameData.played = parseInt(playCounts.innerHTML.trim().substring(0, playCounts.innerHTML.trim().indexOf('次')).replace(/,/g, ''));

					let gameType = gameNode[i].querySelector(".technology>p");
					gameData.gametype = gameType.innerHTML.trim();

					gamesData.push(gameData);
				}
				return gamesData;
			}, indexDatas);
			for (let i = 0; i < dataArray.length; ++i, ++nextIndex) {
				/*跳转到对应game页面抓取数据*/
				await page.goto(dataArray[i].url, { timeout: 0 });
				console.log(dataArray[i].url);
				/*game描述信息*/
				dataArray[i].desc = await page.evaluate(() => {
					let d = document.querySelector(".ltr.description");
					if (d)
						return d.textContent.trim();
					else {
						console.log("---------------------");
						return "";
					}
				});
				/*根据gametype抓取url*/
				if (dataArray[i].gametype == "Flash Game") {
					dataArray[i].url = await page.evaluate(() => {
						return (document.querySelector("#gamefileEmbed") as HTMLEmbedElement).src;
					});
				}
				else if (dataArray[i].gametype == "HTML5 Game") {
					dataArray[i].url = await page.evaluate(() => {
						return (document.querySelector("#html5-content") as HTMLIFrameElement).src;
					});
				}
				else if (dataArray[i].gametype == "Unity WebGL Game") {
					dataArray[i].url = await page.evaluate(() => {
						return (document.querySelector("#html5-content") as HTMLIFrameElement).src;
					});
				}
				dataArray[i].cat=category;
				/*整理数据写入文件*/
				gamesDatas.push(dataArray[i]);
				indexDatas[dataArray[i].title] = nextIndex;
				ResultData["data"] = gamesDatas;
				ResultData["index"] = indexDatas;
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
		for (let i = pageNumber; i <= pageCount; ++i) {
			await page.goto(startPage+"?page=" + i, { timeout: 0 });
			console.log("进入第"+pageNumber+"页")
			await handleData();
			await page.waitFor(3000);
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
