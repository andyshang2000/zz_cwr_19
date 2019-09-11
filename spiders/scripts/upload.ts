import { Interface } from "readline";

var Client = require("ssh2-sftp-client")
var fs=require("fs");
var path=require("path"); 

interface uploadLog{
    gameName:string
    path:string
    date:string
}
//读数据文件
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
const[node,tsPath,localGameDir="C:/Users/姜安乐/Desktop/fsdownload/games",remote_gamePath="/home/jal/games",serverPath="/home/jal"]=process.argv;
// //本地游戏总目录
// var localGameDir="C:/Users/姜安乐/Desktop/fsdownload/games"
// //服务器存游戏文件的总目录
// var remote_gamePath = "/home/jal/games";
// //php后台服务器路径
// var serverPath="/home/jal";

//log文件路径
const logPath = path.resolve(__dirname, '../data/upload.log');
var record={"uploadLog":[],"index":{}};
var uploadlog:uploadLog[]=[];
var indexData={};
var nextIndex=0;

// 初始化上传进度
record = readJson(logPath);
if (record) {
	uploadlog = record.uploadLog;
	indexData = record.index;
	nextIndex = Object.keys(indexData).length;
}
else{
    record={"uploadLog":[],"index":{}};
}

const upload = async (sftp,localPath, remotePath) => {
    try {
        await sftp.put(localPath, remotePath);
        await console.log("文件"+localPath.substring(localPath.lastIndexOf("/")+1)+'上传完成');
    } catch (error) {
        console.log(error.message);
    }
}
//    C:/Users/姜安乐/Desktop/fsdownload/games
const uploadDir=async (sftp,path)=>{
    var files=await fs.readdirSync(path);
    for(let i=0;i<files.length;++i){
        //  C:/Users/姜安乐/Desktop/fsdownload/games/2048
        // path仅用于拼接出子集文件路径
        var childPath=path+"/"+files[i];
        var stats =await fs.statSync(childPath);
        //本地与远程目录结构一致
        // /2048
        var dirstruct=childPath.substring(localGameDir.length); 
        if(stats.isDirectory()){
            try {
                console.log(dirstruct);
                console.log("jin lai")
                 await sftp.mkdir(remote_gamePath+dirstruct,true); 
                console.log("目录创建完成")
            } catch (error) {
                console.log(error.message);
            }
            await uploadDir(sftp,childPath);
        }else{
            //var upPath=remote_gamePath+relativePath;
            console.log(childPath);
            console.log(localGameDir);
             //process.exit(0);
            await upload(sftp,childPath,remote_gamePath+dirstruct);
        }
    }
}

async function main():Promise<void>{
    let sftp = await new Client();
    await sftp.connect({
        host: '45.76.225.115',
        port: '22',
        username: 'jal',
        password: 'qiuweidao123'
    });

    let games = await fs.readdirSync(localGameDir);

    for(let i=0;i<games.length;++i,++nextIndex){
        var localGame=localGameDir+"/"+games[i]
        var stats=await fs.statSync(localGame);
        //过滤已上传的游戏
        if(indexData.hasOwnProperty(games[i])){
            nextIndex--;
            continue;
        }
        if(stats.isDirectory()){
            let log:uploadLog = {
                gameName:undefined,
                path:undefined,
                date:undefined
            };
            log.gameName=games[i];
            try {
                let gamePath=remote_gamePath+"/"+games[i];
                await sftp.mkdir(gamePath); 
                log.path=gamePath.substring(serverPath.length);
                await uploadDir(sftp,localGame);
                console.log(games[i]+"上传完毕!");

                log.date=(new Date()).toLocaleString();
                uploadlog.push(log);
                console.log(log);
                console.log(uploadlog)
                indexData[games[i]]=nextIndex;
                record["uploadLog"]=uploadlog;
                record["index"]=indexData;
                fs.writeFile(logPath,JSON.stringify(record),{},(err)=>{
                    if(err)
                        console.log("写入log失败!");
                    else
                        console.log("写入log成功!");
                })
            } catch (error) {
                console.log(error.message)
            }
        }
    }
    await sftp.end();
    console.log("上传完毕!");
    //await process.exit(0);
}

main();