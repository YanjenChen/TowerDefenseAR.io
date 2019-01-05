/*
 * DEPEDENCY:
 *	aframe.js
 *	pathfinding-browser.js
 *	socket.js
 *	network.js.
 *	gameManager.js
 */
(() => {
    const CONFIG_DIR = './renderer/maps/demo.json';

    AFRAME.registerSystem('tdar-game', {
        schema: {
            mode: {
                type: 'string',
                default: 'multi-player',
                oneOf: ['single-player', 'multi-player']
            },
            ar: {
                type: 'boolean',
                default: false,
            },
            userFaction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            }
        },
        init: function() {
            let self = this;
            let gameManager = this.gameManager = new GameManager(this.el, CONFIG_DIR, this.data.ar ? 'ar' : 'vr');
            let networkManager = this.networkManager = new NetworkManager(this.el, this.data.mode);
            let uiManager = this.uiManager = new UIManager(this.el);
            this.cashManager = null; // Will init in gameManager.

            networkManager.addEventListener('client_start_game', this.onStartGame.bind(this));
            networkManager.addEventListener('playingEvent', this.onExecute.bind(this));

            gameManager.loadConfig();
        },
        tick: function(time, timedelta) {
            if (this.cashManager)
                this.cashManager.tick(time, timedelta);
        },
        onStartGame: function() {
            //console.warn('Client start game.');

            // Insert cursor under camera.
            let cursor = document.createElement('a-entity');
            cursor.setAttribute('cursor', {
                fuse: false
            });
            cursor.setAttribute('position', '0 0 -0.1');
            cursor.setAttribute('raycaster', 'objects: #tdar-game-grid');
            document.querySelector('[camera]').appendChild(cursor);

            //console.log('Dynamic scene play.');
            this.gameManager.dynamicScene.play();
        },
        onExecute: function(content) {
            //console.warn('Receive event from server, name: ' + content['event_name']);

            switch (content['event_name']) {
                case 'enemy_get_damaged':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null)
                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('be-attacked', content);
                    break;
                case 'castle_get_damaged':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null)
                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('castle-get-damage', {
                            damage: content['damage']
                        });
                    break;
                case 'create_tower_success':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null)
                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('create-tower', content);
                        this.cashManager.executeUpdateCash(content['amount'], content['faction']);
                        this.cashManager.moneytowerbuild(content['ampamount'], content['faction']);
                    break;
                case 'do_tower_upgrade':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null){

                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('upgrade-tower', content);
                        this.cashManager.executeUpdateCash(content['amount'], content['faction']);
                    }

                    break;
                case 'do_tower_remove':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null)
                        this.cashManager.moneytowerbuild(content['ampamount']*-1, content['faction']);
                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('remove-tower', content);
                        this.cashManager.executeUpdateCash(Math.round(content['amount']*-0.35), content['faction']);
                        console.log("remover:  "+Math.round(content['amount']*-0.35));
                    break;
                case 'tower_get_damaged':

                    break;
                case 'wave_spawner_create_enemy':
                    if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null) {
                        //console.log(content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle');

                        this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('spawn_enemy', {
                            faction: content['ws_faction'],
                            healthPoint: content['healthPoint'],
                            id: content['enemy_id'],
                            reward: content['reward'],
                            targetCastle: content['targetCastle'],
                            type: content['type']
                        });
                    }
                    break;
                case 'execute_update_cash':
                    this.cashManager.executeUpdateCash(content['amount'], content['faction']);
                    break;
            }
        }
    });
})();
