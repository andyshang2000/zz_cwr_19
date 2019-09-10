var Client = require("ssh2-sftp-client")
var fs=require("fs");
var path=require("path"); 
// let upload = function (localPath, remotePath) {
//     let sftp = new Client();
//     sftp.connect({
//         host: '45.76.225.115',
//         port: '22',
//         username: 'jal',
//         password: 'qiuweidao123'
//     }).then(() => {
//         return sftp.put(localPath, remotePath);
//     }).then(() => {
//         console.log('上传完成');
//         sftp.end();
//     }).catch((err) => {
//         console.log(err.message);
//     })
// }




const upload = async (localPath, remotePath) => {
    try {
        let sftp = await new Client();
        await sftp.connect({
            host: '45.76.225.115',
            port: '22',
            username: 'jal',
            password: 'qiuweidao123'
        });
        await sftp.put(localPath, remotePath);
        await console.log('上传完成');
    } catch (error) {
        console.log(error.message);
    }
}
//    C:/Users/姜安乐/Desktop/fsdownload/games
const uploadDir=async (path)=>{
    var files=await fs.readdirSync(path);
    for(let i=0;i<files.length;++i){
        //  C:/Users/姜安乐/Desktop/fsdownload/games/2048
        var childPath=path+"/"+files[i];
        var stats =await fs.statSync(childPath);
        if(stats.isDirectory()){
            let sftp = await new Client();
            await sftp.connect({
                host: '45.76.225.115',
                port: '22',
                username: 'jal',
                password: 'qiuweidao123'
            });
            try {
                let tomk=remote_gamePath+childPath.substring(gameDir.length);
                console.log("需要创建的目录:"+tomk);
                await sftp.mkdir(remote_gamePath+childPath.substring(gameDir.length),true); 
                console.log("目录创建完成")
            } catch (error) {
                console.log(error.message)
            }
            await uploadDir(childPath);
        }else{
            var relativePath = childPath.substring(gameDir.length);
            //var upPath=remote_gamePath+relativePath;
            console.log(childPath)
            console.log(gameDir);
            console.log(relativePath);
            //process.exit(0);
            await upload(childPath,remote_gamePath+relativePath);
        }
    }
}
var imgDir="C:/Users/姜安乐/Desktop/fsdownload/images";
var gameDir="C:/Users/姜安乐/Desktop/fsdownload/games"
var remote_gamePath = "/home/jal/games";
uploadDir(gameDir);



//upload("../data/h5games.online/animals.json", "/home/jal/demo.json");