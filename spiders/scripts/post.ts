import * as fs from 'fs'
import * as path from 'path'
import { timeout } from '../utils/timeout'

var request = require("request")

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
    plays: number,
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
var catArray = ['Girls'];
var gamesData: gamedata[] = [];
const filePath = path.resolve(__dirname, 'E:/desktop/Main/spiders/data/up.zdhm.xyz/all.json');
gamesData = readJson(filePath).data;

var logData: uploadLog[] = [];
const uploadLogPath = path.resolve(__dirname, '../data/upload.log');
logData = readJson(uploadLogPath).index;

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
        desc: gamesData[i].desc,
        category_id: 1,
        localimg: "",
        localgame: ""
    }
    if (gamesData[i].played) {
        data.plays = gamesData[i].played;
    }
    if (gamesData[i].cat) {
        //data.category_id=gamesData[i].cat;
        var catdata = {
            name: gamesData[i].cat,
            rating: 1
        }
        if (catArray.indexOf(gamesData[i].cat) == -1) {
            catArray.push(gamesData[i].cat);
            catdata.rating = catArray.indexOf(gamesData[i].cat) + 1
            data.category_id = catdata.rating
            request.post({
                url: "http://www.jzjo.com/admin/categories/create",
                method: 'POST',
                form: catdata
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("add cat 成功");
                }
            });
        }

    }

    var arr = gamesData[i].title.split(" ");
    for (let j = 0; j < arr.length; ++j) {
        arr[j] = arr[j].toLowerCase();
    }
    if (logData.hasOwnProperty(arr.join("-")))
        continue;
    data.localgame = "/games/" + arr.join("-");
    data.localimg = "/gamesimages/" + arr.join("-");

    request.post({
        url: "https://www.jzjo.com/post.php",
        method: 'POST',
        form: data
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("上传成功");
        }
    });
}


