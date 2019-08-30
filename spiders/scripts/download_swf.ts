var fs = require('fs');
var request = require("request");
const [node, tsPath, url, outDir, filename, ...args] = process.argv;

const download = (url: string, downloadPath: string) => {
    let writeStream = fs.createWriteStream(downloadPath);
    let readStream = request(url,(err,response)=>{
        if(err){
            console.log("错误信息:" + err)
            process.exit(1);
        }
    });
    readStream.pipe(writeStream);

    readStream.on('end', function () {
        console.log('文件下载成功');
    });
    readStream.on('error', function (err) {
        console.log("错误信息:" + err)
        process.exit(1);
     })
}

fs.mkdir(outDir, function (err) {
    if (err) {
        console.log("目录已存在");
    }
    else {
        console.log("创建目录成功");
    }
})
download(url,outDir+"/"+filename);


