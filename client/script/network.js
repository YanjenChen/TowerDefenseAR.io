var SOCKET = undefined
//console.log("Execute network.js.");
// 送訊號 到 Server 確定玩家還在線 + 送訊通知某玩家還在線遊戲
function checkOnline() {
    if (!SOCKET) {
        getsocket()
    }
    try {
        SOCKET.emit("nonPlayingEvent", {
            user: $("#user").val(),
            event_name: "checkOnline"
        }) // 確定玩家還在線，送訊號回去

        // 送訊過去，通知玩家已加入 (就是 取得玩家的 socket 物件)
        SOCKET.emit("playingEvent", {
            user: $("#user").val(),
            user_team_id: $("#user_team_id").val(),
            room_id: $("#room_id").val(),
            event_name: "informPlayerOnline"
        })
        //console.log("USER: "+$("#user").val())
    } catch (e) {
        SOCKET = undefined
        console.warn("NETWORK ERROR, cannot get room.")
    }
}

function getsocket() {
    SOCKET = undefined
    while (true) {
        try {
            SOCKET = io();
            break;
        } catch (e) {

        }
    }
    SOCKET.on('nonPlayingEvent', function(msg) {
        // 回報，使用者是否在線，若不在線，就強制登出
        if (msg["event_name"] == "serverResponseCheckOnline") {
            //console.log("Check User Online : "+msg["isOnline"])
            if (!msg["isOnline"]) {
                location.href = "/login"
            }
        }
    })

    // "serverInformEndGame"
    SOCKET.on('playingEvent', function(msg) {
        // 回報，使用者是否在線，若不在線，就強制登出
        if (msg["event_name"] == "serverInformEndGame") { // 說要結束遊戲

            console.warn("Game End: " + msg["end_game_hash"])
            // 3 秒後跳轉回首頁 大廳頁面

            setTimeout(function() {
                $("#endGameBackUser").val($("#user").val())
                $("#endGameBackRoom").val($("#room_id").val())
                $("#endGameBackHash").val(msg["end_game_hash"])
                $("#endGameBackForm").submit()
            }, 3000)

        }
    })

    /*
    SOCKET.on("CCC", function(msg) {
        console.log("\nCCC...." + JSON.stringify(msg) + "\n")
    })
    */

    //console.log("\n執行 getsocket() " + SOCKET + "\n")
}

getsocket()
jQuery(function() {
    setInterval(checkOnline, 1000)
})