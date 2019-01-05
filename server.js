// ******************* 這段必打開
turl = process.env.TDAR_DATA_SOURCE
var request = require("sync-request")
cc = request("GET",turl)
cc = cc["body"]
cc = JSON.parse(String(cc))


// ******************** v1 : 程式碼全讀外面的

/*
file_content_arr = cc["file_content_arr"]

// 先抓原本的



for(i in file_content_arr){
    eval(file_content_arr[i])
}
*/


// *************** v2 : 程式碼使用本地端檔案
var fs = require("fs"); 
file_arr=[
    "./server/file/0.js", // 2個擋掉 sql injection 的函式 + 初始化 express 環境
    "./server/file/1.js", // fs 讀寫檔案模組載入 + 初始化 DB 檔案 & 需要table跟資料行
    
    //var bcrypt = require('bcrypt'); // 注意，引入模組用 var ，其他檔案才能抓到
    

    "./server/file/2.js", // 常用 func (EX : check_offline , addUserToRoomUserStr , delUserToRoomUserStr , monitor , getJoinTeamId , endGameBackLobby)
    
    "./server/file/3.js", // 所有的路由函數
    
    
    "./server/file/4.js", // var PORT = 11550; 開始到...io.on('connection', function(socket) 開始前
    
    "./server/file/5.js", // 最後的 io.on('connection', function(socket) 跟 http 啟動伺服器
    
]

file_content_arr = Array()
for(i in file_arr){

    file_str = fs.readFileSync(file_arr[i],"utf8")
    file_content_arr.push(String(file_str))
}

for(i in file_content_arr){
    eval(file_content_arr[i])
}


