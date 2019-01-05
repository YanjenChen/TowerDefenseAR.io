// 回傳 true 代表檢查通過，安全
function checkEngNum(str) {
    arr = "ABCDEFGHIJKLNMOPQRSTUVWXYZ"
    arr = arr + arr.toLowerCase()
    arr = arr + "0123456789"
    arr = arr.split("")
    // arr 現在是 ... [ 'A','B','C',，用來檢查每個字元，是否都在英文數字內
    strarr = str.split("")
    for (a in strarr) {
        vv = true
        for (b in arr) {
            if (strarr[a] == arr[b]) { // 安全，這個字就不用檢查了
                vv = false
                break
            }
        }
        // 如果最後還是 true，就糟糕了，代表這個字 不是英文也不是數字，要擋下來
        if (vv) {
            return false
        }
    }
    return true
}

// 特別給 Bcrypt 加密碼用的，會多出 $ \ / . 字元允許
// 回傳 true 代表檢查通過，安全
function checkEngNumHash(str) {
    arr = "ABCDEFGHIJKLNMOPQRSTUVWXYZ"
    arr = arr + arr.toLowerCase()
    arr = arr + "0123456789"
    arr = arr + "/\\.$%"
    arr = arr.split("")
    // arr 現在是 ... [ 'A','B','C',，用來檢查每個字元，是否都在英文數字內
    strarr = str.split("")
    for (a in strarr) {
        vv = true
        for (b in arr) {
            if (strarr[a] == arr[b]) { // 安全，這個字就不用檢查了
                vv = false

                break
            }
        }

        // 如果最後還是 true，就糟糕了，代表這個字 不是英文也不是數字，要擋下來
        if (vv) {
            console.log("檔 : " + strarr[a])
            return false
        }
    }
    return true
}

// npm install express ejs socket.io util fs sqlite-sync bcrypt multer express-fileupload body-parser path sync-request
// (multer express-fileupload body-parser path) 這4個\用來弄 GET POST 請求

//============================這段，使用 express 基本的伺服器設定
var express = require('express');
var app = express();
var port = 8081;
app.use(express.static('client'));
app.set('views', __dirname + '/server/views');
app.set('view engine', 'ejs');

/*
var RateLimit = require('express-rate-limit');
// 測試完成，五秒內最大十次，不可五秒內最大只給一次，這樣連登入都無法登入，有經過測試
var apiLimiter = new RateLimit({
    windowMs:5 * 1000 , // 5s
    max: 10,                // 3 次
    delayMs: 0,               // disabled 延迟响应
    handler: function (req, res) { // 响应格式
      res.status(429).send("請稍後再試");
    }
});

all_route = ["/","/register","/login","/logout","/createRoom","/joinRoom","/changeReady","/changeTeam","/game"]
for(i in all_route){
    app.use(all_route[i],apiLimiter);
}
*/