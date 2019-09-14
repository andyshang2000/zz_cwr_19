import * as fs from 'fs'
import * as path from 'path'
import { download } from "./download_swf"

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
for(let i=0;i<gamesData.length;++i){
    var arr=gamesData[i].title.split(" ")
    for(let str in arr){
        str.toLowerCase();
    }
    var imgName=arr.join("-")+".png";
    download(gamesData[i].img,"../data/xyz.games/"+imgName);
}
//download("http://up.zdhm.xyz/images/2018102409434778511.png","../data/1.png")