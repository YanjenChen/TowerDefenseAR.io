class NetworkManager {
    constructor(sceneEl, mode) {
        /*
         * FUNCTION API SPEC
         *  mode: Game operation mode, one of ['single-player', 'multi-player'].
         *  sceneEl: DOM node point to <a-scene> element.
         *
         * CLASS PROPERTY
         *  mode: Game operation mode, one of ['single-player', 'multi-player'].
         *  sceneEl: DOM node point to <a-scene> element.
         *  SOCKET: socket object.
         */
        if (mode != 'single-player' || mode != 'multi-player') {
            console.warn('Network manager get wrong param.');
        }

        this.mode = mode;
        this.sceneEl = sceneEl;
        this.SOCKET = undefined;

        this.getSocket = this.getSocket.bind(this);
        this.checkOnline = this.checkOnline.bind(this);

        if (mode == 'multi-player') {
            console.log('Game is in multi player mode.');
            this.getSocket()
            jQuery(function() {
                setInterval(this.checkOnline, 1000)
            })
        }
    }
    get mode() {
        return this.mode;
    }
    get sceneEl() {
        return this.sceneEl;
    }
    get SOCKET() {
        return this.SOCKET;
    }
    checkOnline() {
        if (!this.SOCKET) {
            this.getSocket();
        }
        try {
            this.SOCKET.emit("nonPlayingEvent", {
                user: jQuery("#user").val(),
                event_name: "checkOnline"
            }) // 確定玩家還在線，送訊號回去

            // 送訊過去，通知玩家已加入 (就是 取得玩家的 socket 物件)
            this.SOCKET.emit("playingEvent", {
                user: jQuery("#user").val(),
                user_team_id: jQuery("#user_team_id").val(),
                room_id: jQuery("#room_id").val(),
                event_name: "informPlayerOnline"
            })
        } catch (e) {
            this.SOCKET = undefined
            console.warn("NETWORK ERROR, cannot get room.")
        }
    }
    getSocket() {
        this.SOCKET = undefined
        while (true) {
            try {
                this.SOCKET = io();
                break;
            } catch (e) {

            }
        }
        this.SOCKET.on('nonPlayingEvent', function(msg) {
            // 回報，使用者是否在線，若不在線，就強制登出
            if (msg["event_name"] == "serverResponseCheckOnline") {
                //console.log("Check User Online : "+msg["isOnline"])
                if (!msg["isOnline"]) {
                    location.href = "/login"
                }
            }
        })

        // "serverInformEndGame"
        this.SOCKET.on('playingEvent', function(msg) {
            // 回報，使用者是否在線，若不在線，就強制登出
            if (msg["event_name"] == "serverInformEndGame") { // 說要結束遊戲

                console.warn("Game End: " + msg["end_game_hash"])
                // 3 秒後跳轉回首頁 大廳頁面

                setTimeout(function() {
                    jQuery("#endGameBackUser").val(jQuery("#user").val())
                    jQuery("#endGameBackRoom").val(jQuery("#room_id").val())
                    jQuery("#endGameBackHash").val(msg["end_game_hash"])
                    jQuery("#endGameBackForm").submit()
                }, 3000)

            }
        })
    }
}
