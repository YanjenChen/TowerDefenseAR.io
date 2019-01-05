var bcrypt = require('bcrypt'); // 注意，引入模組用 var ，其他檔案才能抓到
//============================這段，設置能處理 GET POST 請求
var fs = require("fs");
var multer = require('multer');
var fileUpload = require('express-fileupload');
app.use(fileUpload());

const path = require('path');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '/uploads/'));
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
var upload = multer({
    storage: storage
})
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser({
    uploadDir: './tmp'
}));
//=========================


if (fs.existsSync("record.json")) {
    //fs.writeFileSync("record.json","")
    fs.unlinkSync("record.json")
}
fs.writeFileSync("record.json", "")
console.log("create record.json")


db_path = cc["db_path"]
if (fs.existsSync(db_path)) {
    //fs.writeFileSync("tdar.db","")
    fs.unlinkSync(db_path)
}
fs.writeFileSync(db_path, "")
console.log("create tdar.db")

//=========================宣告，操作讀寫檔的函示
function ReadRecordFile() {
    var data = fs.readFileSync('record.json', 'utf8');
    if (data.length == 0) {
        return JSON.stringify(Object()) // 回傳空物件的JSON字串
    } else {
        return String(data)
    }
}

function WriteRecordFile(dataStr) {
    // 盡量都用同步的
    fs.unlinkSync("record.json")
    fs.writeFileSync("record.json", dataStr)
}
// data 為 要更新的資料，為 Object ，有多組 kv
function renewRecord(data) {
    ori = ReadRecordFile()
    oriobj = JSON.parse(ori)
    newobj = oriobj
    oriobj = undefined
    for (key in data) {
        newobj[key] = data[key]
    }
    WriteRecordFile(JSON.stringify(newobj))
}



//============================這段寫，初始資料庫連接相關的設定
var sqlite = require('sqlite-sync');

function usedb(sql, out) {
    sqlite.run(sql, function(res) {
        if (res.error) {
            console.log("error : " + res.error)
        }

        // 讚啦，可用了
        //console.log(res);// [ { id: 12, name: 'name1', text: 'text1' } ]
        out["res"] = res
    })
}
sqlite.connect(db_path);


// 注意，

// 初始化，創建需要的 Tabel

create_table_sql_arr  = cc["create_table_sql_arr"]

for (i in create_table_sql_arr) {
    sqlite.run(create_table_sql_arr[i], function(res, mm) {
        if (res.error) {
            //console.log("create_table i :"+i+" , error : "+res.error)
        } else {
            //console.log("create_table i :"+i+" OK");
        }
        // 這個沒用，是否有創見table，res 都是 [] 空陣列
        //console.log("res i : "+i+" , res : "+JSON.stringify(mm))
    });
}
renewRecord({
    hasCreateTable: true
})

// 注意，使用這個時，別離 下一個使用 usedb() 太近，短時間內連續對DB寫入多次資料，sqlite 會當機，測試過了，只要放遠一點就正常了
// 資料 : https://www.cnblogs.com/xienb/p/3455562.html
// UserRegister , UserLogin , UserCreateRoom , UserJoinRoom , UserLeaveRoom , UserReady , UserChangeTeam
function getHashTypeStr(name) {

    sql = "select * from ProcessHashs where name='" + name + "';"
    obj = Object()
    //console.log("A sql : "+sql)
    usedb(sql, obj);
    //console.log("B sql : "+sql)
    if (obj["res"].length == 1) { // 找到了
        return obj["res"][0]["password"]
    } else { // 代表打錯名字，找不到
        return ""
    }


}


function getLastRoomid() {
    get = "select * from PlayRooms order by id desc LIMIT 1"
    obj = Object()
    usedb(get, obj)
    if (obj["res"].length == 1) {
        return obj["res"][0]["id"]
    } else { // 代表沒 room 了
        return undefined
    }

}

// 初始化，創建各 Tabel 初始的資料行
init_insert_check_obj = JSON.parse(ReadRecordFile())
if (!init_insert_check_obj["hasInitInsert"]) {
    da = new Date()
    ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()
    init_insert_sql_arr = cc["init_insert_sql_arr"]
    
    for (i in init_insert_sql_arr) {
        sqlite.run(init_insert_sql_arr[i], function(res) {
            if (res.error) {
                //console.log("init_insert i :"+i+" , error : "+res.error)
            } else {
                //console.log("init_insert i :"+i+" OK");
            }

        });
    }
    renewRecord({
        hasInitInsert: true
    })
}
