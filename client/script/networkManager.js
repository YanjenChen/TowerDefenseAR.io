class NetworkManager {
    constructor(sceneEl, mode) {
        /*
         * FUNCTION API SPEC
         *  mode: Game operation mode, one of ['single-player', 'multi-player'].
         *  sceneEl: DOM node point to <a-scene> element.
         *
         * CLASS PROPERTY
         *  mode: Game operation mode, one of ['single-player', 'multi-player'].
         *  room_id: Room id received from server.
         *  sceneEl: DOM node point to <a-scene> element.
         *  serverSimulator (private): server simulator for single player.
         *  SOCKET: socket object.
         *  user: User name receive from server.
         *  user_faction: User faction receive from server.
         *  user_team_id: User team id received from server.
         */
        if (mode != 'single-player' && mode != 'multi-player') {
            console.warn('Network manager get wrong param.');
        }

        this.mode = mode;
        this.room_id = jQuery("#room_id").val();
        this.sceneEl = sceneEl;
        this.serverSimulator = new ServerSimulator(sceneEl);
        this.SOCKET = undefined;
        this.user = jQuery("#user").val();
        this.user_faction = jQuery("#user_faction").val();
        this.user_team_id = jQuery("#user_team_id").val();

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
    checkOnline() {
        if (!this.SOCKET) {
            this.getSocket();
        }
        try {
            this.SOCKET.emit("nonPlayingEvent", {
                user: this.user,
                event_name: "checkOnline"
            }) // 確定玩家還在線，送訊號回去

            // 送訊過去，通知玩家已加入 (就是 取得玩家的 socket 物件)
            this.SOCKET.emit("playingEvent", {
                user: this.user,
                user_team_id: this.user_team_id,
                room_id: this.room_id,
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
    addEventListener(evtName, callback) {
        //console.log('NM ADD EVENTLISTNER HAS BEEN CALLED.');

        var self = this;
        var wrapper = function(evt) {
            if (self.mode == 'single-player')
                evt = evt.detail;
            callback(evt);
        }

        if (this.mode == 'multi-player') {
            this.SOCKET.on(evtName, wrapper);
        } else {
            this.sceneEl.addEventListener(evtName, wrapper);
        }
    }
    emit(evtName, detail) {
        /*
         * The format of evtName, detail is same as server API.
         */
        if (this.mode == 'multi-player') {
            // wrap server require information.
            detail.room_id = this.room_id;
            detail.user = this.user;

            this.SOCKET.emit(evtName, detail);
        } else {
            this.serverSimulator.emit(evtName, detail);
        }
    }
}
