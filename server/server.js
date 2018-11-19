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

// npm install express ejs socket.io util fs sqlite-sync bcrypt multer express-fileupload body-parser path
// (multer express-fileupload body-parser path) 這4個\用來弄 GET POST 請求

//============================這段，使用 express 基本的伺服器設定
var express = require('express');
var app = express();
var port = 11235;
app.use(express.static('../client/'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');





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



if (fs.existsSync("tdar.db")) {
    //fs.writeFileSync("tdar.db","")
    fs.unlinkSync("tdar.db")
}
fs.writeFileSync("tdar.db", "")
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

//============================這段寫，初始 bcrypt 加密工具
const bcrypt = require('bcrypt');

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
sqlite.connect('./tdar.db');


// 注意，

// 初始化，創建需要的 Tabel
create_table_sql_arr = [
    // 創建 User 資料表
    "CREATE TABLE IF NOT EXISTS Users (id integer PRIMARY KEY AUTOINCREMENT, name char(50),password char(70),login_hash char(70) DEFAULT NULL, logout_hash char(70) DEFAULT NULL, create_room_hash char(70) DEFAULT NULL, join_room_hash char(70) DEFAULT NULL, leave_room_hash char(70) DEFAULT NULL, change_team_hash char(70) DEFAULT NULL, change_ready_hash char(70) DEFAULT NULL , start_game_hash char(70) DEFAULT NULL, end_game_hash char(70) DEFAULT NULL,isAdmin bit DEFAULT 0, hasLogin bit DEFAULT 0,isPlaying bit DEFAULT 0,join_room_id char(50) DEFAULT NULL,playing_room_id char(70) , team_id integer DEFAULT 0)"

    // 注意 team_id 寫 1 或 2 ，代表是 team1 或 team2
    ,
    // 創建 PlayRooms 資料表
    // join_room_user_str 代表 在準備中時，這個 Room 內的所有 user ，不知道有多少 user ，所以這欄位不限制長度，不寫 char(數字)，直接寫 char
    // playing_room_user_str 代表，實際在遊戲開始時，加入的玩家
    "CREATE TABLE IF NOT EXISTS PlayRooms (id integer PRIMARY KEY AUTOINCREMENT,room_id char(50) DEFAULT NULL,create_date_string char(50) DEFAULT NULL,playing_room_id char(70) DEFAULT NULL,join_room_user_str char DEFAULT NULL,playing_room_user_str char DEFAULT NULL,join_team_str char DEFAULT '" + JSON.stringify(
        [{
            team: "Team1",
            usernum: 0
        }, {
            team: "Team2",
            usernum: 0
        }]

    ) + "')",
    // 創建 各按鈕的 密碼表
    "CREATE TABLE IF NOT EXISTS ProcessHashs (id integer PRIMARY KEY AUTOINCREMENT,name char(50) DEFAULT NULL,password char(50) DEFAULT NULL)",
    // 創建 註冊用的紀錄亂碼
    "CREATE TABLE IF NOT EXISTS RegisterHashs (id integer PRIMARY KEY AUTOINCREMENT,user char(50) DEFAULT NULL,nonHash char(70) DEFAULT NULL)",
    // 創建 Admin Login Hash Table
    "CREATE TABLE IF NOT EXISTS AdminLoginHashs (id integer PRIMARY KEY AUTOINCREMENT,admin char(50) DEFAULT NULL,nonHash char(70) DEFAULT NULL)",
    // 創建 Admin Logout Hash Table
    "CREATE TABLE IF NOT EXISTS AdminLogoutHashs (id integer PRIMARY KEY AUTOINCREMENT,admin char(50) DEFAULT NULL,nonHash char(70) DEFAULT NULL)"


]
/*
create_table_sql = "CREATE TABLE IF NOT EXISTS Tests (id integer PRIMARY KEY AUTOINCREMENT, name char(50),text char(50),mib bit DEFAULT 0);"
PlayRooms : id , room_id (room{id}_日期(開房時)) , playing_room_id(room_id hash 後的結構，會當成網址)
Player : id , is_admin , name , password , login_hash(登入檢查的加密碼) , open_room_hash , join_room_hash , leave_room_hash , ready_play_hash , isAdmin , hasLogin , isPlaying , playing_room_id (同上的 playing_id)

insert_sql='INSERT INTO Tests (name,text) VALUES ("name1","text1");';
*/


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
    init_insert_sql_arr = [
        // 加入自己作為管理員
        "INSERT INTO Users (name,password,isAdmin) VALUES ('syn55698','" + bcrypt.hashSync("syn2596", 10) + "',1)",
        "INSERT INTO Users (name,password,isAdmin) VALUES ('fhrol55698','" + bcrypt.hashSync("fhrol2596", 10) + "',1)",
        // 加入 各情況的 Hash
        // UserRegister , UserLogin , UserCreateRoom , UserJoinRoom , UserLeaveRoom , UserReady , UserChangeTeam
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserRegister','wsdawidofieovkewofi')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserLogin','1b5tr454d5b1etrb')",
        // 對，登出也要，免得別人亂送封包，就能讓其他人被登出了
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserLogout','6web45wr54b54e54vberg')",
        //"INSERT INTO ProcessHashs (name,password) VALUES ('UserChangePage','h648rhrw8h48e4tgeg')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserCreateRoom','b45rt45net4drb5reb')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserJoinRoom','54j54uyfty5nym')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserLeaveRoom','n1r22t1njutl5')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserChangeReady','t5es4js5ryj4esrzh')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserChangeTeam','w4r5j45te4aj5t4j5')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserStartGame','4r45e45bre4b54r54bh545ert4b5')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('UserEndGame','nertb4re4n5tn5jty5n')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('AdminLogin,'kuyttfht5te4aj5t4j5')",
        "INSERT INTO ProcessHashs (name,password) VALUES ('AdminLogout','w4r5j45gkoewkgo5t4j5')",

        //測試用，新增一個 room
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room1','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room2','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room3','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room4','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room5','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room6','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room7','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room8','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room9','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room10','" + ds + "')",
        "INSERT INTO PlayRooms (room_id,create_date_string) VALUES ('Room11','" + ds + "')",
    ]
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

//============================ 監控是否在線
var all_player_monitor = Object()

// {"room1":{"人稱":socket物件}}
var in_nonPlaying_room = Object()
var in_playing_room = Object()
var wait_model_all_ready = Object()
var game_enemy = Object() // 記錄各隊伍的 enemy counter

// 記錄各房間的主導者玩家
var all_playing_room_master = Object()

/// 使用者斷線，相關動作
function check_offline(user) {
    // 先確定，若這使用者有加入任何ROOM，就把那個ROOM內的使用者名單刪掉
    sql = "select * from Users where name ='" + String(user) + "'"
    obj = Object()
    usedb(sql, obj)

    user_cols = ["join_room_id", "playing_room_id"]
    room_cols = ["join_room_user_str", "playing_room_user_str"]

    //console.log("VVVVV sql : "+sql)
    //console.log(JSON.stringify(obj["res"]))
    //console.log(obj["res"].length+" , "+(obj["res"].length==1))
    if (obj["res"].length == 1) { // 若有這使用者，才會執行以下內容
        for (i in [0, 1]) { // PS i 就直接是 index 0,1 ，可不管陣列內容，反正陣列就裝兩元素
            tuser = obj["res"][0]
            if (tuser[user_cols[i]]) {
                //console.log("A1")
                roomsql = "select * from PlayRooms where room_id='" + tuser[user_cols[i]] + "'"
                obj2 = Object()
                usedb(roomsql, obj2)
                if (obj2["res"].length == 1) {
                    //console.log("A2")
                    room = obj2["res"][0]
                    roomuser_str = room[room_cols[i]]
                    roomuser = 0
                    if (roomuser_str && (roomuser_str != "")) {

                        //console.log("A3")
                        // 以防意外，例外處理直接上
                        try {
                            roomuser = JSON.parse(roomuser_str)
                        } catch (e) {
                            roomuser = Object()
                        }


                    } else {
                        roomuser = Object()
                    }
                    if (roomuser[String(user)]) { // 如果存在，就刪除
                        delete roomuser[String(user)]

                        new_roomuser_str = JSON.stringify(roomuser)
                        new_roomuser_sql = "UPDATE PlayRooms SET " + room_cols[i] + " = '" + new_roomuser_str + "' where room_id ='" + room["room_id"] + "';";
                        //console.log("sql : "+new_roomuser_sql)
                        usedb(new_roomuser_sql, Object())
                        //console.log("A4")
                    }
                }
            }
        }

        // 重要，把使用者從 in_nonPlaying_room 中取消掉
        room = obj["res"][0]["join_room_id"]
        if ((room != null) && (room != "null") && (room != "undefined") && (room != undefined)) {

            // 刪掉 in_nonPlaying_room 的，若 user 有在
            if (in_nonPlaying_room[room]) {
                if (in_nonPlaying_room[room][obj["res"][0]["name"]]) {
                    delete in_nonPlaying_room[room][obj["res"][0]["name"]]
                }
            }

            // 刪掉 in_playing_room 的，若 user 有在
            if (in_playing_room[room]) {
                if (in_playing_room[room][obj["res"][0]["name"]]) {
                    delete in_playing_room[room][obj["res"][0]["name"]]
                }
            }

            //刪掉 wait_model_all_ready 內的
            if (wait_model_all_ready[room]) {
                if (wait_model_all_ready[room][obj["res"][0]["name"]]) {
                    delete wait_model_all_ready[room][obj["res"][0]["name"]]
                }
            }
        }


        // 這邊也要放, playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 ，因為是強制登出步驟
        // team_id  也要寫0，強制退出時
        erase_hasLogin = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , logout_hash = NULL , playing_room_id = NULL , join_room_id = NULL , team_id = 0 , isPlaying = 0 where name="' + String(user) + '";';
        usedb(erase_hasLogin, Object())
        delete all_player_monitor[String(user)]
        console.log("User " + user + " Check offline")


    }
}

// join_room_user_str 類似這樣 {"syn55698":1} .. 類似這樣，1 可寫 1 或 2 代表 team_id
// 當有使用者加入room，處理 Room 資料行東西
function addUserToRoomUserStr(user, room_id, col, team_id, user_socket) { // col 是 join_room_user_str 或 playing_room_user_str，user 是使用者名稱
    roomsql = "select * from PlayRooms where room_id='" + room_id + "'"
    obj2 = Object()
    usedb(roomsql, obj2)
    if (obj2["res"].length == 1) { // 此room存在
        //console.log("B2")
        room = obj2["res"][0]
        roomuser_str = room[col]
        roomuser = 0
        if (roomuser_str && (roomuser_str != "")) {

            //console.log("B3")
            // 以防意外，例外處理直接上
            try {
                roomuser = JSON.parse(roomuser_str)
            } catch (e) {
                // 直接給一個空物件
                roomuser = Object()
            }


        } else {
            // 直接給一個空物件
            roomuser = Object()
        }

        if (!roomuser[String(user)]) { // 如果不存在，就加入


            // 放入 使用者的 team_id + 使用者的準備狀態
            roomuser[String(user)] = {
                team_id: team_id,
                status: false
            }

            new_roomuser_str = JSON.stringify(roomuser)

            // 更新 join_room_user_str ，寫入所有的加入room使用者資訊
            // 也更新 join_team_str ，紀錄2隊人數
            // join_team 此時是陣列


            join_team = JSON.parse(room["join_team_str"])
            // team_id 是 1,2，對到 index 的 0,1，所以就 -1

            //console.log("CCCCCCC : "+team_id+" , type : "+typeof(team_id))
            //console.log("MMMM : "+JSON.stringify(join_team))
            //console.log("BBBB : "+join_team[(team_id-1)]+" , : "+join_team[0])
            join_team[(team_id - 1)]["usernum"] = join_team[(team_id - 1)]["usernum"] + 1
            new_join_team_str = JSON.stringify(join_team)
            //console.log("到這邊")
            new_roomuser_sql = "UPDATE PlayRooms SET " + col + " = '" + new_roomuser_str + "' , join_team_str = '" + new_join_team_str + "' where room_id ='" + room_id + "';";
            usedb(new_roomuser_sql, Object())
            //console.log("B4")


            // 先不要
            /*
            // 加入到 in_nonPlaying_room
            if(!in_nonPlaying_room[room_id]){ // 若未有這房間 key，就先創一個，給 Object()
                in_nonPlaying_room[room_id] = Object()
            }

            in_nonPlaying_room[room_id][user] = user_socket
            */
        }
    }
}
// 當有使用者退出room，處理 Room 資料行東西
function delUserToRoomUserStr(user, room_id, col, team_id) { // col 是 join_room_user_str 或 playing_room_user_str，user 是使用者名稱
    roomsql = "select * from PlayRooms where room_id='" + room_id + "'"
    obj2 = Object()
    usedb(roomsql, obj2)
    if (obj2["res"].length == 1) { // 此room存在
        //console.log("B2")
        room = obj2["res"][0]
        roomuser_str = room[col]
        roomuser = 0
        if (roomuser_str && (roomuser_str != "")) {

            //console.log("B3")
            // 以防意外，例外處理直接上
            try {
                roomuser = JSON.parse(roomuser_str)
            } catch (e) {
                // 注意，若這間房間，沒有任何使用者，就不需做任何動作
            }

            if (roomuser[String(user)]) { // 如果使用者存在這房間，就退出

                // 退出動作，刪除 join_room_user_str 中的 user
                delete roomuser[String(user)]
                new_roomuser_str = JSON.stringify(roomuser)
                // 把 join_team_str 中，該使用者所屬的隊伍的人數-1
                //console.log("CCCCCCCCCC : "+JSON.stringify())
                join_team = JSON.parse(room["join_team_str"])
                //console.log("CCCCCCCCCC : "+JSON.stringify(join_team)+" , "+JSON.stringify(join_team[(team_id-1)]))
                join_team[(team_id - 1)]["usernum"] = join_team[(team_id - 1)]["usernum"] - 1
                new_join_team_str = JSON.stringify(join_team)

                new_roomuser_sql = "UPDATE PlayRooms SET " + col + " = '" + new_roomuser_str + "' , join_team_str = '" + new_join_team_str + "' where room_id ='" + room_id + "';";
                usedb(new_roomuser_sql, Object())


                //console.log("B4")
            } else {
                // 使用者不在這房間，就不需進行任何動作
            }

        } else {
            // 注意，若這間房間，沒有任何使用者，就不需做任何動作
        }
    }
}

function monitor() {

    for (user in all_player_monitor) {
        /*
        if((!all_player_monitor[user]["record"])||(!all_player_monitor[user])){
            check_offline(user)
        }
        */

        obj = Object()
        sql = "select * from Users where name='" + String(user) + "';";
        usedb(sql, obj)



        // (!obj["res"]["isPlaying"]) && (obj["res"]["hasLogin"])
        //console.log("A a : "+ (!obj["res"]["isPlaying"])+" , b : "+(!(obj["res"]["hasLogin"]===false))+" , V "+JSON.stringify(all_player_monitor[user])+"\n")
        if (all_player_monitor[user]) {
            if (!(all_player_monitor[user]["record"] === undefined)) {
                if ((!obj["res"]["isPlaying"]) && (!(obj["res"]["hasLogin"] === false))) {
                    all_player_monitor[user]["record"] = all_player_monitor[user]["record"] + 1;
                    //console.log("這邊")
                    console.log("B monitor " + user + " ++ , value : " + all_player_monitor[user]["record"])
                    if (all_player_monitor[user]["record"] > 5) {
                        // 一樣，必須不在遊戲中，才可動手
                        check_offline(user)

                    }
                }
            }
        }

    }
}

// 使用者進到 Room 時，先隨便分一對，回傳 1 或2
function getJoinTeamId(room_id) {

    room_sql = "select * from PlayRooms where room_id = '" + room_id + "'"
    obj = Object()
    try {

        usedb(room_sql, obj)
        if (obj["res"].length == 1) {

            room = obj["res"][0]
            join_team = JSON.parse(room["join_team_str"])
            team1_user_num = join_team[0]["usernum"]
            team2_user_num = join_team[1]["usernum"]


            // 當已經有6人時，就別加了
            all_num = team1_user_num + team2_user_num
            if (all_num >= 6) {
                return -1
            }

            // 當 team1 比較多人時，就讓人加到 team2。其他時刻則加入 team1
            if (team1_user_num > team2_user_num) {

                return 2
            } else {

                return 1
            }
        } else {

            return 0
        }
    } catch (e) {

        return 0
    }

}

// 結束遊戲
function endGameBackLobby(room_id) {
    obj7 = Object()
    obj7["room_id"] = room_id
    //obj7["user"] = user
    obj7["event_name"] = "serverInformEndGame"

    // 保險起見，還是用二階跳轉

    hash_str = getHashTypeStr('UserEndGame')
    da = new Date()
    ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()
    ds = hash_str + "_" + room_id + "_" + ds



    // 二階跳轉版
    if (in_playing_room[room_id]) {

        // 這段就先不用
        /*
        // 刪掉DB中 PlayingRooms 的這間 Room，直接刪掉，因為玩過了
        del_room_sql = "delete from PlayRooms where room_id ='"+room_id+"'"
        out5 = Object()
        usedb(del_room_sql,out5)
        */

        // 先把每人的 end_game_hash 設好
        set_user_end_hash_sql = "UPDATE Users SET end_game_hash = '" + ds + "' , start_game_hash = NULL where join_room_id='" + room["room_id"] + "'"
        usedb(set_user_end_hash_sql, Object())

        //直接刪掉啊，管他的，反正刪掉一次就好，玩過的Room在遊戲結束時就會消失
        delete in_playing_room[room_id]
        del_room_sql = "delete from PlayRooms where room_id = '" + room_id + "'"
        usedb(del_room_sql, Object())



        // 注意，這兩行要放在 if 內，不然會有一堆問題
        // 不放在內，就會跑多次  io.to(room_id).emit("playingEvent",obj7)
        // 只需要跑一次就好了啦
        obj7["end_game_hash"] = bcrypt.hashSync(ds, 10)
        // 管他的，直接來這招了啦，無聊，Room 功能直接打開
        io.to(room_id).emit("playingEvent", obj7)



        // 刪掉 room 剩下的
        // delete wait_model_all_ready[room_id] // 這個不用，在開始遊戲時就會刪掉
        delete game_enemy[room_id]


        delete all_playing_room_master[room_id]

    }


    // 不用這一段了啦 = =
    /*
    // 如果 room 還在 PlayingRooms + in_playing_room ，就刪一次就好了，免得一直開關DB浪費資源
    if(in_playing_room[room_id]){
        // 刪掉DB中 PlayingRooms 的這間 Room，直接刪掉，因為玩過了
        del_room_sql = "delete from PlayRooms where room_id ='"+room_id+"'"
        out5 = Object()
        usedb(del_room_sql,out5)


        delete in_playing_room[room_id]
    }
    */



}
setInterval(monitor, 1050) // 別直接用1000，有可能會自己被登出
// delete_sql = "DELETE FROM Tests WHERE id>2;"
bb = 0
/*
setInterval(function(){
    del_room = "DELETE FROM PlayRooms where id = "+(11-bb)
    usedb(del_room,Object())
    ++bb
    console.log("=================D")
},2000)
*/
//============================這段寫 所有路由網址的 GET POST 請求的回應
app.get("/test", function(req, res) {
    res.send("<h1>測試用</h1>")
})
app.get("/cc", function(req, res) {
    res.render("admin.ejs", {})
})


// 直接請求，會跳轉到登入頁面
app.get("/", function(req, res) {
    //console.log("A1")



    res.redirect(301, "/login")
})

// 進入 Register 註冊頁面
app.get("/register", function(req, res) {
    res.render("registerForm.ejs", {})
})
// register post 請求，最後的檢查
app.post("/register", function(req, res) {
    //console.log("1 re post")
    //console.log(req.body["registerHash"])
    // 防止 sql injection
    if ((!checkEngNum(req.body["registerName"])) || (!checkEngNum(req.body["registerPass"])) || (!checkEngNumHash(req.body["registerHash"]))) {
        res.redirect(301, "/register")
        return
    }
    //console.log("2 re post")
    //console.log("register post")

    // {"registerName":"vrebetntdrnbdf","registerPass":"aa","registerHash":"$2b$10$FXmtNWA9m8OFq69VD1UMFe6ZCJ/s6T2QvwsMKv2JK3wMNBv1PM6dm"}
    //console.log(JSON.stringify(req.body))

    out = Object()
    sqlstr = "select * from RegisterHashs where user = '" + req.body["registerName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/register")
        return
    }

    registerUser = out["res"][0]
    if (!req.body["registerHash"]) { // 驗證失敗 v2 : 沒有驗證碼
        res.redirect(301, "/register")
        return
    }


    // 反正 v3 跑完，也要刪掉 Hash ，先刪掉也可
    // 刪掉這行 RegisterHash 資料行
    delete_register_hash = "DELETE FROM RegisterHashs WHERE id=" + registerUser['id'] + ";"
    usedb(delete_register_hash, Object())


    vv = bcrypt.compareSync((registerUser["nonHash"]), (req.body["registerHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證失敗
        res.redirect(301, "/register")
        return
    }



    /*
    // 刪掉這行 RegisterHash 資料行
    delete_register_hash = "DELETE FROM RegisterHashs WHERE id="+registerUser['id']+";"
    registerUser = undefined
    usedb(delete_register_hash,Object())
    */

    // 把這個使用者，加到 User Table 中
    add_register_success_user = "INSERT INTO Users (name,password) VALUES ('" + req.body["registerName"] + "','" + bcrypt.hashSync(req.body["registerPass"], 10) + "')"
    usedb(add_register_success_user, Object())
    res.send("<script>alert('註冊成功，請重新登入');location.href='/login'</script>")

})

// /login，登入頁面
app.get("/login", function(req, res) {
    res.render("loginForm.ejs", {})
})
// login post 請求，最後的檢查 + Room 不見回到大廳 + leave Room 請求 (最後回到大廳)
app.post("/", function(req, res) {

    // 如果是回到大廳，就在這另外處理 >> 處理 Room 突然不見時，要回到大廳
    if ((req.body["backLobbyUser"]) && (req.body["backLobbyRoom"])) {
        user = (req.body["backLobbyUser"])
        room = (req.body["backLobbyRoom"])
        //console.log("----------------------- user : "+user+" , room : "+room)

        // 注意，最後一步，把使用者的 join_room_id , palying_room_id 都設 NULL，把 isPlaying 設 0，因為 Room 已經不再了

        clear = 'UPDATE Users SET join_room_id = NULL , playing_room_id = NULL , isPlaying = 0  , team_id = 0 where name="' + user + '";';
        //console.log("---------------clear : "+clear)
        usedb(clear, Object())

        // 顯示大廳網頁
        res.render("room_lobby.ejs", {
            username: user
        })
        return
    }

    // 處理使用者主動離開Room時
    //console.log("VVVVV : \n"+JSON.stringify(req.body))
    //console.log(Boolean((req.body["leaveRoomUser"])&&(req.body["leaveRoomId"])&&(req.body["leaveRoomHash"])))
    if ((req.body["leaveRoomUser"]) && (req.body["leaveRoomId"]) && (req.body["leaveRoomHash"])) {
        //console.log("這邊")
        if ((!checkEngNum(req.body["leaveRoomUser"])) || (!checkEngNum(req.body["leaveRoomId"])) || (!checkEngNumHash(req.body["leaveRoomHash"]))) {
            // 別用 check_offline(user) ，因為可能有 sql injection ，總之先別管就對了。因為 在註冊時，也會擋 sql inejction

            res.redirect(301, "/login")
            return
        }

        // 找這個使用者
        out = Object()
        sqlstr = "select * from Users where name = '" + req.body["leaveRoomUser"] + "';";
        usedb(sqlstr, out)

        if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
            res.redirect(301, "/login")
            return
        }


        leaveRoomUser = out["res"][0]

        // 檢查 joinRoomHash
        if (!req.body["leaveRoomHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
            // 乾脆都放好了www
            clear_joinRoomUserHash = 'UPDATE Users SET leave_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0 where id=' + leaveRoomUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())


            res.redirect(301, "/login")
            return
        }

        // 如果尚未登入，則無法進行 退出房間 動作
        if (!leaveRoomUser["hasLogin"]) {
            // 乾脆都放好了www
            clear_joinRoomUserHash = 'UPDATE Users SET leave_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0  where id=' + joinRoomUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }


        vv = bcrypt.compareSync((leaveRoomUser["leave_room_hash"]), (req.body["leaveRoomHash"]))
        if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
            // 刪除 createRoomHash + 改成未登入
            clear_joinRoomUserHash = 'UPDATE Users SET leave_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0 where id=' + joinRoomUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }


        //
        // 驗證通過，可刪除彥正碼了 + 把使用者的 join_room_id , playing_room_id 都刪掉，也設 isPlaying = 0
        clear_joinRoomUserHash = 'UPDATE Users SET leave_room_hash = NULL , join_room_id = NULL , playing_room_id = NULL , isPlaying = 0 , team_id = 0  where id=' + leaveRoomUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        leave_room_id = req.body["leaveRoomId"]
        //console.log("join_room_id : "+join_room_id)

        // 把 使用者 ，從 PlayRooms 這間房間的 join_room_user_str 清除
        delUserToRoomUserStr(req.body["leaveRoomUser"], leave_room_id, "join_room_user_str", leaveRoomUser["team_id"])


        //console.log("VVVVVVVVVVVVVVVVVVVV")


        res.render("room_lobby.ejs", {
            username: req.body["leaveRoomUser"]
        })
        return
    }

    // 處理使用者玩完遊戲，回到大廳時
    if ((req.body["endGameBackUser"]) && (req.body["endGameBackHash"])) {


        //console.log("P1")
        if ((!checkEngNum(req.body["endGameBackUser"])) || (!checkEngNum(req.body["endGameBackRoom"])) || (!checkEngNumHash(req.body["endGameBackHash"]))) {
            // 別用 check_offline(user) ，因為可能有 sql injection ，總之先別管就對了。因為 在註冊時，也會擋 sql inejction

            res.redirect(301, "/login")
            return
        }

        // 找這個使用者
        out = Object()
        sqlstr = "select * from Users where name = '" + req.body["endGameBackUser"] + "';";
        usedb(sqlstr, out)
        //console.log("P2")
        if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
            res.redirect(301, "/login")
            return
        }


        endGameUser = out["res"][0]

        //console.log("P3")
        // 檢查 joinRoomHash
        if (!req.body["endGameBackHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
            // 乾脆都放好了www
            clear_joinRoomUserHash = 'UPDATE Users SET end_game_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0 where id=' + endGameUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())


            res.redirect(301, "/login")
            return
        }
        // console.log("P4")
        // 如果尚未登入，則無法進行 退出房間 動作
        if (!endGameUser["hasLogin"]) {
            // 乾脆都放好了www
            clear_joinRoomUserHash = 'UPDATE Users SET end_game_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0  where id=' + endGameUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }

        //console.log("P5")
        vv = bcrypt.compareSync((endGameUser["end_game_hash"]), (req.body["endGameBackHash"]))
        if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
            // 刪除 createRoomHash + 改成未登入
            clear_joinRoomUserHash = 'UPDATE Users SET end_game_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 , team_id = 0 where id=' + endGameUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }

        //console.log("P6")
        //
        // 驗證通過，可刪除彥正碼了
        // 驗證通過，可刪除彥正碼了 + 把使用者的 join_room_id , playing_room_id 都刪掉，也設 isPlaying = 0
        // , start_game_hash = NULL 居然得在這才能刪掉 =  。隨便啦
        clear_joinRoomUserHash = 'UPDATE Users SET end_game_hash = NULL , start_game_hash = NULL , join_room_id = NULL , playing_room_id = NULL , isPlaying = 0 , team_id = 0  where id=' + endGameUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        // 注意，這邊重要，把 user 從 in_playing_room 刪掉
        room_id = req.body["endGameBackRoom"]
        if (in_playing_room[room_id]) {
            delete in_playing_room[room_id][endGameUser["name"]]
        }
        //console.log("P7")

        // 顯示 lobby 顯示大廳網頁
        res.render("room_lobby.ejs", {
            username: endGameUser["name"]
        })
        return

    }


    // 防止 sql injection
    if ((!checkEngNum(req.body["loginName"])) || (!checkEngNum(req.body["loginPass"])) || (!checkEngNumHash(req.body["loginHash"]))) {
        res.redirect(301, "/login")
        return
    }
    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["loginName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }


    // 檢查使用者的密碼
    loginUser = out["res"][0]

    vv = bcrypt.compareSync(req.body["loginPass"], loginUser["password"])
    if (!vv) { // 驗證失敗 v2 : 密碼錯誤
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }

    // 檢查 loginHash
    if (!req.body["loginHash"]) { // 驗證失敗 v3 : 連驗證碼都沒有
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }


    // 防止使用者已經登入還玩
    if (loginUser["hasLogin"]) {
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }

    // 在已登入時，網頁按F5重整時，這句 bcrypt.compareSync 會出錯，所以先來做點保險
    if ((!loginUser["login_hash"]) || (!req.body["loginHash"])) {
        // req.body["loginName"] 還能抓到原本登入的帳號名稱，先把 hasLogin 改回0
        delete all_player_monitor[String(user)]
        clear_loginUser_hasLogin = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , logout_hash = NULL , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where name="' + req.body["loginName"] + '";';
        usedb(clear_loginUser_hasLogin, Object())

        // 強制登出，並導回登入頁
        res.redirect(301, "/login")
        return
    }

    vv = bcrypt.compareSync((loginUser["login_hash"]), (req.body["loginHash"]))
    if (!vv) { // 驗證失敗 v4 : 驗證碼錯誤

        // 驗證碼錯誤，就直接刪掉驗證碼，但是不可把 hasLogin 寫1，那就寫0吧
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        res.redirect(301, "/login")
        return
    }

    //console.log("驗證成功")
    // 清掉 使用者的 login_hash + 把使用者設成登入中
    // update_sql = 'UPDATE Tests SET name="nn1",text="tt1" where id=2;';
    clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 1 where id=' + loginUser["id"] + ';';
    usedb(clear_loginUser_loginHash, Object())


    // 開始監控在線
    all_player_monitor[req.body["loginName"]] = Object()
    all_player_monitor[req.body["loginName"]]["record"] = 0

    // 顯示 room_lobby.ejs ，還沒寫
    //res.send("<script>alert('登入成功');location.href='/login'</script>")
    res.render("room_lobby.ejs", {
        username: req.body["loginName"]
    })
})
// logout post 請求，最後的檢查
app.post("/logout", function(req, res) {
    // 防止 sql injection
    if ((!checkEngNum(req.body["logoutName"])) || (!checkEngNumHash(req.body["logoutHash"]))) {
        res.redirect(301, "/login")
        return
    }

    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["logoutName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }



    // 這個要先寫在上面，不然下面 check_offline 找玩家的 room_id ，因為先被  clear_loginUser_loginHash 這句 sql 刪除，而找不到，所以無法發揮作用
    // 反正都要登出，所以找出 user 在地 room ，把 room 資料行清除此玩家紀錄，OK
    // 登出，所以刪除監控在線
    delete all_player_monitor[req.body["logoutName"]]
    // 要手動直接觸發 check_offline ，因為成功logout時，監控在線就會取消作用 (看上一行，已經從監控名單清除)，所以手動觸發，不然 room 內還會留著 user，若是從 room 內直接按登出

    check_offline(req.body["logoutName"])



    // 檢查 logoutHash
    if (!req.body["logoutHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有

        clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 where id=' + logoutUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())


        res.redirect(301, "/login")
        return
    }



    logoutUser = out["res"][0]

    // 如果尚未登入，則無法進行登出動作
    if (!logoutUser["hasLogin"]) {

        clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 where id=' + logoutUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        res.redirect(301, "/login")
        return
    }

    // 刪除 logoutHash 可以擺上面，因為驗證碼檢查錯誤，一樣得刪掉驗證碼
    clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 where id=' + logoutUser["id"] + ';';
    usedb(clear_loginUser_loginHash, Object())


    vv = bcrypt.compareSync((logoutUser["logout_hash"]), (req.body["logoutHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
        res.redirect(301, "/login")
        return
    }

    // 刪除 logoutHash
    /*
    clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 where id='+logoutUser["id"]+';';
    usedb(clear_loginUser_loginHash,Object())
    */

    res.send("<script>alert('登出成功');location.href='/login';</script>")

})

// create room post 請求
app.post("/createRoom", function(req, res) {
    //console.log("AAAAAAAAAAAAAAAAAAAA")

    // {"createRoomName":"syn55698","createRoomHash":"$2b$10$tmn4IpMYBhziptQxR4DhjeDg0LVblR3Df6TpCN8RLenYjHxIZkdu2"}
    //console.log(JSON.stringify(req.body))

    if ((!checkEngNum(req.body["createRoomName"])) || (!checkEngNumHash(req.body["createRoomHash"]))) {
        res.redirect(301, "/login")
        return
    }


    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["createRoomName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }

    // 檢查 logoutHash
    if (!req.body["createRoomHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
        // 乾脆都放好了www
        clear_createRoomUser = 'UPDATE Users SET create_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + createRoomUser["id"] + ';';
        usedb(clear_createRoomUser, Object())


        res.redirect(301, "/login")
        return
    }

    createRoomUser = out["res"][0]

    // 如果尚未登入，則無法進行 開新房間 動作
    if (!createRoomUser["hasLogin"]) {
        // 乾脆都放好了www
        clear_createRoomUser = 'UPDATE Users SET create_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + createRoomUser["id"] + ';';
        usedb(clear_createRoomUser, Object())

        res.redirect(301, "/login")
        return
    }


    vv = bcrypt.compareSync((createRoomUser["create_room_hash"]), (req.body["createRoomHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
        // 刪除 createRoomHash + 改成未登入
        clear_createRoomUser = 'UPDATE Users SET create_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + createRoomUser["id"] + ';';
        usedb(clear_createRoomUser, Object())

        res.redirect(301, "/login")
        return
    }

    // 驗證通過，可刪除彥正碼了
    clear_createRoomUser = 'UPDATE Users SET create_room_hash = NULL where id=' + createRoomUser["id"] + ';';
    usedb(clear_createRoomUser, Object())

    // 重要，要用 insert 新增房間啦!!!!
    //newid = parseInt(String(getLastRoomid()))+1
    vv = getLastRoomid()
    //console.log("vv : "+vv+" , type : "+typeof(vv))
    newid = getLastRoomid() + 1
    newroomid = "Room" + newid
    //console.log("new room : "+newroomid)

    da = new Date()
    ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

    //insert_sql='INSERT INTO Tests (name,text) VALUES ("name1","text1");';
    create_room_sql = 'INSERT INTO PlayRooms (create_date_string) VALUES ("' + ds + '");';
    usedb(create_room_sql, Object())

    select_newest_room_sql = "select * from PlayRooms order by id desc LIMIT 1"
    obj5 = new Object()
    usedb(select_newest_room_sql, obj5)
    tnewid = obj5["res"][0]["id"]
    newroomid = "Room" + tnewid

    update_new_room_id = "UPDATE PlayRooms SET room_id = '" + newroomid + "' where id=" + tnewid
    usedb(update_new_room_id, Object())
    //console.log("=============================")

    //res.render("room_wait.ejs",{})

    // 用 Ajax 把..丟到客戶端，從客戶端進行 Join 動作
    res.send({
        fromCreateToJoin: true,
        join_room_id: newroomid
    })
})

// 經過實驗，在 /joinRoom (已加入房間內) 直接按 F5 重整頁面，會跳到 GET 的 /joinRoom ，在此重導回 /login
app.get("/joinRoom", function(req, res) {

    res.redirect(301, "/login")
})

// join room post 請求
app.post("/joinRoom", function(req, res) {
    //console.log("joinRoom post")

    //console.log("JJJ : "+JSON.stringify(req.body))
    if ((!checkEngNum(req.body["joinRoomName"])) || (!checkEngNumHash(req.body["joinRoomHash"])) || (!checkEngNum(req.body["joinRoomId"]))) {
        res.redirect(301, "/login")
        return
    }


    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["joinRoomName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }




    joinRoomUser = out["res"][0]

    // 代表人滿了不給加
    // 注意，會在websocket會先檔，會到這個if內，絕對是在偽造封包的，直接檔下去就對了
    team_id = getJoinTeamId(req.body["joinRoomId"])
    if (team_id == -1) {
        clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + joinRoomUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }


    // 檢查 joinRoomHash
    if (!req.body["joinRoomHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + joinRoomUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }



    // 如果尚未登入，則無法進行 加入房間 動作
    if (!joinRoomUser["hasLogin"]) {
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + joinRoomUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }


    vv = bcrypt.compareSync((joinRoomUser["join_room_hash"]), (req.body["joinRoomHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
        // 刪除 createRoomHash + 改成未登入
        clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + joinRoomUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }

    //console.log("JJJJJJ")

    // 重要，確認這間房間存在 & 沒在遊戲中
    check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(req.body["joinRoomId"]) + "';"
    obj3 = Object()
    usedb(check_room_can_join, obj3)
    if (obj3["res"].length == 0) { // 被擋
        try {
            /*
            obj["result"] = "no";
            obj["event_name"]="serverResponseJoinRoom";
            obj["cause"] = "此遊戲房間不存在，或是遊戲中，無法加入"
            console.log("檢查遊戲房間是否可加入，被擋")
            socket.emit("nonPlayingEvent",obj)
            return
            */

            clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL  , hasLogin = 0 where id=' + joinRoomUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())
            console.log("檢查遊戲房間是否可加入，被擋")
            res.redirect(301, "/login")
            return
        } catch (e) {
            // 應該就是網路出錯，就啥動作都不做
            return
        }
        return
    }


    //驗證都通過

    //將 join_room_hash 清掉
    // 驗證通過，可刪除彥正碼了
    clear_joinRoomUserHash = 'UPDATE Users SET join_room_hash = NULL where id=' + joinRoomUser["id"] + ';';
    usedb(clear_joinRoomUserHash, Object())

    join_room_id = req.body["joinRoomId"]
    //console.log("join_room_id : "+join_room_id)

    // 把使用者的 join_room_id 寫上 + 寫上 team_id
    // 寫，應該要回傳的 id
    // 先亂寫

    team_id = getJoinTeamId(join_room_id)

    set_joinRoomUser = 'UPDATE Users SET join_room_id = "' + join_room_id + '" , hasLogin=1 , team_id = ' + team_id + ' where id=' + joinRoomUser["id"] + ';';
    usedb(set_joinRoomUser, Object())
    //console.log("VVVV : "+req.body["joinRoomName"]+" , uid : "+joinRoomUser["id"])

    // team_id 也傳入
    // 把 使用者 加到 PlayRooms 這間房間的 join_room_user_str
    addUserToRoomUserStr(req.body["joinRoomName"], join_room_id, "join_room_user_str", team_id)


    // 注意，當打開這句，而又沒寫好 room_wait.ejs ，就會發生...跑到下一句時，原本開房  user 的 hasLogin=1
    // 過了幾秒 hasLogin 變0，這是正常的不用擔心
    // 因為跳到下面這句時，會自動貼換網址為 /joinRoom (post)，若此時 又沒寫好 room_wait.ejs ，網頁就會變成脫軌狀態
    // 離開原本網頁，也不會在送 check 在線的請求 到 websocket server ，所已過了幾秒後，沒送請求，監控的Server就會認為是斷線了，把 hasLogin 設0

    // 反證法 : 把下面這據移除，當跑到這邊時，不管之後過了幾秒，hasLogin 都會維持1不會變0
    res.render("room_wait.ejs", {
        user: req.body["joinRoomName"],
        room_id: join_room_id
    })
})
// change team ajax post 請求
app.post("/changeTeam", function(req, res) {

    // changeTeam
    if ((!checkEngNum(req.body["changeTeamUser"])) || (!checkEngNumHash(req.body["changeTeamHash"])) || (!checkEngNum(req.body["room_id"])) || (!checkEngNum(req.body["new_team_id"]))) {
        res.redirect(301, "/login")
        return
    }

    // 檢查是否有這個使用者
    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["changeTeamUser"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }
    changeTeamUser = out["res"][0]


    // 重要，確認這間房間存在 & 沒在遊戲中
    check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(req.body["room_id"]) + "';"
    obj3 = Object()
    usedb(check_room_can_join, obj3)
    if (obj3["res"].length == 0) { // 被擋
        clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }
    //

    // 檢查 changeTeamHash
    if (!req.body["changeTeamHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }



    // 如果尚未登入，則無法進行 加入房間 動作
    if (!changeTeamUser["hasLogin"]) {
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }

    //console.log(changeTeamUser["change_team_hash"]+" , "+req.body["changeTeamHash"])
    vv = bcrypt.compareSync((changeTeamUser["change_team_hash"]), (req.body["changeTeamHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
        // 刪除 createRoomHash + 改成未登入
        clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }


    // 驗證通過

    // 刪除 chane_team_hash + 改使用者的 team_id
    set_joinRoomUser = 'UPDATE Users SET change_team_hash = NULL , hasLogin=1 , team_id = ' + req.body["new_team_id"] + ' where id=' + changeTeamUser["id"] + ';';
    usedb(set_joinRoomUser, Object())

    // 去抓這間 Room 的 join_room_user_str ，去改裡面 這玩家的 team_id。還要改 Room 的 join_team_str ，更新兩邊隊伍玩家人數
    sql_room = "select * from PlayRooms where room_id ='" + req.body["room_id"] + "'"
    obj5 = Object()
    usedb(sql_room, obj5)
    if (obj5["res"].length == 1) {
        room = obj5["res"][0]
        //console.log(typeof(room["join_room_user_str"])+" , "+room["join_room_user_str"])
        join_room_user = JSON.parse(room["join_room_user_str"])
        if (join_room_user[changeTeamUser["name"]]) {

            join_room_user[changeTeamUser["name"]]["team_id"] = req.body["new_team_id"]
            new_join_room_user_str = JSON.stringify(join_room_user)

            join_team = JSON.parse(room["join_team_str"])
            new_team_id = req.body["new_team_id"]
            old_team_id = 0
            if (new_team_id == 1) {
                old_team_id = 2
            } else if (new_team_id == 2) {
                old_team_id = 1
            } else { // 代表來亂的
                clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
                usedb(clear_joinRoomUserHash, Object())

                res.redirect(301, "/login")
                return
            }
            join_team[(old_team_id - 1)]["usernum"] = join_team[(old_team_id - 1)]["usernum"] - 1
            join_team[(new_team_id - 1)]["usernum"] = join_team[(new_team_id - 1)]["usernum"] + 1
            new_join_team_str = JSON.stringify(join_team)


            set_join_room_user_sql = "UPDATE PlayRooms SET join_room_user_str = '" + new_join_room_user_str + "' , join_team_str = '" + new_join_team_str + "' where room_id='" + req.body["room_id"] + "'"

            usedb(set_join_room_user_sql, Object())
            // 離開 if ，到最下面去
        } else {
            // 在這房間，找不到 這 User，一樣強制登出
            clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }
    } else {
        // 找不到 room，一樣強制登出
        clear_joinRoomUserHash = 'UPDATE Users SET change_team_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeTeamUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }

    // 該做的 sql 動作都做完了

    //console.log("到這邊")
    // 隨便丟個東西回去就好\
    res.send(JSON.stringify({
        result: "OK",
        new_team_id: req.body["new_team_id"]
    }))
})
// change ready ajax post 請求
app.post("/changeReady", function(req, res) {

    // changeTeam
    if ((!checkEngNum(req.body["changeReadyUser"])) || (!checkEngNumHash(req.body["changeReadyHash"])) || (!checkEngNum(req.body["room_id"])) || (!checkEngNum(req.body["new_ready_id"]))) {
        res.redirect(301, "/login")
        return
    }

    // 檢查是否有這個使用者
    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["changeReadyUser"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }
    changeReadyUser = out["res"][0]

    // 重要，確認這間房間存在 & 沒在遊戲中
    check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(req.body["room_id"]) + "';"
    obj3 = Object()
    usedb(check_room_can_join, obj3)
    if (obj3["res"].length == 0) { // 被擋
        clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }
    //


    // 檢查 changeReadyHash
    if (!req.body["changeReadyHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())


        res.redirect(301, "/login")
        return
    }

    // 如果尚未登入，則無法進行 加入房間 動作
    if (!changeReadyUser["hasLogin"]) {
        // 乾脆都放好了www
        clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }

    //console.log(changeTeamUser["change_team_hash"]+" , "+req.body["changeTeamHash"])
    vv = bcrypt.compareSync((changeReadyUser["change_ready_hash"]), (req.body["changeReadyHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤
        // 刪除 createRoomHash + 改成未登入
        clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }


    // 驗證通過~~~~~


    // 刪除 chane_ready_hash + 改使用者的 ready_id
    set_joinRoomUser = 'UPDATE Users SET change_ready_hash = NULL , hasLogin=1 , team_id = ' + req.body["new_ready_id"] + ' where id=' + changeReadyUser["id"] + ';';
    usedb(set_joinRoomUser, Object())

    // 去抓這間 Room 的 join_room_user_str ，去改裡面 這玩家的 status。 若 new_ready_id = 1 就寫 true， 是 0 就寫 false
    sql_room = "select * from PlayRooms where room_id ='" + req.body["room_id"] + "'"
    obj5 = Object()
    usedb(sql_room, obj5)
    if (obj5["res"].length == 1) {
        room = obj5["res"][0]
        //console.log(typeof(room["join_room_user_str"])+" , "+room["join_room_user_str"])
        join_room_user = JSON.parse(room["join_room_user_str"])
        if (join_room_user[changeReadyUser["name"]]) {

            new_status = -1

            // 注意，這邊有鬼，當 req.body["new_ready_id"] == 0 時，寫 if(req.body["new_ready_id"]) 時 居然會跑進 if 內，所以比得更精細點，比 0 或 1 ，這樣就不會出錯
            if (req.body["new_ready_id"] == 1) {
                new_status = true
            } else if (req.body["new_ready_id"] == 0) {
                new_status = false
            } else {
                console.log("來亂的")
                clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
                usedb(clear_joinRoomUserHash, Object())

                res.redirect(301, "/login")
                return
            }

            join_room_user[changeReadyUser["name"]]["status"] = new_status
            new_join_room_user_str = JSON.stringify(join_room_user)
            //console.log('req.body["new_ready_id"] : '+req.body["new_ready_id"])
            //console.log("new_join_room_user_str : "+new_join_room_user_str)




            set_join_room_user_sql = "UPDATE PlayRooms SET join_room_user_str = '" + new_join_room_user_str + "'  where room_id='" + req.body["room_id"] + "'"

            usedb(set_join_room_user_sql, Object())
            // 離開 if ，到最下面去
        } else {
            // 在這房間，找不到 這 User，一樣強制登出
            clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
            usedb(clear_joinRoomUserHash, Object())

            res.redirect(301, "/login")
            return
        }
    } else {
        // 找不到 room，一樣強制登出
        clear_joinRoomUserHash = 'UPDATE Users SET change_ready_hash = NULL  , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + changeReadyUser["id"] + ';';
        usedb(clear_joinRoomUserHash, Object())

        res.redirect(301, "/login")
        return
    }
    res.send(JSON.stringify({
        result: "OK",
        new_ready_id: req.body["new_ready_id"]
    }))
})

// 管理者登入  介面
app.get("/monitor", function(req, res) {
    res.render("adminLogin.ejs", {})
})
// 管理者 登入 post 請求
app.post("/monitor", function(req, res) {


    // 防止 sql injection
    if ((!checkEngNum(req.body["adminLoginName"])) || (!checkEngNum(req.body["adminLoginPass"])) || (!checkEngNumHash(req.body["adminLoginHash"]))) {
        res.redirect(301, "/monitor")
        return
    }
    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["adminLoginName"] + "' and isAdmin = 1;";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/monitor")
        return
    }


    // 檢查使用者的密碼
    loginAdmin = out["res"][0]
    //console.log("CCC : "+JSON.stringify(loginAdmin))
    vv = bcrypt.compareSync(req.body["adminLoginPass"], loginAdmin["password"])
    if (!vv) { // 驗證失敗 v2 : 密碼錯誤
        res.redirect(301, "/monitor")
        return
    }

    //console.log("到這邊")

    // 防止使用者已經登入還玩
    if (loginAdmin["hasLogin"]) {
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        // 刪掉 AdminLoginhash
        clear_hash = "delete from AdminLoginHashs where admin ='" + req.body["adminLoginName"] + "'"
        usedb(clear_hash, Object())

        res.redirect(301, "/monitor")
        return
    }
    //console.log("2到這邊")

    // 檢查 loginHash
    if (!req.body["adminLoginHash"]) { // 驗證失敗 v3 : 連驗證碼都沒有
        res.redirect(301, "/monitor")
        return
    }


    //console.log("3到這邊")




    //取出 DB 中驗證碼
    sql_hash = "select * from AdminLoginHashs where admin = '" + loginAdmin["name"] + "'"

    obj6 = Object()
    usedb(sql_hash, obj6)
    //console.log(" : "+obj6["res"])
    if (obj6["res"].length != 1) {
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        // 刪掉 AdminLoginhash
        clear_hash = "delete from AdminLoginHashs where admin ='" + req.body["adminLoginName"] + "'"
        usedb(clear_hash, Object())

        res.redirect(301, "/monitor")
        return
    }
    //console.log("4到這邊")
    admin_login_hash = obj6["res"][0]
    //console.log(JSON.stringify(admin_login_hash)+" , "+JSON.stringify(req.body))
    vv = bcrypt.compareSync(admin_login_hash["nonHash"], (req.body["adminLoginHash"]))
    if (!vv) { // 驗證失敗 v4 : 驗證碼錯誤

        // 驗證碼錯誤，就直接刪掉驗證碼，但是不可把 hasLogin 寫1，那就寫0吧
        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + loginAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        // 刪掉 AdminLoginhash
        clear_hash = "delete from AdminLoginHashs where admin ='" + req.body["adminLoginName"] + "'"
        usedb(clear_hash, Object())

        res.redirect(301, "/login")
        return
    }


    //console.log("5到這邊")

    //console.log("驗證成功")
    // admin 設成登入中
    clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 1 where id=' + loginAdmin["id"] + ';';
    usedb(clear_loginUser_loginHash, Object())

    //刪除 DB AdminLoginHash 紀錄
    // delete_sql = "DELETE FROM Tests WHERE id>2;"

    clear_hash = "delete from AdminLoginHashs where admin ='" + req.body["adminLoginName"] + "'"
    //console.log("CCC : "+clear_hash)
    usedb(clear_hash, Object())


    //console.log("到這邊")
    res.render("admin.ejs", {})
})

// 管理者 登出 post 請求
app.post("/monitorLogout", function(req, res) {


    // 防止 sql injection
    if ((!checkEngNum(req.body["adminLogoutName"])) || (!checkEngNumHash(req.body["adminLogoutHash"]))) {
        res.redirect(301, "/login")
        return
    }

    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["adminLogoutName"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/monitor")
        return
    }




    logoutAdmin = out["res"][0]

    // 檢查 logoutHash
    if (!req.body["adminLogoutHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有

        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + logoutAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        // 刪掉 AdminLogouthash
        clear_hash = "delete from AdminLogoutHashs where admin ='" + req.body["adminLogoutName"] + "'"
        usedb(clear_hash, Object())


        res.redirect(301, "/monitor")
        return
    }





    // 如果尚未登入，則無法進行登出動作
    if (!logoutUser["hasLogin"]) {

        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + logoutAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())

        // 刪掉 AdminLogouthash
        clear_hash = "delete from AdminLogoutHashs where admin ='" + req.body["adminLogoutName"] + "'"
        usedb(clear_hash, Object())

        res.redirect(301, "/monitor")
        return
    }


    // 刪掉 AdminLogouthash 可以擺上面，因為驗證碼檢查錯誤，一樣得刪掉驗證碼
    clear_hash = "delete from AdminLogoutHashs where admin ='" + req.body["adminLogoutName"] + "'"
    usedb(clear_hash, Object())


    vv = bcrypt.compareSync((logoutUser["logout_hash"]), (req.body["adminLogoutHash"]))
    if (!vv) { // 驗證失敗 v3 : 驗證碼錯誤

        clear_loginUser_loginHash = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + logoutAdmin["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())


        res.redirect(301, "/monitor")
        return
    }

    // 刪除 logoutHash
    /*
    clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 where id='+logoutUser["id"]+';';
    usedb(clear_loginUser_loginHash,Object())
    */

    res.send("<script>alert('登出成功');location.href='/monitor';</script>")

})


app.get("/cccc", function(req, res) {
    res.render("game.ejs", {})
})

// 重要，post 請求，顯示遊戲網頁
app.post("/game", function(req, res) {

    // {"startGameUser":"syn55698","startGameRoom":"Room11","startGameHash":"$2b$10$cjgtuEXJj2V84gRXlcYrxuXV5Sl8Md4twhEh0g89zRxny0Hqr7zx2"}
    // console.log("HHHH : "+JSON.stringify(req.body))
    //console.log("V0")
    // 防止 sql injection
    if ((!checkEngNum(req.body["startGameUser"])) || (!checkEngNum(req.body["startGameRoom"])) || (!checkEngNumHash(req.body["startGameHash"]))) {
        res.redirect(301, "/login")
        return
    }

    //console.log("V-1")
    out = Object()
    sqlstr = "select * from Users where name = '" + req.body["startGameUser"] + "';";
    usedb(sqlstr, out)

    if (out["res"].length != 1) { // 驗證失敗 v1 : 找不到 user
        res.redirect(301, "/login")
        return
    }

    //console.log("V1")

    startGameUser = out["res"][0]
    // 檢查使用者未在遊戲中
    if (startGameUser["isPlaying"] == 1) {
        // 退出
        clear_loginUser_loginHash = 'UPDATE Users SET start_game_hash = NULL , login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + startGameUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }

    // 檢查這間房間還在並尚未在遊戲中
    room_sql = "select * from PlayRooms where room_id='" + req.body["startGameRoom"] + "' and playing_room_id IS NULL"
    out3 = Object()
    usedb(room_sql, out3)
    if (out3["res"].length != 1) {
        // 退出
        clear_loginUser_loginHash = 'UPDATE Users SET start_game_hash = NULL , login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + startGameUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }


    // 檢查  start_game_hash
    if (!req.body["startGameHash"]) { // 驗證失敗 v2 : 連驗證碼都沒有
        clear_loginUser_loginHash = 'UPDATE Users SET start_game_hash = NULL , login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + startGameUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }
    //console.log("V2")
    vv = bcrypt.compareSync(startGameUser["start_game_hash"], req.body["startGameHash"], )
    if (!vv) { // 驗證失敗 v3 : 密碼錯誤
        clear_loginUser_loginHash = 'UPDATE Users SET start_game_hash = NULL , login_hash = NULL , hasLogin = 0 , playing_room_id = NULL , join_room_id = NULL , isPlaying = 0  , team_id = 0 where id=' + startGameUser["id"] + ';';
        usedb(clear_loginUser_loginHash, Object())
        res.redirect(301, "/login")
        return
    }




    //console.log("V3")



    room = out3["res"][0]

    //console.log("V4 : "+room["join_room_user_str"])
    // 先減15，這段很花時間，很容易就變成超時
    all_player_monitor[startGameUser["name"]]["record"] = all_player_monitor[startGameUser["name"]]["record"] - 15

    // 刪掉 start_game_hash + isPlaying = 1 設成遊戲中

    // 媽的 start_game_hash 不知為啥就這個欄位改不了...這個只能在 遊戲結束時那邊才能刪掉
    // 管他的，會先用 isPlaying == 1 先把還想再連線進來的同一使用者擋下來，不用擔心
    //  UPDATE Users SET start_game_hash = NULL , login_hash = NULL , hasLogin = 1 , isPlaying = 1  where id=1;
    clear_loginUser_loginHash = 'UPDATE Users SET  login_hash = NULL , hasLogin = 1 , isPlaying = 1  , start_game_hash = NULL where id = ' + startGameUser["id"] + ';';
    usedb(clear_loginUser_loginHash, Object())

    /*
    i3=0
    while(i3<10){
        clear_loginUser_loginHash = 'UPDATE Users SET  start_game_hash = NULL where id='+startGameUser["id"]+';';
        console.log("FFF : "+clear_loginUser_loginHash)
        ss= Object()
        usedb(clear_loginUser_loginHash,ss)
        console.log("end : "+JSON.stringify(ss))
        ++i3.
    }
    */
    // 把

    // 驗證通過，所有人開始跳轉頁面
    // 注意，先別設 PlayingRooms 此間 room 的 playing_room_id，因為有多個人要檢查，一個人先設了，別的人檢查 playing_room_id 就不是 NULL，就會被擋，請注意
    obj6 = Object()

    obj6["room_id"] = req.body["startGameRoom"]
    obj6["join_room_user_str"] = room["join_room_user_str"]
    obj6["join_team_str"] = room["join_team_str"]


    join_room_user = JSON.parse(room["join_room_user_str"])
    obj6["user"] = req.body["startGameUser"]
    user = obj6["user"]
    obj6["user_faction"] = join_room_user[user]["team_id"]

    obj6["user_team_id"] = join_room_user[req.body["startGameUser"]]["team_id"] // 1 或 2


    // 刪掉 in_nonPlaying_room 這間 Room 的，若有，通常只會刪掉一次
    if (in_nonPlaying_room[req.body["startGameRoom"]]) {
        delete in_nonPlaying_room[req.body["startGameRoom"]]
    }

    if (!wait_model_all_ready[room_id]) {
        obj8 = Object()
        //wait_model_all_ready[room_id] =

        // room["join_room_user_str"]
        room_user = JSON.parse(room["join_room_user_str"])
        for (user in room_user) {
            obj8[user] = {
                name: user,
                model_ready: false,
                socket_join_ready: false
            }
        }
        /*

        TypeError: Cannot read property 'undefined' of undefined
            at Socket.<anonymous> (D:\Programing_Projects\#學校網頁課1\TDAR_1114_Test\server.js:3290:44)
        */
        wait_model_all_ready[room_id] = obj8
        // {"Room11":{"syn55698":{"name":"syn55698","model_ready":false,"socket_join_ready":false},"fhrol55698":{"name":"fhrol55698","model_ready":false,"socket_join_ready":false}}}
        console.log("\nWWWWWWWWWW : \n" + JSON.stringify(wait_model_all_ready) + "\n\n")

        // 這邊確定有跑到
        // POST wait_model_all_ready[room_id] : {"syn55698":{"name":"syn55698","ready":false},"fhrol55698":{"name":"fhrol55698","ready":false}}
        //console.log("POST wait_model_all_ready[room_id] : "+JSON.stringify(wait_model_all_ready[room_id]))
        game_enemy[room_id] = Object()

        game_enemy[room_id]["counter"] = 0

    }

    /*
    setTimeout(function(){
        console.log("啟動~~~~")
        endGameBackLobby(obj6["room_id"])
    },10000)
    */
    res.render("game.ejs", {
        inobj: obj6
    })


})


//============================這邊寫 WebScoket 基本設定+監聽訊息
var PORT = 11235;
var SSLPORT = 11237;

var options = {
    key: fs.readFileSync('openssl/server-key.pem'),
    ca: [fs.readFileSync('openssl/cert.pem')],
    cert: fs.readFileSync('openssl/server-cert.pem')
};

var https = require('https').createServer(options, app);
var http = require('http').Server(app);
var io = require('socket.io')(http);

// 回傳創造的 enemy_id
function getCreateEnemyId(enemy_type, faction, room_id) {
    //da = new Date()
    //ds = da.getFullYear()+"-"+da.getMonth()+"-"+da.getDay()+" "+da.getHours()+":"+da.getMinutes()+":"+da.getSeconds()+":"+da.getMilliseconds()
    //ds = "enemy_"+enemy_type+"_"+faction+"_"+ds
    ds = "enemy-" + game_enemy[room_id]["counter"]
    game_enemy[room_id]["counter"] = game_enemy[room_id]["counter"] + 1
    // "enemy-A-12"
    return ds
}


// check 每間房間，如果使用者都準備好了，發送訊息說要開始遊戲
function checkAllRoom() {
    rooms_sql = "select * from PlayRooms where playing_room_id IS NULL"
    out2 = Object()
    usedb(rooms_sql, out2)
    //console.log("SSSS")
    if (out2["res"].length != 0) {
        rooms = out2["res"]
        for (i in rooms) {
            room = rooms[i]
            all_ready = false
            one_user = false // 至少有一個使用者
            join_room_user = JSON.parse(room["join_room_user_str"])
            join_team = JSON.parse(room["join_team_str"])
            all_user_num = 0 // 統計全部使用者，限制得至少幾個人，才可開始遊戲

            // 其中一隊人數為0，就不會開始遊戲，只有一隊是要玩甚麼www
            if ((join_team[0]["usernum"] == 0) || (join_team[1]["usernum"] == 0)) {
                continue;
            }
            for (user in join_room_user) {
                one_user = true
                if (one_user) {
                    all_ready = true
                }
                if (join_room_user[user]["status"] == false) {
                    all_ready = false
                    break
                }
                all_user_num = all_user_num + 1
            }
            // console.log("DDD : "+room["room_id"]+" , "+room["join_room_user_str"])
            // console.log("DDD : "+all_ready+" , "+room["room_id"]+" , "+room["join_room_user_str"])
            if (all_ready && (all_user_num >= 2)) { // 若已有playing_room_id ，代表在遊戲中了，就不用再進去更新了
                // && (!room["playing_room_id"])
                // 製造 hash ，讓 給每個 玩家的 start_game_hash
                // 在 post 提交到 /game，會檢查 各玩家的start_game_hash，是否跟 自己資料行中的 start_game_hash(未加密) 一樣
                // SQL操作先放到上面，免得操作SQL太頻繁，sqlite 又當機
                UserStartGameHashStr = getHashTypeStr("UserStartGame")








                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()
                ds = UserStartGameHashStr + "_" + room["room_id"] + "_" + ds

                // 'UPDATE Tests SET name="nn1",text="tt1" where id=2;';
                set_user_start_game_hash_sql = "UPDATE Users SET start_game_hash = '" + ds + "' where join_room_id='" + room["room_id"] + "'"
                cc = Object()
                usedb(set_user_start_game_hash_sql, cc)
                //console.log("BBBBB : "+JSON.stringify(cc))


                // 設定 Room 資料行的 Playing id
                /*
                set_room_playing_id = "UPDATE PlayRooms SET playing_room_id = '"+ds+"' where room_id='"+room["room_id"]+"'"
                cc = Object()
                usedb(set_room_playing_id,cc)
                */
                // 對每個客戶端發送消息

                //  wait_model_all_ready[room_id][user]["ready"] = true
                for (user in in_nonPlaying_room[room["room_id"]]) {
                    //console.log("user : "+user)
                    user_socket = in_nonPlaying_room[room["room_id"]][user]
                    obj3 = Object()
                    obj3["event_name"] = "serverInformStartGame"
                    obj3["room_id"] = room["room_id"]
                    obj3["user"] = String(user)
                    obj3["start_game_hash"] = bcrypt.hashSync(ds, 10)
                    user_socket.emit("nonPlayingEvent", obj3)
                    //console.log("GG : "+room["room_id"])
                }

            }
        }
    }
}
setInterval(checkAllRoom, 1500)


// 持續跑，等某間 Room 的所有使用者的 model_ready , socket_join_ready 都是 true，就發送 client_start_game 給這 Room 所有使用者，並刪掉 wait_model_all_ready 這間 Room 的 key
function checkRoomAllUser_ModelSocketReady() {


    for (room_id in wait_model_all_ready) {

        master_user = undefined

        for (user in wait_model_all_ready[room_id]) {

            if (!master_user) {
                master_user = user
            }

            bb = true
            if ((wait_model_all_ready[room_id][user]["model_ready"]) && (wait_model_all_ready[room_id][user]["socket_join_ready"])) {

            } else {
                // 確認，要全部使用者，model 載好 + 寫過 join 後，才可發送 io.emit
                // 不要有的還沒 join 就發射
                bb = false
                break
            }
        }

        if (bb) {

            // 'client_start_game'
            //io.to(room_id).emit('client_start_game',{event_name:"client_start_game"})

            io.to(room_id).emit("CCC", {
                result: "測試"
            })

            // 這句不加，CCC 才能收到
            io.to(room_id).emit("DDD", {
                result: "測試"
            })
            console.log("\n\nGGGGGGGGGGGGG : " + JSON.stringify(wait_model_all_ready) + "\n\n")
            delete wait_model_all_ready[room_id]
            io.to(room_id).emit("client_start_game", {
                event_name: "client_start_game"
            })


            // 設定本Room主導者玩家
            if (!all_playing_room_master[room_id]) {
                all_playing_room_master[room_id] = master_user
            }

            console.log("\n\n設置........ : " + all_playing_room_master[room_id] + " , " + master_user + "\n\n")
        }
    }
}
setInterval(checkRoomAllUser_ModelSocketReady, 100)




var util = require("util")

// 確認一間 Room 的使用者退乾淨後，刪掉這間 room
/*
function checkDelRoom(){

    for(room in in_playing_room){

        vv=""
        bb=false
        try{
            // 當可以成功轉換時，代表底下沒有 socket 物件屬性值了，代表沒有使用者了，可以刪掉這個Room了
            vv= JSON.stringify(in_playing_room[room])
            bb=true
        }catch(e){

        }
        console.log("JJJJJJJJJ : "+util.inspect(in_playing_room[room],{}))
        if(bb){
            delete in_playing_room[room]
            del_room_sql = "delete from PlayRooms where room_id = '"+room+"'"
            usedb(del_room_sql,Object())

            console.log("刪掉Room : "+room)
        }
    }
}
setInterval(checkDelRoom,2000)
*/

io.on('connection', function(socket) {
    /* 下面可寫多個類似這樣的，監聽 由 Client 端觸發的事件 */
    /* 函式引數 msg 即為，從 Client 端傳送的訊息 */

    // 傳輸非遊戲中的事件
    socket.on("nonPlayingEvent", function(msg) {
        // 處理 驗證 註冊請求
        if (msg["event_name"] == "requestRegister") {
            // 防止sql injection，在帳密亂輸入奇怪東西

            if ((!checkEngNum(msg["user"])) || (!checkEngNum(msg["password"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseRegister";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

            //console.log("審核註冊中")
            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length != 0) { // 同帳號已經註冊過了
                console.log("無法註冊")
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseRegister";
                    obj["cause"] = "此帳號已被註冊過，請換帳號註冊"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            } else {


                UserRegisterHashStr = getHashTypeStr("UserRegister")
                //console.log("可以註冊")
                // 可以註冊了
                obj["result"] = "ok";
                obj["event_name"] = "serverResponseRegister";


                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                //ds = "RegisterHash_"+msg["user"]+"_" + ds
                // 改用這個
                // ds=getHashTypeStr("UserRegister")+"_"+msg["user"]+"_" + ds
                ds = UserRegisterHashStr + "_" + msg["user"] + "_" + ds


                //console.log("teim : "+ds)
                //registerNonHash
                out2 = Object()
                add_user_sql = "INSERT INTO RegisterHashs (user,nonHash) VALUES ('" + msg["user"] + "','" + ds + "');"
                usedb(add_user_sql, out2)

                //console.log("teim : "+out2["res"])
                obj["registerHash"] = bcrypt.hashSync(ds, 10)
                //console.log("2可以註冊")
                socket.emit("nonPlayingEvent", obj)
            }
        }
        // 通知斷線，省連線資源
        else if (msg["event_name"] == "callForDisconnect") {
            socket.disconnect()
        }
        // 處理 驗證 登入請求
        else if (msg["event_name"] == "requestLogin") {

            // 防止sql injection，在帳密亂輸入奇怪東西
            if ((!checkEngNum(msg["user"])) || (!checkEngNum(msg["password"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogin";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定此帳號已註冊過，往下檢查密碼
                UserLoginHashStr = getHashTypeStr("UserLogin")
                // 檢查密碼 ，是否正確
                loginUser = out["res"][0]
                vv = bcrypt.compareSync(msg["password"], loginUser["password"])

                // 密碼錯了，就會在這裡被檔，無法離開 if 往下走
                if (!vv) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLogin";
                        obj["cause"] = "密碼錯誤，請重新輸入"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                // !!!重點!! 檢查是否已經登入，已經登入就檔掉
                if (loginUser["hasLogin"]) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLogin";
                        obj["cause"] = "該使用者已經在其他分頁登入，不可再次登入"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //console.log("繼續往下走")

                // 來製造 loginHash 字串囉
                obj["result"] = "ok";
                obj["event_name"] = "serverResponseLogin";


                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                // 注意，在上面有寫  UserLoginHashStr=getHashTypeStr("UserLogin") ，記得在上面先寫好，太頻繁操作DB，sqlite 會當掉

                ds = UserLoginHashStr + "_" + msg["user"] + "_" + ds

                //console.log("CCCCC : "+getHashTypeStr("UserLogin"))
                //update_sql = 'UPDATE Tests SET name="nn1",text="tt1" where id=2;';
                update_user_loginHash_sql = "UPDATE Users SET login_hash='" + ds + "' where id=" + loginUser["id"] + ";";

                usedb(update_user_loginHash_sql, Object())
                obj["loginHash"] = bcrypt.hashSync(ds, 10)
                socket.emit("nonPlayingEvent", obj)
                //console.log("繼續往下走")

            } else { // 此帳號未註冊過，無法登入
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogin";
                    obj["cause"] = "此帳號未註冊，請先註冊"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }

            }
        }
        // 定時檢查，是否還在線上
        else if (msg["event_name"] == "checkOnline") {
            //console.log("A Momitor "+msg["user"]+" --")
            // console.log("PPP : "+msg["user"])
            if (all_player_monitor[msg["user"]]) {
                if (!(all_player_monitor[msg["user"]]["record"] === undefined)) {
                    obj = Object()
                    sql = "select * from Users where name='" + String(msg["user"]) + "';";
                    usedb(sql, obj)

                    // 一樣，必須不在遊戲中，才能動手
                    if ((!obj["res"]["isPlaying"]) && (!(obj["res"]["hasLogin"] === false))) {
                        all_player_monitor[msg["user"]]["record"] = all_player_monitor[msg["user"]]["record"] - 1
                    }
                    console.log("B Monitor " + msg["user"] + " -- , value : " + all_player_monitor[msg["user"]]["record"])
                }
            }
            obj2 = Object()
            sql = "select * from Users where name='" + String(msg["user"]) + "';";
            usedb(sql, obj2)
            if (obj2["res"].length == 1) {
                // 確認玩家是否在線
                user = obj2["res"][0]
                obj3 = new Object()
                if (!user["hasLogin"]) {

                    obj3["isOnline"] = false
                    // 先下手為強
                    // 把使用者的所有在線 + 在地 room 那些全刪了
                    check_offline(user)
                } else {
                    obj3["isOnline"] = true
                }
                //console.log("User Online ["+msg["user"]+"] : "+obj3["isOnline"])
                obj3["event_name"] = "serverResponseCheckOnline"
                socket.emit("nonPlayingEvent", obj3)

            }

            console.log("checkOnline.......")
        }
        // 處理 登出 請求
        else if (msg["event_name"] == "requestLogout") {

            // 防止sql injection，在帳密亂輸入奇怪東西
            if ((!checkEngNum(msg["user"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogout";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定有這個帳號，可繼續進行登出工作

                logoutUser = out["res"][0]

                // 先確認 logoutUser["hasLogin"] 為 1 (true) 即可，logoutUser["logout_hash"] 可不管
                //console.log('logoutUser["hasLogin"] : '+logoutUser["hasLogin"])
                //console.log('logoutUser["logout_hash"] : '+logoutUser["logout_hash"])

                if (!logoutUser["hasLogin"]) { // 代表未登入
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLogout";
                        obj["cause"] = "此帳號未登入，無法進行登出動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }


                // 更新 logout_hash
                //console.log("繼續")
                UserLogoutHashStr = getHashTypeStr("UserLogout")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserLogoutHashStr + "_" + msg["user"] + "_" + ds


                // 更新 logout_hash (未加密的)
                update_user_logoutHash_sql = "UPDATE Users SET logout_hash='" + ds + "' where id=" + logoutUser["id"] + ";";
                usedb(update_user_logoutHash_sql, Object())


                obj["result"] = "ok";
                obj["event_name"] = "serverResponseLogout";
                obj["logoutHash"] = bcrypt.hashSync(ds, 10)

                socket.emit("nonPlayingEvent", obj)


            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogout";
                    obj["cause"] = "此帳號未註冊，無法進行登出動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
        }
        // 處理，定時更新現有Room請求
        else if (msg["event_name"] == "requestRoom") {

            // SELECT * FROM COMPANY LIMIT 3 OFFSET 2
            page = msg["page"]
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (page - 1) * 8 + ";"
            obj = Object()
            usedb(sqlstr, obj)
            //console.log("測試..... XXXX  "+JSON.stringify(obj["res"]))

            // 檢查有無下一頁按鈕
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (page) * 8 + ";"
            obj2 = Object()
            usedb(sqlstr, obj2)

            // 長度!=0，代表下一頁有東西
            hasNextPage = (obj2["res"].length != 0)
            socket.emit("nonPlayingEvent", {
                event_name: "serverResponseRoom",
                rooms: obj["res"],
                page: page,
                hasNextPage: hasNextPage
            })
        }
        // 處理 開新房間 請求
        else if (msg["event_name"] == "requestCreateRoom") {
            //console.log("繼續")
            // 防止sql injection，在帳密亂輸入奇怪東西
            if ((!checkEngNum(msg["user"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseCreateRoom";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定有這個帳號，可繼續進行 開新房間 動作


                createRoomUser = out["res"][0]
                if (!createRoomUser["hasLogin"]) { // 代表未登入，無法進行 開新房間 動作
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseCreateRoom";
                        obj["cause"] = "此帳號未登入，無法進行開新房間動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }
                // 新增使用者的 create_room_hash

                UserCreateRoomHashStr = getHashTypeStr("UserCreateRoom")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserCreateRoomHashStr + "_" + msg["user"] + "_" + ds

                // 更新 logout_hash (未加密的)
                update_user_createRoomHash_sql = "UPDATE Users SET create_room_hash='" + ds + "' where id=" + createRoomUser["id"] + ";";

                usedb(update_user_createRoomHash_sql, Object())
                //console.log("---------------- : "+JSON.stringify(obj2))

                obj["result"] = "ok";
                obj["event_name"] = "serverResponseCreateRoom";
                obj["createRoomHash"] = bcrypt.hashSync(ds, 10)

                socket.emit("nonPlayingEvent", obj)
            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseCreateRoom";
                    obj["cause"] = "此帳號未註冊，無法進行開新房間動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }




        }
        //"serverResponseRoom"
        // 處理 遊戲大廳 換頁請求 >> 這個就不多走一層 post 了，懶了
        else if (msg["event_name"] == "requestAnotherPage") {
            if ((!checkEngNum(msg["way"])) || (!checkEngNum(String(msg["newpage"])))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseAnotherPage";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

            // 不是上一頁，也不是下一頁
            waystr = msg["way"]
            if (!((msg["way"] == "next") || (msg["way"] == "last"))) {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseAnotherPage";
                    obj["cause"] = "資訊錯誤"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
                return
            }

            cc = ""
            if (msg["way"] == "next") {
                cc = "下"
            } else if (msg["way"] == "last") {
                cc = "上"
            } else {

            }
            newpage = msg["newpage"]
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (newpage - 1) * 8 + ";"
            obj = Object()
            usedb(sqlstr, obj)

            if (obj["res"].length == 0) { // 新的一頁沒房間了
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseAnotherPage";


                    obj["cause"] = (cc + "一頁無其他房間")
                    obj["way"] = msg["way"] // 傳回去，更新按鈕顯示
                    obj["newpage"] = msg["newpage"]
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
                return
            }


            obj["result"] = "ok";
            obj["event_name"] = "serverResponseAnotherPage";
            obj["way"] = msg["way"] // 傳回去，更新按鈕顯示
            obj["newpage"] = msg["newpage"]
            obj["newrooms"] = obj["res"]

            // 確認是否有上一頁按鈕
            if (newpage == 1) { // 在第一頁，就不會有上一頁按鈕
                obj["hasLastPage"] = false
            } else {
                obj["hasLastPage"] = true
            }

            // 確認是否有下一頁按鈕
            // 檢查有無下一頁按鈕
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (newpage) * 8 + ";"
            obj2 = Object()
            usedb(sqlstr, obj2)

            // 長度!=0，代表下一頁有東西
            obj["hasNextPage"] = (obj2["res"].length != 0)


            socket.emit("nonPlayingEvent", obj)

        }
        // 處理，加入 room 請求
        else if (msg["event_name"] == "requestJoinRoom") {
            if ((!checkEngNum(msg["user"])) || (!checkEngNum(String(msg["room_name"])))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseJoinRoom";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

            // 先測試一下是否人滿了
            team_id = getJoinTeamId(msg["room_name"])

            // 代表人滿了不給加
            if (team_id == -1) {
                //console.log("測試用")

                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseJoinRoom";
                    obj["cause"] = "此房間人數已滿，無法再加入"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
                return
            }

            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定有這個帳號，可繼續加入房間動作

                joinRoomUser = out["res"][0]
                if (!joinRoomUser["hasLogin"]) { // 代表未登入，無法進行 加入房間動作
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseJoinRoom";
                        obj["cause"] = "此帳號未登入，無法進行加入房間動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                // 重要，確認這間房間存在 & 沒在遊戲中
                check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(msg["room_name"]) + "';"
                obj3 = Object()
                usedb(check_room_can_join, obj3)
                if (obj3["res"].length == 0) { // 被擋
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseJoinRoom";
                        obj["cause"] = "此遊戲房間不存在，或是遊戲中，無法加入"
                        console.log("檢查遊戲房間是否可加入，被擋")
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //開始產生使用者的 join_room_hash
                UserJoinRoomHashStr = getHashTypeStr("UserJoinRoom")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserJoinRoomHashStr + "_" + msg["user"] + "_" + ds

                // 更新 logout_hash (未加密的)
                update_user_joinRoomHash_sql = "UPDATE Users SET join_room_hash='" + ds + "' where id=" + joinRoomUser["id"] + ";";

                usedb(update_user_joinRoomHash_sql, Object())
                //console.log("---------------- : "+JSON.stringify(obj2))

                obj["result"] = "ok";
                obj["event_name"] = "serverResponseJoinRoom";
                obj["joinRoomHash"] = bcrypt.hashSync(ds, 10)


                obj["user"] = String(msg["user"])
                obj["join_room_id"] = msg["room_name"]
                //console.log("到這邊--允許加入Room")
                socket.emit("nonPlayingEvent", obj)

            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseJoinRoom";
                    obj["cause"] = "此帳號未註冊，無法進行加入房間動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
        }

        // 處理，leave room 請求
        else if (msg["event_name"] == "requestLeaveRoom") {
            //console.log("V1")


            if ((!checkEngNum(msg["user"])) || (!checkEngNum(String(msg["room_id"])))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLeaveRoom";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定有這個帳號，可繼續退出房間動作

                leaveRoomUser = out["res"][0]
                if (!leaveRoomUser["hasLogin"]) { // 代表未登入，無法進行 退出房間動作
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLeaveRoom";
                        obj["cause"] = "此帳號未登入，無法進行離開房間動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                // 重要，確認這間房間存在 & 沒在遊戲中
                check_room_can_leave = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(msg["room_id"]) + "';"
                obj3 = Object()
                usedb(check_room_can_leave, obj3)
                if (obj3["res"].length == 0) { // 被擋
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLeaveRoom";
                        obj["cause"] = "此遊戲房間不存在，或是遊戲中，無法退出房間"
                        //console.log("檢查遊戲房間是否可加入，被擋")
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                // 重要，使用者已加入這房間，才能進行退房動作，檢查 Room 的 join_room_user_str
                troom = obj3["res"][0]
                troom_user_str = troom["join_room_user_str"]
                troom_user = JSON.parse(troom_user_str)
                if (!troom_user[leaveRoomUser["name"]]) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseLeaveRoom";
                        obj["cause"] = "使用者未加入房間，無法進行退出房間動作"
                        //console.log("檢查遊戲房間是否可加入，被擋")
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }


                //console.log("V2")
                //開始產生使用者的 join_room_hash
                UserLeaveRoomHashStr = getHashTypeStr("UserLeaveRoom")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserLeaveRoomHashStr + "_" + msg["user"] + "_" + ds


                // 更新 leave_room_hash (未加密的)
                update_user_leaveRoomHash_sql = "UPDATE Users SET leave_room_hash='" + ds + "' where id=" + leaveRoomUser["id"] + ";";

                usedb(update_user_leaveRoomHash_sql, Object())
                //console.log("---------------- : "+JSON.stringify(obj2))
                //console.log("V3")
                obj["result"] = "ok";
                obj["event_name"] = "serverResponseLeaveRoom";
                obj["leaveRoomHash"] = bcrypt.hashSync(ds, 10)


                obj["user"] = String(msg["user"])
                obj["leave_room_id"] = msg["room_id"]
                //console.log("到這邊--允許加入Room")
                socket.emit("nonPlayingEvent", obj)
                //console.log("V4")
            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLeaveRoom";
                    obj["cause"] = "此帳號未註冊，無法進行離開房間動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
        } else if (msg["event_name"] == "checkRoomExist") { // 回傳 room 是否還在
            check_room_exist_sql = "select * from PlayRooms where room_id='" + msg["room_id"] + "'"
            obj = Object()
            obj2 = Object()
            usedb(check_room_exist_sql, obj)
            //console.log("Room Exist : "+obj["res"].length)
            //obj2["room_exist"] = (obj["res"].length == 1)
            obj2["room_exist"] = obj["res"].length
            obj2["room_id"] = msg["room_id"]
            obj2["event_name"] = "serverResponseCheckRoomExist"
            socket.emit("nonPlayingEvent", obj2)
        } else if (msg["event_name"] == "requestRenewRoomUser") {
            //console.log("這邊這邊~")
            obj = Object()
            room_sql = "select * from PlayRooms where room_id ='" + msg["room_id"] + "'"
            usedb(room_sql, obj)
            if (obj["res"].length == 1) {
                room = obj["res"][0]
                join_room_user = JSON.parse(room["join_room_user_str"])
                obj2 = Object()
                obj2["join_room_user"] = join_room_user
                obj2["event_name"] = "serverResponseRenewRoomUser"
                obj2["room_id"] = msg["room_id"]
                socket.emit("nonPlayingEvent", obj2)
            }

        }
        // 處理 換 room 請求
        else if (msg["event_name"] == "requestUserChangeTeam") {
            // 防止 sql injection
            // {"event_name":"requestUserChangeTeam","new_team_id":2,"room_id":"Room11"}
            //console.log(JSON.stringify(msg))
            if ((!checkEngNum(msg["user"])) || (!checkEngNum(String(msg["new_team_id"]))) || (!checkEngNum(String(msg["room_id"])))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseUserChangeTeam";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            if (out["res"].length == 1) { // 確定有這個帳號，可繼續加入房間動作

                changeTeamUser = out["res"][0]
                if (!changeTeamUser["hasLogin"]) { // 代表未登入，無法進行 加入房間動作
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseUserChangeTeam";
                        obj["cause"] = "此帳號未登入，無法進行換隊伍動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }


                // 重要，確認這間房間存在 & 沒在遊戲中
                check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(msg["room_id"]) + "';"
                obj3 = Object()
                usedb(check_room_can_join, obj3)
                if (obj3["res"].length == 0) { // 被擋
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseUserChangeTeam";
                        obj["cause"] = "此遊戲房間不存在，或是遊戲中，無法進行換隊伍動作"
                        //console.log("檢查遊戲房間是否可加入，被擋")
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }
                //

                //開始產生使用者的 change_team_hash
                UserChangeTeamHashStr = getHashTypeStr("UserChangeTeam")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserChangeTeamHashStr + "_" + msg["user"] + "_" + ds

                // 更新 logout_hash (未加密的)
                update_user_changeTeamHash_sql = "UPDATE Users SET change_team_hash='" + ds + "' where id=" + changeTeamUser["id"] + ";";

                usedb(update_user_changeTeamHash_sql, Object())
                //console.log("---------------- : "+JSON.stringify(obj2))

                obj["result"] = "ok";
                obj["event_name"] = "serverResponseUserChangeTeam";
                obj["changeTeamHash"] = bcrypt.hashSync(ds, 10)


                obj["user"] = String(msg["user"])
                obj["room_id"] = msg["room_id"]
                obj["new_team_id"] = msg["new_team_id"]
                //console.log("到這邊--允許加入Room")
                socket.emit("nonPlayingEvent", obj)
            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseUserChangeTeam";
                    obj["cause"] = "此帳號未註冊，無法進行換隊伍動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


        }
        // 處理，使用者想切換準備 ready 狀態
        else if (msg["event_name"] == "requestUserChangeReady") {
            //console.log("這邊~~: \n"+JSON.stringify(msg))

            // 防止 sql injection
            if ((!checkEngNum(msg["user"])) || (!checkEngNum(String(msg["new_ready_id"]))) || (!checkEngNum(String(msg["room_id"])))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseUserChangeReady";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


            // 確認有這使用者在，才可繼續動作
            out = Object()
            sqlstr = "select * from Users where name = '" + String(msg["user"]) + "';"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            if (out["res"].length == 1) {


                //console.log("A2")
                changeReadyUser = out["res"][0]
                if (!changeReadyUser["hasLogin"]) { // 代表未登入，無法進行 加入變換準備狀態動作
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseUserChangeTeam";
                        obj["cause"] = "此帳號未登入，無法進行換隊伍動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //console.log("A3")

                // 重要，確認這間房間存在 & 沒在遊戲中
                check_room_can_join = "select * from PlayRooms where playing_room_id IS NULL and room_id = '" + String(msg["room_id"]) + "';"
                obj3 = Object()
                usedb(check_room_can_join, obj3)
                if (obj3["res"].length == 0) { // 被擋
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseUserChangeReady";
                        obj["cause"] = "此遊戲房間不存在，或是遊戲中，無法進行變換準備狀態動作"
                        //console.log("檢查遊戲房間是否可加入，被擋")
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //console.log("這邊~~: \n"+JSON.stringify(msg))


                //開始產生使用者的 change_team_hash
                UserChangeReadyHashStr = getHashTypeStr("UserChangeReady")

                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()

                ds = UserChangeReadyHashStr + "_" + msg["user"] + "_" + ds

                // 更新 logout_hash (未加密的)
                update_user_changeReadyHash_sql = "UPDATE Users SET change_ready_hash='" + ds + "' where id=" + changeReadyUser["id"] + ";";

                usedb(update_user_changeReadyHash_sql, Object())
                //console.log("---------------- : "+JSON.stringify(obj2))

                obj["result"] = "ok";
                obj["event_name"] = "serverResponseUserChangeReady";
                obj["changeTeamHash"] = bcrypt.hashSync(ds, 10)


                obj["user"] = String(msg["user"])
                obj["room_id"] = msg["room_id"]
                obj["new_ready_id"] = msg["new_ready_id"]
                //console.log("到這邊--允許加入Room")
                socket.emit("nonPlayingEvent", obj)
                //console.log("這邊~~: \n"+JSON.stringify(msg))
            } else {
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseUserChangeReady";
                    obj["cause"] = "此帳號未註冊，無法進行變換準備狀態動作"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

        }
        // 測試，可偵測到Room被刪除，成功
        else if (msg["event_name"] == "test") {
            del = "delete from PlayRooms where room_id='" + msg["room_id"] + "'"
            console.log("test : " + del)
            obj = Object()
            usedb(del, obj)
            console.log("EE : " + JSON.stringify(obj["res"]))
        }
        // 測試，可偵測到使用者被登出
        else if (msg["event_name"] == "test2") {

            //console.log("EEEEEEEEEEEEEEEEEE")
            user_sql = "select * from Users where name='" + msg["user"] + "'"
            obj = Object()
            usedb(user_sql, obj)
            if (obj["res"].length == 1) {
                user = obj["res"][0]
                let_user_logout = "UPDATE Users SET hasLogin = 0 where id=" + user["id"] + ";";
                usedb(let_user_logout, Object())
            }
        } else if (msg["event_name"] == "requestAdminLogin") {
            //console.log("C1")
            // 防止sql injection，在帳密亂輸入奇怪東西
            if ((!checkEngNum(msg["admin"])) || (!checkEngNum(msg["password"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseAdminLogin";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
            //console.log("C2")
            out = Object()
            // 加上限制，要取 有管理員 權限的
            sqlstr = "select * from Users where name = '" + String(msg["admin"]) + "' and isAdmin = 1 ;"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定此帳號已註冊過，往下檢查密碼
                AdminLoginHashStr = getHashTypeStr("AdminLogin")
                // 檢查密碼 ，是否正確
                loginAdmin = out["res"][0]
                vv = bcrypt.compareSync(msg["password"], loginAdmin["password"])
                //console.log("C3")
                // 密碼錯了，就會在這裡被檔，無法離開 if 往下走
                if (!vv) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseAdminLogin";
                        obj["cause"] = "密碼錯誤，請重新輸入"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                // !!!重點!! 檢查是否已經登入，已經登入就檔掉
                if (loginAdmin["hasLogin"]) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseAdminLogin";
                        obj["cause"] = "該管理者已經在其他分頁登入，不可再次登入"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //console.log("繼續往下走")

                // 來製造 loginHash 字串囉



                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()


                ds = AdminLoginHashStr + "_" + msg["admin"] + "_" + ds
                //console.log("CCCCC : "+getHashTypeStr("UserLogin"))
                //update_sql = 'UPDATE Tests SET name="nn1",text="tt1" where id=2;';

                // 在 admin login hash 插入資料行
                add_admin_loginHash_sql = "INSERT INTO AdminLoginHashs (admin,nonHash) VALUES ('" + msg["admin"] + "','" + ds + "');"

                usedb(add_admin_loginHash_sql, Object())
                obj["adminLoginHash"] = bcrypt.hashSync(ds, 10)
                obj["admin"] = msg["admin"]
                obj["result"] = "ok";
                obj["event_name"] = "serverResponseAdminLogin";
                socket.emit("nonPlayingEvent", obj)
                //console.log("繼續往下走")

            } else { // 此帳號未註冊過，無法登入
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogin";
                    obj["cause"] = "此帳號未註冊，請先註冊"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }

            }

        }
        // e
        else if (msg["event_name"] == "requestAdminLogout") {
            if ((!checkEngNum(msg["admin"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseAdminLogout";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }
            //console.log("C2")
            out = Object()
            // 加上限制，要取 有管理員 權限的
            sqlstr = "select * from Users where name = '" + String(msg["admin"]) + "' and isAdmin = 1 ;"
            //console.log("sqlstr : "+sqlstr)
            usedb(sqlstr, out)
            obj = Object()
            // 此時 out["res"] 為陣列
            if (out["res"].length == 1) { // 確定此帳號已註冊過，往下檢查密碼
                AdminLogoutHashStr = getHashTypeStr("AdminLogout")
                // 檢查密碼 ，是否正確
                logoutAdmin = out["res"][0]


                // !!!重點!! 檢查是否已經登入，未登入就檔掉，未登入無法登出
                if (!logoutAdmin["hasLogin"]) {
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseAdminLogout";
                        obj["cause"] = "該管理者未登入，無法進行登出動作"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }
                    return
                }

                //console.log("繼續往下走")

                // 來製造 loginHash 字串囉



                da = new Date()
                ds = da.getFullYear() + "-" + da.getMonth() + "-" + da.getDay() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds() + ":" + da.getMilliseconds()


                ds = AdminLogoutHashStr + "_" + msg["admin"] + "_" + ds
                //console.log("CCCCC : "+getHashTypeStr("UserLogin"))
                //update_sql = 'UPDATE Tests SET name="nn1",text="tt1" where id=2;';

                // 在 admin login hash 插入資料行
                add_admin_logoutHash_sql = "INSERT INTO AdminLogoutHashs (admin,nonHash) VALUES ('" + msg["admin"] + "','" + ds + "');"

                usedb(add_admin_logoutHash_sql, Object())
                obj["adminLogoutHash"] = bcrypt.hashSync(ds, 10)
                obj["admin"] = msg["admin"]
                obj["result"] = "ok";
                obj["event_name"] = "serverResponseAdminLogout";
                socket.emit("nonPlayingEvent", obj)
                //console.log("繼續往下走")

            } else { // 此帳號未註冊過，無法登入
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseLogout";
                    obj["cause"] = "此帳號未註冊，請先註冊"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }

            }
        } else if (msg["event_name"] == "request_informAddRoom") {
            room_id = msg["room_id"]
            //console.log("A1 : "+JSON.stringify(msg))



            room_sql = "select * from PlayRooms where room_id='" + room_id + "' and playing_room_id IS NULL"
            out2 = Object()
            usedb(room_sql, out2)

            if (out2["res"].length != 1) {
                //console.log("A3 : "+JSON.stringify(out2["res"][0]))
                return

            }
            room = out2["res"][0]


            if (!in_nonPlaying_room[room_id]) {
                // 如果這間房間不存在 或是在遊戲中，就直接跳掉，這是來亂的
                //console.log("A2")

                //console.log("A344 : "+JSON.stringify(out2["res"][0]))



                in_nonPlaying_room[room_id] = Object()
            }
            //console.log("A4")
            if (!in_nonPlaying_room[room_id][msg["user"]]) {
                // 先檢查玩家是否存在 and 以登入 and 未在遊戲中
                // console.log("A5")
                user_sql = "select * from Users where name = '" + msg["user"] + "' "
                // console.log("CCC : "+JSON.stringify(user))
                out3 = Object()
                usedb(user_sql, out3)
                //console.log("CCC : "+JSON.stringify(out3["res"]))
                if (out3["res"].length != 1) {
                    //console.log("A6")
                    return
                }
                // 取得 User socket 物件，可對 User 發送訊息說要開始遊戲
                in_nonPlaying_room[room_id][msg["user"]] = socket
                //console.log("V6 : "+msg["user"])
            }
            //console.log("V7")
        } else if (msg["event_name"] == "model_ready") {



            user = msg["user"]
            room_id = msg["room_id"]


            obj["room_id"] = room_id
            obj["user"] = user

            // {name:user , ready:false}
            if (!wait_model_all_ready[room_id]) {
                // 代表已經model readt + socket join ready，wait_model_all_ready[room_id] 已經被刪掉了，所以不用再檢查了
                console.log("\nmodel_ready圓滿落幕囉~~ : " + JSON.stringify(msg) + "\n")
                return
            }

            wait_model_all_ready[room_id][user]["model_ready"] = true
            //console.log("這邊~~~~")

            //console.log("\nmodel ready : \n"+JSON.stringify(msg)+"\n")
            //console.log("room id : "+room_id+" , user : "+user)
            //console.log("\n3290  wait_model_all_ready[room_id] : "+JSON.stringify( wait_model_all_ready[room_id])+"\n")


            // 以下這段，移到 checkRoomAllUser_ModelSocketReady 函式，定時會檢查
            /*
             bb = true
             for(user in wait_model_all_ready[room_id]){
                 if(  (wait_model_all_ready[room_id][user]["model_ready"]) && (wait_model_all_ready[room_id][user]["socket_join_ready"])  ){

                 }else{
                     // 確認，要全部使用者，model 載好 + 寫過 join 後，才可發送 io.emit
                     // 不要有的還沒 join 就發射
                     bb=false
                     break
                 }
             }

             if(bb){


                // 'client_start_game'
                //io.to(room_id).emit('client_start_game',{event_name:"client_start_game"})

                io.to(room_id).emit("CCC",{result:"測試"})

                // 這句不加，CCC 才能收到
                io.to(room_id).emit("DDD",{result:"測試"})
                console.log("\n\nGGGGGGGGGGGGG : "+JSON.stringify(wait_model_all_ready)+"\n\n")
                 delete wait_model_all_ready[room_id]
                 io.to(room_id).emit("client_start_game",{event_name:"client_start_game"})
             }

             */


        }
    })


    // 主導玩家的事件 : all_playing_room_master[room_id] ，enemy-be-attacked , castle-be-attacked , wave-spawner-request-spawn-enemy
    // 傳輸遊戲中的事件
    socket.on("playingEvent", function(msg) {
        //console.log('\n\nLLLL Receive clietn request, event name: ' + JSON.stringify(msg)+"\n\n");
        if (msg["event_name"] == "enemy_be_attacked") {

            //if(msg["user"]==all_playing_room_master[room_id]){
            //console.log("A1 yes : "+msg["user"])
            obj = msg
            obj["event_name"] = "enemy_get_damaged"
            io.to(msg["room_id"]).emit("playingEvent", obj)
            /*
            }else{
                console.log("A1 no : "+msg["user"])
            }
            */
        } else if (msg["event_name"] == "castle_be_attacked") {
            //if(msg["user"]==all_playing_room_master[room_id]){
            obj = msg
            obj["event_name"] = "castle_get_damaged"
            io.to(msg["room_id"]).emit("playingEvent", obj)
            //console.log("A2 yes : "+msg["user"])
            /*
            }else{
                console.log("A2 no : "+msg["user"])
            }
            */
        } else if (msg["event_name"] == "request_create_tower") {
            obj = msg
            obj["event_name"] = "create_tower_success"
            io.to(msg["room_id"]).emit("playingEvent", obj)
        } else if (msg["event_name"] == "tower_be_attacked") {
            obj = msg
            obj["event_name"] = "tower_get_damaged"
            io.to(msg["room_id"]).emit("playingEvent", obj)
        } else if (msg["event_name"] == "wave_spawner_request_spawn_enemy") {
            //if(msg["user"]==all_playing_room_master[room_id]){
            obj = msg
            obj["enemy_id"] = getCreateEnemyId(obj["enemy_type"], obj["ws_faction"], msg["room_id"])
            obj["event_name"] = "wave_spawner_create_enemy"
            //console.log('SSSS : ' + JSON.stringify(obj));
            io.to(msg["room_id"]).emit("playingEvent", obj)
            //console.log("A3 yes : "+msg["user"])
            /*
            }else{
                console.log("A3 no : "+msg["user"])
            }
            */
        }

        // 接收到，使用者遊戲中

        // 寫 socket.join 的
        else if (msg["event_name"] == "informPlayerOnline") {
            if (!in_playing_room[msg["room_id"]]) {
                in_playing_room[msg["room_id"]] = Object()
            }

            if (!in_playing_room[msg["room_id"]][msg["user"]]) {
                in_playing_room[msg["room_id"]][msg["user"]] = socket


                // 確定有了，修好了
                socket.join(msg["room_id"]) // 把 socket 加入房間
                console.log("SSSS : " + JSON.stringify(wait_model_all_ready) + "\n : " + JSON.stringify(msg) + "\n\n")


                if (wait_model_all_ready[msg["room_id"]]) {
                    wait_model_all_ready[msg["room_id"]][msg["user"]]["socket_join_ready"] = true

                    console.log("\n" + msg["user"] + ".....socket.join room : " + msg["room_id"] + "\n")
                    console.log("CCC : " + JSON.stringify(wait_model_all_ready) + "\n\n")
                }



                //fffff = 'UPDATE Users SET  login_hash = NULL , hasLogin = 1 , isPlaying = 1  , start_game_hash = "vojewjrbvoewjobjojrwebje" where name="'+msg["user"]+'";';
                //console.log("WWWWW : "+fffff)
                //usedb(fffff,Object())
            }

            //console.log("informPlayerOnline PPPP")
            //console.log("CCCC : "+Boolean(in_playing_room[msg["room_id"]][msg["user"]]))

        }


        // 接收到，單一客戶端，說要結束遊戲，傳給所有客戶端知道
        else if (msg["event_name"] == "informEndGame") {
            endGameBackLobby(msg["room_id"], msg["user"], socket)
        }
    })
})
/*

    , "CREATE TABLE IF NOT EXISTS RegisterHashs (id integer PRIMARY KEY AUTOINCREMENT,user char(50) DEFAULT NULL,nonHash char(70) DEFAULT NULL)"
*/

//============================這段寫，Server 伺服器啟動，開始監聽任何連線請求
http.listen(PORT, function() {
    console.log('http listening on *:' + PORT);
});

https.listen(SSLPORT, function() {
    console.log('https listening on *:' + SSLPORT);
});