//============================這邊寫 WebScoket 基本設定+監聽訊息
var PORT = 11550;
var SSLPORT = 11552;

// 舊版

var options = {
    key: fs.readFileSync('server/openssl/server-key.pem'),
    ca: [fs.readFileSync('server/openssl/cert.pem')],
    cert: fs.readFileSync('server/openssl/server-cert.pem')
};


// 使用老師的
/*
const key = fs.readFileSync('/home/wp2018/ssl/private.key')
const cert = fs.readFileSync('/home/wp2018/ssl/certificate.crt')

var opt = {
  key: key,
  cert: cert
}
*/
// 使用老師的 ssl key
var https = require('https').createServer(options, app);
//var https = require('https').createServer(opt, app);
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
        bb = true
        for (user in wait_model_all_ready[room_id]) {

            if(!master_user){
                master_user = user
            }
            // 這個應該放外面啦
            //bb = true
            if ((wait_model_all_ready[room_id][user]["model_ready"]) && (wait_model_all_ready[room_id][user]["socket_join_ready"])) {

            } else {
                // 確認，要全部使用者，model 載好 + 寫過 join 後，才可發送 io.emit
                // 不要有的還沒 join 就發射
                bb = false
                break
            }
        }
        console.log("\nReady : room_id : "+room_id+" , bb : "+bb)

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

            //

            //this.sceneEl.emit('client_start_game'); 

            io.to(room_id).emit("client_start_game", {
                event_name: "client_start_game"
            })


            // 設定本Room主導者玩家
            if(!all_playing_room_master[room_id]){
                all_playing_room_master[room_id] = master_user
            }

            // 將遊戲設為遊戲中
            set_room_playing = 'UPDATE PlayRooms SET  playing_room_id = "'+room_id+'" where room_id = "' + room_id + '";';
            usedb(set_room_playing, Object())

            console.log("\n\n設置........ : "+all_playing_room_master[room_id]+" , "+master_user+"\n\n")
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

reject_cause = Object()
reject_cause["only_num_eng"] = "Please input only number and english char"
reject_cause["has_been_registered"] = ""