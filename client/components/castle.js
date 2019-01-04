(() => {

    'use strict';

    const COMPONENT_NAME = 'castle';
    const COMPONENT_PREFIX = 'castle-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';

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
            faction: {
                type: 'string',
                default: 'RED',
                oneOf: ['RED', 'BLACK']
            },
            healthPoint: {
                type: "number",
                default: 100
            }
        },
        init: function() {

            this.el.setObject3D('mesh', this.system.getMesh(this));

            this.onBeAttacked = this.onBeAttacked.bind(this);
            this.onGetDamage = this.onGetDamage.bind(this);

            this.currentHP = this.data.healthPoint;

            if (this.data.faction === this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction) {

                this.system.uiManager.updateHealthPoint(this.currentHP);

            }

            this.el.addEventListener('enemy-arrived', this.onBeAttacked);
            this.el.addEventListener('castle-get-damage', this.onGetDamage);

        },
        remove: function() {

            this.system.cacheMesh(this);

            delete this.currentHP;

            this.el.removeEventListener('enemy-arrived', this.onBeAttacked);
            this.el.removeEventListener('castle-get-damage', this.onGetDamage);

            this.el.removeObject3D('mesh');

        },
        onBeAttacked: function(evt) {

            if (!this.el.id) {

                console.warn('Castle does not receive id.');

            }

            this.system.networkManager.emit('playingEvent', {
                event_name: 'castle_be_attacked',
                damage: evt.detail.damage,
                id: this.el.id
            });

        },
        onGetDamage: function(evt) {

            this.currentHP -= evt.detail.damage;
            if (this.data.faction === this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction) {

                this.system.uiManager.updateHealthPoint(this.currentHP);

            }
            if (this.currentHP <= 0) {

                console.log("Gameover");

            }

        }

    });

})();
