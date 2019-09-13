import * as fs from 'fs'
import * as path from 'path'
import {timeout} from '../utils/timeout'

var request =require("request")

interface uploadLog {
    gameName: string
    path: string
    date: string
}

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

interface postdata{
    name: string
    imageurl: string
    gameurl: string
    width:number
    height:number
    type: string
    rating:number
    plays:number,
    desc:string
    category_id:string
    localimg:string
    localgame:string
    };


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
var gamesData:gamedata[]=[];
const filePath = path.resolve(__dirname, 'E:/desktop/Main/spiders/data/up.zdhm.xyz/all.json');
gamesData=readJson(filePath).data;

var logData:uploadLog[]=[];
const uploadLogPath=path.resolve(__dirname,'../data/upload.log');
logData = readJson(uploadLogPath).uploadLog;
var json={};
for(let i=0;i<logData.length;++i){
     let title=logData[i].gameName;
    if(title.indexOf("-")!=-1){
        let arr = title.split("-");
        for(let j=0;j<arr.length;++j){
            arr[j]=arr[j].charAt(0).toUpperCase()+arr[j].slice(1);
        }
        json[arr.join(" ")]=logData[i].path;
    }
    else if(title.indexOf("_")!=-1){
        let arr = title.split("_");
        for(let j=0;j<arr.length;++j){
            arr[j]=arr[j].charAt(0).toUpperCase()+arr[j].slice(1);
        }
        json[arr.join(" ")]=logData[i].path;
    }else{
        json[title.toUpperCase()]=logData[i].path;
    }
}

for(let i=0;i<gamesData.length;++i){
    let data:postdata={
        name:gamesData[i].title,
        imageurl:gamesData[i].img,
        gameurl:gamesData[i].url,
        width: 800,
        height: 600,
        type:gamesData[i].gametype,
        rating:1,
        plays:1,
        desc:gamesData[i].desc,
        category_id:'1',
        localimg:"",
        localgame:""
    }
    if(gamesData[i].played){
        data.plays=gamesData[i].played;
    }
    if(gamesData[i].cat){
        data.category_id=gamesData[i].cat;
    }
    if(!json[gamesData[i].title])
        continue;
    var arr=gamesData[i].title.split(" ");
    for(let j=0;j<arr.length;++j){
        arr[j]=arr[j].charAt(0).toLowerCase()+arr[j].slice(1);
    }
    data.localgame=json[gamesData[i].title];
    data.localimg="/gamesimages/"+arr.join("-");

    request.post({
        url:"https://www.jzjo.com/post.php",
        form:data
    },function(error,response,body){
        if(!error&&response.statusCode == 200){
            console.log("上传成功");
        }
    });
    timeout(500);
}


