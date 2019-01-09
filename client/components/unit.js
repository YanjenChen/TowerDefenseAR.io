(() => {
    'use strict';

    const ANIMATION_GROUP_NUM = 1;
    const TIME_RATIO = 0.001;

    const BAR_COLOR_GREEN = 0x4ecdc4;
    const BAR_COLOR_RED = 0xff6b6b;

    const COMPONENT_NAME = 'unit';
    const COMPONENT_PREFIX = 'unit-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';
    const UNIT_CAVALRY_NAME = 'cavalry';
    const UNIT_INFANTRY_NAME = 'infantry';

    const KEYS = [
        FACTION_RED_PREFIX + UNIT_CAVALRY_NAME,
        FACTION_RED_PREFIX + UNIT_INFANTRY_NAME,
        FACTION_BLACK_PREFIX + UNIT_CAVALRY_NAME,
        FACTION_BLACK_PREFIX + UNIT_INFANTRY_NAME
    ];

    AFRAME.registerSystem(COMPONENT_NAME, {

        init: function() {

            this.animationActions = {};
            this.animationGroups = {};
            this.animationMixers = {};
            this.cacheList = {};
            this.hasInitialized = false;
            this.unitList = {};

            let self = this;

            KEYS.forEach(KEY => {

                self.animationActions[KEY] = [];
                self.animationGroups[KEY] = [];
                self.animationMixers[KEY] = [];
                self.cacheList[KEY] = [];
                self.unitList[KEY] = [];

            });

            this.el.addEventListener('gamemodelloaded', function _init() {

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.cavalrySetting = self.gameManager.settings[COMPONENT_NAME][UNIT_CAVALRY_NAME];
                self.infantrySetting = self.gameManager.settings[COMPONENT_NAME][UNIT_INFANTRY_NAME];
                self.models = {};
                self.models[KEYS[0]] = self.gameManager.object3DPrototypes[FACTION_RED_PREFIX + COMPONENT_PREFIX + UNIT_CAVALRY_NAME];
                self.models[KEYS[1]] = self.gameManager.object3DPrototypes[FACTION_RED_PREFIX + COMPONENT_PREFIX + UNIT_INFANTRY_NAME];
                self.models[KEYS[2]] = self.gameManager.object3DPrototypes[FACTION_BLACK_PREFIX + COMPONENT_PREFIX + UNIT_CAVALRY_NAME];
                self.models[KEYS[3]] = self.gameManager.object3DPrototypes[FACTION_BLACK_PREFIX + COMPONENT_PREFIX + UNIT_INFANTRY_NAME];

                const models = self.models;

                // Set animation object groups.
                // REMIND: THREE.AnimationObjectGroup has a method called .uncache() to Deallocates all memory resources for the passed objects of this AnimationObjectGroup.
                for (let key in models) {

                    for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {

                        let group = new THREE.AnimationObjectGroup();
                        let mixer = new THREE.AnimationMixer(group);
                        let action = mixer.clipAction(models[key].model.animations[0]);

                        if (key.indexOf(UNIT_CAVALRY_NAME) !== -1) {

                            action.setEffectiveTimeScale(self.cavalrySetting.animation_timeScale);

                        } else if (key.indexOf(UNIT_INFANTRY_NAME) !== -1) {

                            action.setEffectiveTimeScale(self.infantrySetting.animation_timeScale);

                        } else {

                            console.warn('Unit initial receive unknown name.');

                        }
                        action.play();
                        mixer.update((1 / 60) / ANIMATION_GROUP_NUM * i); // provide time offset to different group.

                        self.animationGroups[key].push(group);
                        self.animationMixers[key].push(mixer);
                        self.animationActions[key].push(action);

                    }

                }

                self.el.removeEventListener('gamemodelloaded', _init);
                self.hasInitialized = true;

            });

            this.el.addEventListener('systemupdatepath', this.onPathUpdated.bind(this));

        },
        tick: function(time, timeDelta) {

            if (!this.hasInitialized) {

                return true;

            }

            for (let key in this.animationMixers) {

                for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {

                    this.animationMixers[key][i].update(timeDelta / 1000);

                }

            }

        },
        onPathUpdated: function(evt) {

            for (let key in this.unitList) {

                this.unitList[key].forEach(component => {

                    component.el.addState('needupdatepath');
                    component.updatePath();

                });

            }

        },
        registerUnit: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;

            this.unitList[key].push(component);

        },
        getMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;
            let mesh;

            if (this.cacheList[key].length !== 0) {

                mesh = this.cacheList[key].pop();

            } else {

                mesh = THREE.AnimationUtils.clone(this.models[key].model);

            }
            //console.log(this.animationGroups[key], component.data.id, Math.round(component.data.id % ANIMATION_GROUP_NUM));
            this.animationGroups[key][Math.round(component.data.id % ANIMATION_GROUP_NUM)].add(mesh);
            return mesh;

        },
        getLifeBarMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;

            let geometry = new THREE.PlaneGeometry(this.models[key].width, 0.1);
            geometry.vertices.forEach(point => {
                point.x += this.models[key].width / 2;
                point.y += 0.05;
            });

            let material = new THREE.MeshBasicMaterial({
                color: BAR_COLOR_GREEN,
                side: THREE.DoubleSide
            });

            let lifeBar = new THREE.Mesh(geometry, material);
            lifeBar.position.setX(-this.models[key].width / 2);
            lifeBar.position.setY(this.models[key].height + 0.05);

            return lifeBar;

        },
        unregisterUnit: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;
            let index = this.unitList[key].indexOf(component);

            if (index > -1) {

                this.unitList[key].splice(index, 1);

            } else {

                console.warn('Unit system unregister unknown component.');

            }

        },
        cacheMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;
            let mesh = component.el.getObject3D('mesh');

            this.animationGroups[key][Math.round(component.data.id % ANIMATION_GROUP_NUM)].remove(mesh);
            // this.animationGroups[key][Math.round(component.data.id % ANIMATION_GROUP_NUM)].uncache(mesh);
            this.cacheList[key].push(mesh);


            // TEST
            /*
            for (let key in this.animationGroups) {

                for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {

                    console.log(key, ', total: ', this.animationGroups[key][i].stats.objects.total, ', inUse: ', this.animationGroups[key][i].stats.objects.inUse);

                }

            }
            */
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
                // Receive from server.
                type: 'number',
                default: 1
            },
            id: {
                // Receive from server.
                type: 'number',
                default: 1
            },
            reward: {
                // Receive from server.
                type: 'number',
                default: 1
            },
            targetCastle: {
                // Receive from server.
                type: 'selector',
                default: null
            },
            type: {
                type: 'string',
                default: UNIT_INFANTRY_NAME,
                oneOf: [UNIT_INFANTRY_NAME, UNIT_CAVALRY_NAME]
            }
        },
        init: function() {

            this.system.registerUnit(this);
            this.el.setObject3D('mesh', this.system.getMesh(this));
            this.el.setObject3D('lifebar', this.system.getLifeBarMesh(this));
            this.el.setAttribute('id', this.data.faction + '-' + COMPONENT_PREFIX + this.data.type + '-' + this.data.id.toString());

            this.onBeAttacked = this.onBeAttacked.bind(this);
            this.onArrived = this.onArrived.bind(this);
            this.updatePath = this.updatePath.bind(this);
            this.updateToTile = this.updateToTile.bind(this);

            switch (this.data.type) {

                case UNIT_INFANTRY_NAME:
                    this.setting = this.system.infantrySetting;
                    break;

                case UNIT_CAVALRY_NAME:
                    this.setting = this.system.cavalrySetting;
                    break;

                default:
                    console.warn('Unit init with unknown type.');

            }
            this.speed = this.setting.speed;
            this.damage = this.setting.damage;
            this.laserEffectiveness = this.setting.laserEffectiveness;
            this.missileEffectiveness = this.setting.missileEffectiveness;
            this.currentHP = this.data.healthPoint;
            this.line = null;
            this.lineLength = null;
            this.completeDist = 0;
            this.prevTile = this.system.Utils.sceneToTile(this.el.object3D.position);
            this.lifeBar = this.el.getObject3D('lifebar');

            this.el.addState('needupdatepath');
            this.updatePath();

            this.el.addEventListener('be-attacked', this.onBeAttacked);

        },
        tick: function(time, timeDelta) {

            if (this.el.is('needupdatepath') || this.el.is('endofpath')) {

                return true;

            }

            this.completeDist += this.speed * timeDelta * TIME_RATIO;
            if (this.completeDist >= this.lineLength) {

                this.el.addState('endofpath');
                this.onArrived();

            } else {

                let p = this.line.getPointAt(this.completeDist / this.lineLength);
                let d = this.el.parentNode.object3D.localToWorld(p.clone());
                this.el.object3D.lookAt(d);
                this.el.object3D.position.copy(p);

                this.updateToTile();

            }

        },
        remove: function() {

            this.system.gameManager.removeEnemyFromTileMap(this.prevTile, this.el);
            this.system.unregisterUnit(this);
            this.system.cacheMesh(this);

            delete this.setting;
            delete this.speed;
            delete this.damage
            delete this.laserEffectiveness
            delete this.missileEffectiveness
            delete this.currentHP;
            delete this.line;
            delete this.lineLength;
            delete this.completeDist;
            delete this.prevTile;
            delete this.lifeBar;

            this.el.removeObject3D('mesh');
            this.el.removeObject3D('lifebar');
            this.el.removeEventListener('be-attacked', this.onBeAttacked);

        },
        onArrived: function() {

            this.data.targetCastle.emit('enemy-arrived', {
                damage: this.damage
            });
            this.el.parentNode.removeChild(this.el);

        },
        onBeAttacked: function(evt) {

            switch (evt.detail.type) {

                case 'laser':
                    this.currentHP -= evt.detail.damage * this.laserEffectiveness;
                    break;

                case 'missile':
                    this.currentHP -= evt.detail.damage * this.missileEffectiveness;
                    break;

                default:
                    console.warn('Enemy receive unknown attack type.');

            }
            if (this.currentHP <= 0) {

                this.system.cashManager.requestUpdateCash(
                    this.data.reward,
                    this.data.faction === 'RED' ? 'BLACK' : 'RED'
                );
                this.el.parentNode.removeChild(this.el);

            } else {

                let scaleX = this.currentHP / this.data.healthPoint;
                this.lifeBar.scale.setX(scaleX);
                if (scaleX <= 0.2) {

                    this.lifeBar.material.color.set(BAR_COLOR_RED);
                    this.lifeBar.material.needsUpdate = true;

                }

            }

        },
        updatePath: async function() {

            delete this.line;
            this.line = await this.system.gameManager.getNewPath(this.el.object3D.position, this.data.faction);
            this.lineLength = this.line.getLength();
            this.completeDist = 0;
            this.el.removeState('needupdatepath');

        },
        updateToTile: function() {

            let p = this.system.Utils.sceneToTile(this.el.object3D.position);
            if (p.x != this.prevTile.x || p.z != this.prevTile.z) {

                this.system.gameManager.removeEnemyFromTileMap(this.prevTile, this.el);
                this.system.gameManager.addEnemyToTileMap(this.el.object3D.position, this.el);
                this.prevTile = p;

            }

        }

    });
})();
