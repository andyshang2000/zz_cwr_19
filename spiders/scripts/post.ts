import * as fs from 'fs'
import * as path from 'path'
import { timeout } from '../utils/timeout'


var http=require('https');
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

interface postdata {
    name: string
    imageurl: string
    gameurl: string
    width: number
    height: number
    type: string
    rating: number
    plays: number
	tags: string
    desc: string
    category_id: number
    localimg: string
    localgame: string
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
var catArray = ['Girls', 'Sports', 'Puzzle', 'Action', 'Arcade', 'Adventure', 'Strategy', 'Music', 'Beauty', 'Risk', 'Racing', 'Logic'];
var gamesData: gamedata[] = [];
const filePath = path.resolve(__dirname, 'E:/desktop/Main/spiders/data/up.zdhm.xyz/all.json');
gamesData = readJson(filePath).data;


var logData = {};
var nextIndex = 0;
const uploadLogPath = path.resolve(__dirname, '../data/up.zdhm.xyz/post.log');
if (readJson(uploadLogPath)) {
    logData = readJson(uploadLogPath);
    nextIndex = Object.keys(logData).length
}
var postArray:postdata[]=[]
for (let i = 0; i < gamesData.length; ++i) {
    let data: postdata = {
        name: gamesData[i].title,
        imageurl: gamesData[i].img,
        gameurl: gamesData[i].url,
        width: 800,
        height: 600,
        type: gamesData[i].gametype,
        rating: 1,
        plays: 1,
		tags:gamesData[i].tags,
        desc: gamesData[i].desc,
        category_id: 1,
        localimg: "",
        localgame: ""
    }
    if (gamesData[i].played) {
        data.plays = gamesData[i].played;
    }
	if(data.tags==""){
		data.tags=gamesData[i].cat.split(" ")[0];
	}
    if (gamesData[i].cat) {
        //data.category_id=gamesData[i].cat;
        let catarr = gamesData[i].cat.split(" ");
        data.category_id = catArray.indexOf(catarr[0]) + 2;
        // var catdata = {
        //     name: gamesData[i].cat,
        //     rating: 1
        // }
        // if (catArray.indexOf(gamesData[i].cat) == -1) {
        //     catArray.push(gamesData[i].cat);
        //     catdata.rating = catArray.indexOf(gamesData[i].cat) + 1
        //     data.category_id = catdata.rating
        //     request.post({
        //         url: "http://www.jzjo.com/admin/categories/create",
        //         method: 'POST',
        //         form: catdata
        //     }, function (error, response, body) {
        //         if (!error && response.statusCode == 200) {
        //             console.log("add cat 成功");
        //         }
        //     });
        // }

    }

    var arr = gamesData[i].img.split("/");
    if (logData.hasOwnProperty(gamesData[i].title)) {
        continue;
    }
	let arr1=gamesData[i].url.split("/");
	let tmp=arr1[arr1.length-2];
	
    data.localgame = "/games/" + tmp;
    data.localimg = "/gamesimages/" + arr[arr.length-1];

    postArray.push(data);

    
    // request.post({
    //     url: "https://www.jzjo.com/post.php",
    //     method: 'POST',
    //     form: data
    // }, function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         console.log("上传成功");
    //     }
    // });
    // logData[gamesData[i].title] = nextIndex;
    // fs.writeFile(uploadLogPath, JSON.stringify(logData), {}, (err) => {
    //     if (err)
    //         console.log("写入log失败!");
    //     else
    //         console.log("写入log成功!");
    // })

}




 function post(index){
	if(index>=postArray.length)return
    return new Promise((reslove,reject)=>{
	var request = require("request")
        request.post({
            url: "https://www.jzjo.com/post.php",
            method: 'POST',
            form: postArray[index]
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("上传成功");
            }else{
				console.log("上传失败:"+postArray[index].name);
			}
			post(index+1);
        });
    })
}


    // logData[gamesData[index].title] = nextIndex;
    // fs.writeFile(uploadLogPath, JSON.stringify(logData), {}, (err) => {
    //     if (err)
    //         console.log("写入log失败!");
    //     else
    //         console.log("写入log成功!");
    // })


post(0);
