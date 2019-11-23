import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { download } from "./download_swf"

const log = console.log


interface LogData {
	swfURL: string
	index: number
}
//测试命令
//ts-node 4399download.ts
const [node, tsPath, outDir = "../data/4399.com/swf", swfpath = "../data/4399.com/4399.json", logName = "dl.log", ...args] = process.argv;

/读数据文件*/
function readJson(jsonFilePath: string) {
	if (fs.existsSync(jsonFilePath)) {
		let content = fs.readFileSync(jsonFilePath, 'utf-8');
		if (content)
			return JSON.parse(content);
		return null;
	}
	else {
		return null;
	}
}
var logPath=path.resolve(__dirname, outDir + "/" +logName);
var swf;
var swfArray = [];
var index = 0;
const jsonData = readJson(swfpath);
const gamesDatas = jsonData.data;

var logDatas: LogData[] = readJson(logPath);
if (logDatas) {
	index = logDatas.length;
	for (let i = 0; i < logDatas.length; ++i) {
		swfArray.push(logDatas[i].swfURL);
	}
}
else{
	logDatas=[];
}

fs.mkdir(outDir, function (err) {
	if (err) {
		console.log("目录已存在");
	}
	else {
		console.log("创建目录成功");
	}
})
var filePath;

async function main(): Promise<void> {
	try {
		for (let i=index; i < gamesDatas.length; ++i) {
			swf = gamesDatas[i].swfURL;
			let temp:LogData={
				swfURL: "",
				index: 0
			}
			if (swfArray.indexOf(swf) == -1){
				temp.swfURL=swf;
				temp.index=i;
				logDatas.push(temp);
				swfArray.push(swf);
				filePath = path.resolve(__dirname, outDir + "/" + i + ".swf");
			}
			else
			{
				--i;
				continue;
			}
			await download(swf, filePath);

			fs.writeFile(logPath, JSON.stringify(logDatas), {}, function (err) {
				if (err) {
					log(chalk.red('写入log失败'));
				} else {
					//log(chalk.green('写入log成功'));
				}
			});
		}
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
