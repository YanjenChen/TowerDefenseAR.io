(() => {

    'use strict';

    const COMPONENT_NAME = 'spawner';
    const COMPONENT_PREFIX = 'spawner-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';
    const UNIT_CAVALRY_NAME = 'cavalry';
    const UNIT_INFANTRY_NAME = 'infantry';

    const UNIT_TYPE = [
        UNIT_CAVALRY_NAME,
        UNIT_INFANTRY_NAME
    ];
    const KEYS = [
        FACTION_RED_PREFIX + COMPONENT_NAME,
        FACTION_BLACK_PREFIX + COMPONENT_NAME
    ];

    AFRAME.registerSystem(COMPONENT_NAME, {

        init: function() {

            this.cacheList = {};

            let self = this;

            KEYS.forEach(KEY => {

                self.cacheList[KEY] = [];

            });

            this.el.addEventListener('gamemodelloaded', function _init() {

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.setting = self.gameManager.settings[COMPONENT_NAME]
                self.models = {};
                self.models[KEYS[0]] = self.gameManager.object3DPrototypes[KEYS[0]];
                self.models[KEYS[1]] = self.gameManager.object3DPrototypes[KEYS[1]];

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        },
        getMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + COMPONENT_NAME;
            let mesh;

            if (this.cacheList[key].length !== 0) {

                mesh = this.cacheList[key].pop();

            } else {

                mesh = THREE.AnimationUtils.clone(this.models[key].model);

            }
            return mesh;

        },
        cacheMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + COMPONENT_NAME;
            let mesh = component.el.getObject3D('mesh');

            this.cacheList[key].push(mesh);

        }

    });

    AFRAME.registerComponent(COMPONENT_NAME, {

        schema: {
            amount: {
                type: 'number',
                default: 1
            },
            duration: {
                type: 'number',
                default: 10000
            },
            faction: {
                type: 'string',
                default: 'RED',
                oneOf: ['RED', 'BLACK']
            },
            timeOffSet: {
                type: 'number',
                default: 1000
            }
        },
        init: function() {

            this.el.setObject3D('mesh', this.system.getMesh(this));

            this.onSpawnEnemy = this.onSpawnEnemy.bind(this);
            this.setAutoSpawn = this.setAutoSpawn.bind(this);
            this.removeAutoSpawn = this.removeAutoSpawn.bind(this);
            this.addToSpawnBuffer = this.addToSpawnBuffer.bind(this);
            this.addInfantryToSpawnBuffer = this.addInfantryToSpawnBuffer.bind(this);
            this.addCavalryToSpawnBuffer = this.addCavalryToSpawnBuffer.bind(this);
            this.updateUI = this.updateUI.bind(this);
            this.getUIsets = this.getUIsets.bind(this);

            this.timeCounter = 0;
            this.spawnCounter = 0;
            this.spawnBuffer = []; // store type of unit.

            this.el.addState('activate');
            this.el.addState('autospawn');
            this.el.addEventListener('spawn_enemy', this.onSpawnEnemy);

        },
        tick: function(time, timeDelta) {

            this.timeCounter += timeDelta;

            if (this.el.is('activate') && this.timeCounter > this.data.timeOffSet) {

                if (!this.el.id) {

                    console.warn('Wave spawner does not receive id.');

                }

                if (this.el.is('autospawn') && this.spawnBuffer.length === 0) {

                    this.addToSpawnBuffer(UNIT_TYPE[Math.floor(Math.random() * 2)]);

                }

                if (this.spawnBuffer.length > 0) {
                    this.system.networkManager.emit('playingEvent', {
                        event_name: 'wave_spawner_request_spawn_enemy',
                        id: this.el.id,
                        ws_faction: this.data.faction,
                        type: this.spawnBuffer.pop(),
                        time: time
                    });
                }

                this.timeCounter = 0;

            } else if (this.timeCounter > this.data.duration) {

                this.el.addState('activate');

            }

        },
        remove: function() {

            this.system.cacheMesh(this);

            delete this.timeCounter;
            delete this.spawnCounter;

            this.el.removeEventListener('spawn_enemy', this.onSpawnEnemy);
            this.el.removeObject3D('mesh');

        },
        onSpawnEnemy: function(evt) {

            this.spawnCounter++;

            if (this.spawnCounter > this.data.amount) {

                this.spawnCounter = 0;
                this.el.removeState('activate');

                return true;

            }

            let enemyEl = document.createElement('a-entity');
            this.system.gameManager.dynamicScene.appendChild(enemyEl);
            enemyEl.object3D.position.copy(this.el.object3D.position);
            enemyEl.setAttribute('unit', evt.detail);

        },
        setAutoSpawn: function() {

            this.el.addState('autospawn');
            this.updateUI();

        },
        removeAutoSpawn: function() {

            this.el.removeState('autospawn');
            this.updateUI();

        },
        addToSpawnBuffer: function(type) {

            this.spawnBuffer.unshift(type);

        },
        addInfantryToSpawnBuffer: function() {

            this.addToSpawnBuffer(UNIT_INFANTRY_NAME);
            this.updateUI();

        },
        addCavalryToSpawnBuffer: function() {

            this.addToSpawnBuffer(UNIT_CAVALRY_NAME);
            this.updateUI();

        },
        updateUI: function() {

            this.system.gameManager.gridEl.components['grid'].onEndProcess(this);

        },
        getUIsets: function() {

            let currentMoney = this.system.cashManager.currentMoney[this.el.sceneEl.systems['tdar-game'].data.userFaction];
            let uisets;

            if (this.el.is('autospawn')) {

                uisets = [{
                    callback: this.removeAutoSpawn,
                    icon: undefined,
                    header: 'AutoOff',
                    cost: 0,
                    disable: false
                }];

            } else {

                uisets = [{
                    callback: this.addInfantryToSpawnBuffer,
                    icon: undefined,
                    header: 'Infantry',
                    cost: 0,
                    disable: false
                }, {
                    callback: this.addCavalryToSpawnBuffer,
                    icon: undefined,
                    header: 'Cavalry',
                    cost: 0,
                    disable: false
                }, {
                    callback: this.setAutoSpawn,
                    icon: undefined,
                    header: 'AutoOn',
                    cost: 0,
                    disable: false
                }];

            }
            return uisets;

        }

    });

})();
