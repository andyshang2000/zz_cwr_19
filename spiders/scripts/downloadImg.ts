import * as fs from 'fs'
import * as path from 'path'
interface gamedata {
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

var gamesData: gamedata[] = [];
const filePath = path.resolve(__dirname, 'E:/desktop/Main/spiders/data/up.zdhm.xyz/all.json');
gamesData = readJson(filePath).data;

function getImg(index){
	if(index>=gamesData.length)return

	var arr=gamesData[index].img.split("/")
    var imgName=arr[arr.length-1];
	console.log(imgName)
	if(imgName.indexOf("png")!=-1||imgName.indexOf("jpg")!=-1||imgName.indexOf("jpeg")!=-1){
			var request=require("request");
		let writeStream = fs.createWriteStream("../data/xyz.games/"+imgName);
		let readStream = request(gamesData[index].img,(err,response)=>{
			if(err){
				console.log("错误信息:" + err)
				process.exit(1);
			}
		});
		readStream.pipe(writeStream);
		
		readStream.on('end', function () {
			console.log('文件下载成功');
			getImg(index+1);
		});
	}
	else {
		getImg(index+1);
	}
		


}

getImg(0)


//download("http://up.zdhm.xyz/images/2018102409434778511.png","../data/1.png")