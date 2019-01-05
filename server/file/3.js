
from_logout=false
from_logout_user = undefined
app.get("/", function(req, res) {
    //console.log("A1")
    from_logout_in = false
    from_logout_user_in = undefined
    if(from_logout){
        from_logout_in = true
        from_logout_user_in = from_logout_user
        from_logout=false
        from_logout_user = undefined
    }

    res.render("home.ejs", {from_logout:from_logout_in,from_logout_user:from_logout_user_in})
    //res.render("aboutUs.ejs",{from_logout:from_logout_in,from_logout_user:from_logout_user_in})
    //res.redirect(301, "/login")
})

// 進入 Register 註冊頁面
/*
app.get("/register", function(req, res) {
    res.render("registerForm.ejs", {})
})
*/

// test

app.get("/test",function(req, res){
    /*
     res.render("room_wait_v2.ejs", {

          user: "test_user",
        room_id: "test_room"
     })
    */     

     res.render("figure2.ejs", {})
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
    //res.send("<script>alert('註冊成功，請重新登入');location.href='/login'</script>")
    //res.send("<script>alert('註冊成功，請重新登入');location.href='/test';</script>")

    // 取消跳轉
    res.send(JSON.stringify({success:true}))
})

// /login，登入頁面

app.get("/login", function(req, res) {
    
    //res.render("loginForm.ejs", {inobj:obj10})
    res.redirect(301, "/")
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


        /*
        res.render("room_lobby.ejs", {
            username: user
        })
        */

        res.render("room_lobby_v3.ejs", {
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

        /*
        res.render("room_lobby.ejs", {
            username: req.body["leaveRoomUser"]
        })
        */
        console.log("\nCCCCCC\n")
         res.render("room_lobby_v3.ejs", {
             from_login:false,
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
        res.render("room_lobby_v3.ejs", {
              from_login:false,
            username: endGameUser["name"]
        })
        return

    }

    console.log("\nDDDDD\n")
    
    // 煩死了，這邊一直丟例外，直接用這招啦
    if(
        (!req.body["loginName"]) || 
        (!req.body["loginPass"]) || 
        (!req.body["loginHash"])
    ){
        res.redirect(301, "/login")
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
    all_player_monitor[req.body["loginName"]]["record"] = -10 // 以防萬一

    // 顯示 room_lobby.ejs ，還沒寫
    //res.send("<script>alert('登入成功');location.href='/login'</script>")
    
    /*
    res.render("room_lobby.ejs", {
        username: req.body["loginName"]
    })
    */
    console.log("\n\nWWWWWWWW : "+req.body["loginName"]+"\n")
     res.render("room_lobby_v3.ejs", {
        from_login:true,
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

    //res.send("<script>alert('登出成功');location.href='/login';</script>")
    //res.send({success:true})
    from_logout = true
    from_logout_user = logoutUser["name"]
    res.redirect(301,"/")
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
    
    /*
    res.render("room_wait.ejs", {
        user: req.body["joinRoomName"],
        room_id: join_room_id
    })
    */

    // "room_wait_v2.ejs"
    res.render("room_wait_v3_one_vs_one.ejs", {
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
/*
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
    
    //clear_loginUser_loginHash = 'UPDATE Users SET logout_hash = NULL , hasLogin = 0 where id='+logoutUser["id"]+';';
    //usedb(clear_loginUser_loginHash,Object())
    

    res.send("<script>alert('登出成功');location.href='/monitor';</script>")

})

*/
/*
app.get("/cccc", function(req, res) {
    res.render("demo.ejs", {})
})
*/
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


    // 更新遊戲 Room 的 playing room id ，先設成自己的就好，代表已經開始遊戲
    // 注意，第一個玩家用了這個，接著 playing_room_id 非空，其他玩家檢查到，就會被跳出
    // 所以要寫這個，得在所有玩家都加入遊戲後
    // 所以，我放在 model_ready 那邊
    //set_room_playing = 'UPDATE PlayRooms SET  playing_room_id = "'+req.body["startGameRoom"]+'" where room_id = "' + req.body["startGameRoom"] + '";';
    //usedb(set_room_playing, Object())

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
        //console.log("\nWWWWWWWWWW : \n" + JSON.stringify(wait_model_all_ready) + "\n\n")

        // 這邊確定有跑到
        // POST wait_model_all_ready[room_id] : {"syn55698":{"name":"syn55698","ready":false},"fhrol55698":{"name":"fhrol55698","ready":false}}
        //console.log("POST wait_model_all_ready[room_id] : "+JSON.stringify(wait_model_all_ready[room_id]))
        game_enemy[room_id] = Object()

        game_enemy[room_id]["counter"] = 0

        // 先設 playing_room_id2 欄位，代表至少玩家正在進入遊戲中，讓 其他玩家別再加入這間 Room
        set_room_playing = 'UPDATE PlayRooms SET  playing_room_id2 = "'+req.body["startGameRoom"]+'" where room_id = "' + req.body["startGameRoom"] + '";';
        usedb(set_room_playing, Object())

    }

    /*
    setTimeout(function(){
        console.log("啟動~~~~")
        endGameBackLobby(obj6["room_id"])
    },10000)
    */


    // map_test
    // demo


    res.render("dev_test.ejs", {
        inobj: obj6
    })


})