(() => {
    // Connect to server.
    var SOCKET = undefined;
    var ROOM_ID = undefined;

    while (true) {
        try {
            SOCKET = io();
            break;
        } catch (e) {}
    }
    AFRAME.registerSystem('tdar-game', {
        init: function() {
            this.socket = SOCKET;
            this.room_id = ROOM_ID;

            this.el.addEventListener('loaded', this.onAssetsLoaded.bind(this));
            this.socket.on('client-start-game', this.onStartGame.bind(this));

            this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
            this.socket.on('playingEvent', this.onExecute.bind(this)); // Listen server broadcast.
        },
        onAssetsLoaded: function() {
            this.socket.emit('model-ready');
        },
        onStartGame: function() {
            var sceneEl = document.querySelector('a-scene');
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
                testWavespawner1.setAttribute('wave-spawner', {
                    amount: 5,
                    duration: 5000,
                    faction: 'A',
                    timeOffSet: 300
                });
                sceneEl.appendChild(testWavespawner1);

                var testWavespawner2 = document.createElement('a-entity');
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
            this.socket.emit('playingEvent', content);
        },
        onExecute: function(content) {
            switch (content['event_name']) {
                case 'enemy-get-damaged':
                    this.el.querySelector('#' + content['id']).emit('be-attacked', {
                        damage: content['damage']
                    });
                    break;
                case 'castle-get-damaged':

                    break;
                case 'create-tower-success':

                    break;
                case 'tower-get-damaged':

                    break;
                case 'wave-spawner-create-enemy':
                    this.el.querySelector('[wave-spawner]').emit('spawn_enemy', {
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