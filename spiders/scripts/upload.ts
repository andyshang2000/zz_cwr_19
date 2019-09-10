let Client = require("ssh2-sftp-client")
let upload = function(localPath, remotePath){
        let sftp = new Client();
        sftp.connect({
            host: '45.76.225.115',
            port: '22',
            username: 'jal',
            password: 'qiuweidao123'
        }).then(()=>{
            return sftp.put(localPath, remotePath);
        }).then(()=>{
            console.log('上传完成');
            sftp.end();
        }).then(()=>{
            console.log('下载完成');
            sftp.end();
        }).catch((err)=>{
            console.log(err.message);
        })
    }

upload("../data/h5games.online/animals.json","/home/jal/test.json");