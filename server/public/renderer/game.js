(() => {
    // Connect to server.
    //var SOCKET = undefined;

    // 這邊的 socket 物件，是從 demo.js 抓的，可以用
    var SOCKET = socket;
    var ROOM_ID = jQuery("#room_id").val();
    var USER = jQuery("#user").val();
    var USER_FACTION = jQuery("#user_faction").val() == '1' ? 'A' : 'B';
    console.log("gamejs : ROOM_ID : "+ROOM_ID+" , USER : "+USER)
    console.log("gamejs : "+socket)
    /*
    while (true) {
        try {
            SOCKET = io();
            break;
        } catch (e) {}
    }
    */
    AFRAME.registerSystem('tdar-game', {
        init: function() {
            this.socket = SOCKET;
            this.room_id = ROOM_ID;
            this.user = USER;

            this.el.addEventListener('loaded', this.onAssetsLoaded.bind(this));
            this.socket.on('client_start_game', this.onStartGame.bind(this));
            //this.socket
            console.log("\nAFRAME Init\n")
            
            /*
            SOCKET.on('client_start_game', function(){
                console.warn('suck')
            });
            */


            // 測試用，可以接收事件        
            socket.on("DDD",function(msg){

                console.log("\nDDD...."+JSON.stringify(msg)+"\n")
            })
            
            this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
            this.socket.on('playingEvent', this.onExecute); // Listen server broadcast.
        },
        onAssetsLoaded: function() {
            console.warn('Assets successful loaded.');
            // var tar_game_obj = this
      
            // 重要，得定期發射訊息
            // 因為不確定 server 那邊何時所有客戶端跑過 socket.join，所以model_ready只能一直定時發送訊息
            
            /*
            setInterval(
            
                function(){
                        tar_game_obj.socket.emit("nonPlayingEvent", {
                        room_id: tar_game_obj.room_id,
                        event_name:'model_ready',
                        user: tar_game_obj.user
                    });

                },3000
            )
            */


            this.socket.emit("nonPlayingEvent", {
                        room_id: this.room_id,
                        event_name:'model_ready',
                        user: this.user});
                
        },
        onStartGame: function() {
            console.warn('Client start game.')
            var sceneEl = document.querySelector('a-scene');
            //var sceneEl = this.el;
            jQuery.getJSON('renderer/maps/demo.json', (map) => {
                /* CURVE LOADER */
                map.factions.forEach(faction => {
                    faction.enemyPath.forEach(path => {
                        var curveEl = document.createElement('a-entity');
                        curveEl.setAttribute('path', {});
                        curveEl.setAttribute('id', faction.name + 'faction' + path.type + 'path');
                        path.points.forEach((point) => {
                            var pointEl = document.createElement('a-entity');
                            pointEl.setAttribute('path-point', {});
                            pointEl.setAttribute('position', point);
                            curveEl.appendChild(pointEl);
                        });

                        // ONLY USE IN DEVELOPER TESTING
                        curveEl.setAttribute('draw-path', {
                            path: '#' + faction.name + 'faction' + path.type + 'path'
                        });
                        ////////////////////////////////

                        sceneEl.appendChild(curveEl);
                    });
                });

                /*
                var testCastle = document.createElement('a-entity');
                testCastle.setAttribute('ply-model', {
                    src: 'url(renderer/assets/tower.ply)'
                });
                testCastle.setAttribute('position', '-6 1.6 -6');
                testCastle.setAttribute('scale', '0.025 0.025 0.025');
                testCastle.setAttribute('rotation', '-90 0 0');
                sceneEl.appendChild(testCastle);
        		*/

                var testTower1 = document.createElement('a-entity');
                testTower1.setAttribute('geometry', {
                    primitive: 'box',
                    width: 0.5,
                    height: 0.5,
                    depth: 2
                });
                testTower1.setAttribute('position', '-3 0 0');
                testTower1.setAttribute('tower', {
                    dps: 10,
                    faction: 'B',
                    range: 10
                });
                sceneEl.appendChild(testTower1);

                var testTower2 = document.createElement('a-entity');
                testTower2.setAttribute('geometry', {
                    primitive: 'box',
                    width: 0.5,
                    height: 0.5,
                    depth: 2
                });
                testTower2.setAttribute('position', '9 0 0');
                testTower2.setAttribute('tower', {
                    dps: 20,
                    faction: 'A',
                    range: 5
                });
                sceneEl.appendChild(testTower2);

                var testWavespawner1 = document.createElement('a-entity');
                testWavespawner1.setAttribute('id', 'faction-A-wave-spawner');
                testWavespawner1.setAttribute('wave-spawner', {
                    amount: 5,
                    duration: 5000,
                    faction: 'A',
                    timeOffSet: 300
                });
                sceneEl.appendChild(testWavespawner1);

                var testWavespawner2 = document.createElement('a-entity');
                testWavespawner2.setAttribute('id', 'faction-B-wave-spawner');
                testWavespawner2.setAttribute('wave-spawner', {
                    amount: 5,
                    duration: 6000,
                    faction: 'B',
                    timeOffSet: 300
                });
                sceneEl.appendChild(testWavespawner2);

            });
        },
        onBroadcast: function(content) {
            content.room_id = this.room_id;
            content.user = this.user;
            this.socket.emit('playingEvent', content);
        },
        onExecute: function(content) {
            switch (content['event_name']) {
                case 'enemy_get_damaged':
                    this.el.querySelector('#' + content['id']).emit('be-attacked', {
                        damage: content['damage']
                    });
                    break;
                case 'castle_get_damaged':

                    break;
                case 'create_tower_success':

                    break;
                case 'tower_get_damaged':

                    break;
                case 'wave_spawner_create_enemy':
                    this.el.querySelector('#' + content['id']).emit('spawn_enemy', {
                        id: content['enemy_id'],
                        faction: content['ws_faction'],
                        healthPoint: 6,
                        speed: 4
                    });
                    break;
            }
        }
    });
})();