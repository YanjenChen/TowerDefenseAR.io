
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

            // 把 all_playing_room_master 內換人

            for(t_room in all_playing_room_master){
                // 抓到這個使用者在的 room
                if(String(t_room)==String(room)){
                    all_playing_room_master[room] = undefined // 先設空
                    for(first_user in in_playing_room[room]){
                        // 走過一次，就 break
                        all_playing_room_master[room] = first_user
                        break
                    }

                }
            }
        }


        // 這邊也要放, playing_room_id = NULL , join_room_id = NULL , isPlaying = 0 ，因為是強制登出步驟
        // team_id  也要寫0，強制退出時
        /*
            "CREATE TABLE IF NOT EXISTS Users (id integer PRIMARY KEY AUTOINCREMENT, name char(50),password char(70),login_hash char(70) DEFAULT NULL, logout_hash char(70) DEFAULT NULL, create_room_hash char(70) DEFAULT NULL, join_room_hash char(70) DEFAULT NULL, leave_room_hash char(70) DEFAULT NULL, change_team_hash char(70) DEFAULT NULL, change_ready_hash char(70) DEFAULT NULL , start_game_hash char(70) DEFAULT NULL, end_game_hash char(70) DEFAULT NULL,isAdmin bit DEFAULT 0, hasLogin bit DEFAULT 0,isPlaying bit DEFAULT 0,join_room_id char(50) DEFAULT NULL,playing_room_id char(70) , team_id integer DEFAULT 0)"
        
        */
        // 把所有 hash 紀錄消除掉
        erase_hasLogin = 'UPDATE Users SET login_hash = NULL , hasLogin = 0 , logout_hash = NULL , create_room_hash = NULL , join_room_hash = NULL , leave_room_hash = NULL , change_team_hash = NULL , change_ready_hash = NULL , start_game_hash = NULL , end_game_hash = NULL , playing_room_id = NULL , join_room_id = NULL , team_id = 0 , isPlaying = 0 where name="' + String(user) + '";';
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

                // 不知為啥，有時會出現 TypeError: Cannot read property 'usernum' of undefined
                // 先確定有，在操作，懶了
                if(join_team[(team_id - 1)]["usernum"]){ 
                    join_team[(team_id - 1)]["usernum"] = join_team[(team_id - 1)]["usernum"] - 1
                    new_join_team_str = JSON.stringify(join_team)

                    new_roomuser_sql = "UPDATE PlayRooms SET " + col + " = '" + new_roomuser_str + "' , join_team_str = '" + new_join_team_str + "' where room_id ='" + room_id + "';";
                    usedb(new_roomuser_sql, Object())
                }else{
                    console.log("\nPPPP 又來了\n")
                }

                //console.log("B4")

                // 當兩隊人數都變0時，把這房間消除掉
                if(
                    (join_team[0]["usernum"] == 0)
                    && 
                    (join_team[0]["usernum"] == 0)
                ){

                    console.log("\n\nB1\n\n")



                    del_room_sql = "delete from PlayRooms where room_id = '" + room_id + "'"
                    usedb(del_room_sql, Object())
                    
                    //delete all_playing_room_master[room_id]
                    
                    // 剩下的一些 Object ，有關 room 的，刪乾淨 。參考 function endGameBackLobby(room_id)
                    // 靠北，第一次跑，三句都開，就丟例外
                    // 測試時，一句句個別開，都沒例外。一起開，也沒例外...這啥狀況...
                    delete in_playing_room[room_id] // 這句安全，不會噴例外
                    delete game_enemy[room_id] // 這句安全，不會噴例外
                    delete all_playing_room_master[room_id] // 這句安全，不會噴例外??
                    
                    console.log("\n\nB2\n\n")
                }
            } else {
                // 使用者不在這房間，就不需進行任何動作
            }

        } else {
            // 注意，若這間房間，沒有任何使用者，就不需做任何動作
        }
    }
}
// 監控玩家在線
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
            // if (all_num >= 6)
            // 改成，最多只能兩人在同一間 room
            if (all_num >= 2) {
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
setInterval(monitor, 2100) // 別直接用1000，有可能會自己被登出 // 原本1050，現在改成 2100
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


// 直接請求，會跳轉到登入頁面