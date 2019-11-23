import * as puppeteer from 'puppeteer'
import * as fileSystem from 'fs'
import * as path from 'path'
import chalk from 'chalk'

//ts-node 4399.com.ts yz.json http://www.4399.com
const log = console.log
function endWith(str: string, target: string) {
    let start = str.length - target.length;
    let sub = str.substring(start);
    return sub == target;
}
//游戏数据记录游戏页面url和swf url
interface GameData {
    gameURl: string
    swfURL: string
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
const [node, tsPath, startPage = "http://www.4399.com", outfileName = "4399.json", logfileName="4399.log", headless = false, ...args] = process.argv;
const filePath = path.resolve(__dirname, '../data/4399.com/' + outfileName);
const logPath=path.resolve(__dirname,'../data/4399.com/' + logfileName);
console.log(filePath);
var pageCount = 0;
var category = "";
var browser;
var ResultData: Result;
var gamesDatas = [];
var indexDatas = {};
var nextIndex = 0;
var catURL="";
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
}
else
	ResultData = { "data": [], "index": {} };

const logData=readJson(logPath);
if(logData){
    catURL=logData.catURL;
    pageNumber=logData.pageNumber;
}

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
        const catArray = await page.evaluate(() => {
            let arr = [];
            let meun_div = document.querySelector(".menu_le");
            let catNodes = meun_div.querySelectorAll("a");
            for (let i = 0; i < catNodes.length; ++i) {
                let url = catNodes[i].href;
                if (url.substring(url.length-4)==".htm") {
                    arr.push(url);
                }
            }
            return arr;
        });

        let catIndex = catArray.indexOf(catURL);
        if(catIndex=-1)
            catIndex=0;
        const handleData = async () => {
            let dataArray = await page.evaluate(idata => {
                const gamesData: GameData[] = [];
                let gameDiv = document.querySelector('.list.affix.cf');
                let gameNodes = gameDiv.querySelectorAll("a");
                for (let i = 0; i < gameNodes.length; ++i) {
                    let gameData: GameData = {
                        gameURl: undefined,
                        swfURL: undefined
                    };
                    /*此处为进入当前game的url*/
                    gameData.gameURl = gameNodes[i].href;
                    //过滤已经存在的title
                    if (idata.hasOwnProperty(gameData.gameURl))
                        continue;
                    gamesData.push(gameData);
                }
                return gamesData;
            }, indexDatas);

            for (let i = 0; i < dataArray.length; ++i, ++nextIndex) {
                /*到对应game页面抓取数据*/
                console.log(dataArray[i].gameURl);
                await page.goto(dataArray[i].gameURl, { timeout: 0 });
                
                //有此div,则需点击开始游戏才能进入游戏界面
                let intr_box = await page.$(".intr.cf");
                if(intr_box)
                {
                    let start = await intr_box.$(".play>.btn");
                    //dataArray[i].gameURl = (start as HTMLAnchorElement).href;
                    await start.click();
                    await page.waitFor(1000);
                }
                let flashgame = await page.$("#flashgame");
                let flash22=await page.$("#flash22");
                log("-----------"+flashgame+"--------");
                
                if(flash22){
                    let temp = await page.evaluate((f22)=>{
                        return (f22 as HTMLIFrameElement).src;
                    },flash22);
                    if(endWith(temp,".swf")){
                        dataArray[i].swfURL=temp;
                    }
                    else{                       
                        await page.goto(temp,{timeout:0});
                        dataArray[i].swfURL=await page.evaluate(()=>{
                            let embed = document.querySelector("object>embed");
                            return (embed as HTMLEmbedElement).src;
                        });
                    }
                }
                else if (flashgame) {
                    /*根据gametype抓取url*/
                    dataArray[i].swfURL = await page.evaluate((fgame) => {
                        let embed = fgame.querySelector("embed");
                        if (embed)
                            return embed.src;
                        return "";
                    }, flashgame);
                }
                else {
                    dataArray.splice(i, 1);
                    log("不是flash游戏!")
                    i--;
                    nextIndex--;
                    continue;
                }
                /*整理数据写入文件*/
                gamesDatas.push(dataArray[i]);
                indexDatas[dataArray[i].gameURl] = nextIndex;
                ResultData.data = gamesDatas;
                ResultData.index = indexDatas;
                //console.log(ResultData);
                
                fileSystem.writeFile(filePath, JSON.stringify(ResultData), {}, function (err) {
                    if (err) {
                        log(chalk.red('写入文件失败'));
                    } else {
                        log(chalk.green('写入文件成功'));
                    }
                });
            }
            
        };
        /*从起始页循环抓取数据*/
        for (;catIndex < catArray.length; ++catIndex) {
            //当前category的首页
            catURL = catArray[catIndex];
            await page.goto(catURL, { timeout: 0 });
            //从首页获取总页码
            let maxPage = await page.evaluate(() => {
                let page_div = document.getElementsByClassName("pag")[1];
                let pageTags = page_div.getElementsByTagName("a");
                return parseInt(pageTags[pageTags.length - 2].innerHTML.trim());
            });
            pageCount = maxPage;
            console.log("total pages:" + pageCount);

            for (; pageNumber <= pageCount;) {
                //http://www.4399.com/flash_fl/5_1.htm
                //http://www.4399.com/flash_fl/more_5_2.htm
                let str = await catURL.substring(0, catURL.lastIndexOf("_") + 1);
                let index = str.lastIndexOf("/") + 1;
                let res;
                if (pageNumber == 1)
                    res = await page.goto(str + pageNumber + ".htm");
                else
                    res = await page.goto(str.slice(0, index) + "more_" + str.slice(index) + pageNumber + ".htm");
                console.log("进入第" + pageNumber + "页")
                if (res.status() > 400)
                    continue;
                await page.waitFor(3000);
                await handleData();
                //此时前一页的数据已经全部获取,log记录应为pageNumber+1
                ++pageNumber;
                fileSystem.writeFile(logPath, JSON.stringify({"catURL":catURL,"pageNumber":pageNumber}), {}, function (err) {
                    if (err) {
                        log(chalk.red('写入log失败'));
                    } else {
                        log(chalk.yellow('写入log成功'));
                    }
                });
            }
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
