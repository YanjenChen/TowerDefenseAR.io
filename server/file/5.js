
// 給 page 用的
function isNumber(obj) {
    return ( (typeof obj === 'number') && (!isNaN(obj)) )
}


io.on('connection', function(socket) {
    /* 下面可寫多個類似這樣的，監聽 由 Client 端觸發的事件 */
    /* 函式引數 msg 即為，從 Client 端傳送的訊息 */

    // 傳輸非遊戲中的事件
    socket.on("nonPlayingEvent", function(msg) {
        // 處理 驗證 註冊請求
        // 已加密
        if (msg["event_name"] == "requestRegister") {
            // 防止sql injection，在帳密亂輸入奇怪東西

            if ((!checkEngNum(msg["user"])) || (!checkEngNum(msg["password"]))) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseRegister";
                    //obj["cause"] = "請勿輸入非英文或數字的字元"
                    obj["cause"] = reject_cause["only_num_eng"]

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
        // 已加密
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
        // 已加密
        else if (msg["event_name"] == "checkOnline") {
            //console.log("A Momitor "+msg["user"]+" --")
            // console.log("PPP : "+msg["user"])

            if(
                (!checkEngNum(msg["user"]))

                ){

                    obj = Object()
                    try {
                        obj["result"] = "no";
                        obj["event_name"] = "serverResponseCheckOnline";
                        obj["cause"] = "請勿輸入非英文或數字的字元"
                        socket.emit("nonPlayingEvent", obj)
                        return
                    } catch (e) {
                        // 應該就是網路出錯，就啥動作都不做
                        return
                    }

                }


            if (all_player_monitor[msg["user"]]) {
                if (!(all_player_monitor[msg["user"]]["record"] === undefined)) {
                    obj = Object()
                    sql = "select * from Users where name='" + String(msg["user"]) + "';";
                    usedb(sql, obj)

                    // 一樣，必須不在遊戲中，才能動手
                    if ((!obj["res"]["isPlaying"]) && (!(obj["res"]["hasLogin"] === false))) {
                        all_player_monitor[msg["user"]]["record"] = all_player_monitor[msg["user"]]["record"] - 1
                    }
                    //console.log("B Monitor " + msg["user"] + " -- , value : " + all_player_monitor[msg["user"]]["record"])
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
        // 已加入
        // 處理 登出 請求
        // 已加密
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
        // 已加密。msg["page"] 已用 isNumber 加密
        else if (msg["event_name"] == "requestRoom") {

            // 防止sql injection，在帳密亂輸入奇怪東西
            if (    !isNumber(msg["page"])  ) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseRoom";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }



            // SELECT * FROM COMPANY LIMIT 3 OFFSET 2
            page = msg["page"]
            // 直接用 playing_room_id2 ，免得在 所有玩家進 Room 空隙，又有玩家加入Room 就會當機
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id2 IS NULL and playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (page - 1) * 8 + ";"
            obj = Object()
            usedb(sqlstr, obj)
            //console.log("測試..... XXXX  "+JSON.stringify(obj["res"]))

            // 檢查有無下一頁按鈕
            sqlstr = "SELECT * FROM PlayRooms where playing_room_id2 IS NULL and playing_room_id IS NULL order by id desc LIMIT 8 OFFSET " + (page) * 8 + ";"
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
        // 已加密
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
        // 已加密
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
        // 已加密
        // 處理，加入 room 請求
        // 已改寫成，最多只能讓兩個人在同同一間room，看 2.js 的 getJoinTeamId() 函式
        else if (msg["event_name"] == "requestJoinRoom"){
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
        // 已加密
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
        }
        // 已加密
        else if (msg["event_name"] == "checkRoomExist") { // 回傳 room 是否還在

            if (  (!checkEngNum(String(msg["room_id"])))  ) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseCheckRoomExist";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

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
        // 已加密
        } else if (msg["event_name"] == "requestRenewRoomUser") {
            //console.log("這邊這邊~")

            if (  (!checkEngNum(String(msg["room_id"])))  ) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "serverResponseRenewRoomUser";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


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
        // 已加密
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

        // 已加密
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
                        obj["event_name"] = "serverResponseUserChangeReady";
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
        /*
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
        }
        */

        // 已加密
        // request_informAddRoom 這是從 room wait 頁面的 informAddRoom() 呼叫，幾乎不會失敗
        // 沒有設丟回去可接收的.... obj["event_name"] = "" 就這樣寫了
        else if (msg["event_name"] == "request_informAddRoom") {

            if (  (!checkEngNum(String(msg["room_id"]))) || (!checkEngNum(String(msg["user"])))  ) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = "";
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }


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
        }
        // 已加密
        // 注意，這是由 game.ejs 發出的消息，很少情況會跑到這
        // 至於...被 過濾參數檔..不知道回傳時，event_name 是要寫啥，例如 ... serverResponse_model_ready ......
        // 沒有設丟回去可接收的.... obj["event_name"] = "" 就這樣寫了
        else if (msg["event_name"] == "model_ready") {
            console.log('RECEIVE MODEL READY');

            if (  (!checkEngNum(String(msg["room_id"]))) || (!checkEngNum(String(msg["user"])))  ) {
                obj = Object()
                try {
                    obj["result"] = "no";
                    obj["event_name"] = ""; // 注意，這是由 game.ejs 發出的消息，很少情況會跑到這
                    obj["cause"] = "請勿輸入非英文或數字的字元"
                    socket.emit("nonPlayingEvent", obj)
                    return
                } catch (e) {
                    // 應該就是網路出錯，就啥動作都不做
                    return
                }
            }

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



    /*雙重模式
        1 只開 "wave_spawner_request_spawn_enemy" : 兩邊都可升怪，但是兩邊看到會不同，估計是因為沒把 "enemy_be_attacked" 都雙開，沒讓怪都兩邊消滅
            // PS 主導者怪是完整的，其他的都是少怪
        2 開     "wave_spawner_request_spawn_enemy" , "enemy_be_attacked" : 狀況同第一項
        3 三個都開 : 狀況同第一項

    */

    // 主導玩家的事件 : all_playing_room_master[room_id] ，enemy-be-attacked , castle-be-attacked , wave-spawner-request-spawn-enemy
    // 傳輸遊戲中的事件
    socket.on("playingEvent", function(msg) {
        //console.log('PLAYING EVENT: ' + JSON.stringify(msg) + '\n\n')
        //console.log('\n\nLLLL Receive clietn request, event name: ' + JSON.stringify(msg)+"\n\n");
        if (msg["event_name"] == "enemy_be_attacked") {

            if(msg["user"]==all_playing_room_master[room_id]){

                obj = msg
                obj["event_name"] = "enemy_get_damaged"
                    io.to(msg["room_id"]).emit("playingEvent", obj)
                //console.log("A1 yes : "+msg["user"])
            }else{
                //console.log("A1 no : "+msg["user"])
            }

        } else if (msg["event_name"] == "castle_be_attacked") {
            if(msg["user"]==all_playing_room_master[room_id]){
                obj = msg
                obj["event_name"] = "castle_get_damaged"
                io.to(msg["room_id"]).emit("playingEvent", obj)
                //console.log("A2 yes : "+msg["user"])

            }else{
                //console.log("A2 no : "+msg["user"])
            }

        } else if (msg["event_name"] == "request_create_tower") {
            obj = msg
            obj["event_name"] = "create_tower_success"
            console.log('REQUEST CREATE TOWER: ' + JSON.stringify(obj) + '\n\n')
            io.to(msg["room_id"]).emit("playingEvent", obj)
        } else if (msg["event_name"] == "request_upgrade_tower") {
            obj = msg
            obj["event_name"] = "do_tower_upgrades"
            io.to(msg["room_id"]).emit("playingEvent", obj)
        }else if (msg["event_name"] == "request_remove_tower") {
            obj = msg
            obj["event_name"] = "do_tower_remove"
            io.to(msg["room_id"]).emit("playingEvent", obj)
        }else if (msg["event_name"] == "tower_request_update_target") {
            if(msg["user"]==all_playing_room_master[room_id]){
                obj = msg
                obj["event_name"] = "tower_execute_update_target"
                io.to(msg["room_id"]).emit("playingEvent", obj)
            }else{

            }
        }
         else if (msg["event_name"] == "tower_be_attacked") {

                obj = msg
                obj["event_name"] = "tower_get_damaged"
                io.to(msg["room_id"]).emit("playingEvent", obj)

        } else if (msg["event_name"] == "wave_spawner_request_spawn_enemy") {
            if(msg["user"]==all_playing_room_master[room_id]){
                obj = msg
                console.log('REQUEST SPAWN ENEMY: ' + JSON.stringify(obj) + '\n\n')
                obj["enemy_id"] = getCreateEnemyId(obj["enemy_type"], obj["ws_faction"], msg["room_id"])
                obj["event_name"] = "wave_spawner_create_enemy"
                obj.healthPoint = Math.ceil(obj.time / 60000) * 100;
                obj.reward = Math.ceil(obj.time / 60000) * 5;
                obj.targetCastle = obj.ws_faction == 'RED' ? '#BLACK-castle' : '#RED-castle';

                //this.enemyCounter++;

                //console.log('SSSS : ' + JSON.stringify(obj));
                io.to(msg["room_id"]).emit("playingEvent", obj)
                //console.log("A3 yes : "+msg["user"])

            }else{
               // console.log("A3 no : "+msg["user"])
            }

        } else if (msg["event_name"] == "spawner_request_set_autospawn") {

            obj = msg
            obj["event_name"] = "spawner_execute_set_autospawn"
            io.to(msg["room_id"]).emit("playingEvent", obj)

        }else if (msg["event_name"] == "spawner_request_remove_autospawn") {

            obj = msg
            obj["event_name"] = "spawner_execute_remove_autospawn"
            io.to(msg["room_id"]).emit("playingEvent", obj)

        }else if (msg["event_name"] == "spawner_request_addto_spawnbuffer") {
                obj = msg
                console.log('REQUEST ADD TO BUFFER: ' + JSON.stringify(obj) + '\n\n')
                obj["event_name"] = "spawner_execute_addto_spawnbuffer"

            if(obj.autoSpawn){
                if(msg["user"]==all_playing_room_master[room_id]){
                    io.to(msg["room_id"]).emit("playingEvent", obj)
                }else{

                }

            }else{
                 io.to(msg["room_id"]).emit("playingEvent", obj)

            }
        } else if (msg["event_name"] == "request_update_cash") {
                obj = msg
                obj["event_name"] = "execute_update_cash"

            if(obj.userEmit){
                if(msg["user"]==all_playing_room_master[room_id]){
                    io.to(msg["room_id"]).emit("playingEvent", obj)
                }else{

                }

            }else{
                 io.to(msg["room_id"]).emit("playingEvent", obj)

            }
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
                //console.log("SSSS : " + JSON.stringify(wait_model_all_ready) + "\n : " + JSON.stringify(msg) + "\n\n")


                if (wait_model_all_ready[msg["room_id"]]) {
                    wait_model_all_ready[msg["room_id"]][msg["user"]]["socket_join_ready"] = true

                    console.log("\nReady DDDDD : "+msg["user"]+"\n")
                    //console.log("\n" + msg["user"] + ".....socket.join room : " + msg["room_id"] + "\n")
                    //console.log("CCC : " + JSON.stringify(wait_model_all_ready) + "\n\n")
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


//============================這段寫，Server 伺服器啟動，開始監聽任何連線請求
http.listen(PORT, function() {
    console.log('http listening on *:' + PORT);
});

https.listen(SSLPORT, function() {
    console.log('https listening on *:' + SSLPORT);
});
