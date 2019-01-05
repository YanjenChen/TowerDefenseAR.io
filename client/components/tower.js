(() => {
    'use strict';

    const LASER_EMIT_THRESHOLD = 20;

    const COMPONENT_NAME = 'tower';
    const COMPONENT_PREFIX = 'tower-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';
    const TYPE_LASER = 'laser';
    const TYPE_CATAPULT = 'catapult';
    const TYPE_GOLDMINE = 'goldMine';

    const KEYS = [
        FACTION_RED_PREFIX + TYPE_LASER,
        FACTION_RED_PREFIX + TYPE_CATAPULT,
        FACTION_RED_PREFIX + TYPE_GOLDMINE,
        FACTION_BLACK_PREFIX + TYPE_LASER,
        FACTION_BLACK_PREFIX + TYPE_CATAPULT,
        FACTION_BLACK_PREFIX + TYPE_GOLDMINE
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

                self.laserSetting = self.gameManager.settings[COMPONENT_NAME][TYPE_LASER];
                self.catapultSetting = self.gameManager.settings[COMPONENT_NAME][TYPE_CATAPULT];
                self.goldMineSetting = self.gameManager.settings[COMPONENT_NAME][TYPE_GOLDMINE];
                self.models = {};
                self.models[KEYS[0]] = self.gameManager.object3DPrototypes[FACTION_RED_PREFIX + COMPONENT_PREFIX + TYPE_LASER];
                self.models[KEYS[1]] = self.gameManager.object3DPrototypes[FACTION_RED_PREFIX + COMPONENT_PREFIX + TYPE_CATAPULT];
                self.models[KEYS[2]] = self.gameManager.object3DPrototypes[FACTION_RED_PREFIX + COMPONENT_PREFIX + TYPE_GOLDMINE];
                self.models[KEYS[3]] = self.gameManager.object3DPrototypes[FACTION_BLACK_PREFIX + COMPONENT_PREFIX + TYPE_LASER];
                self.models[KEYS[4]] = self.gameManager.object3DPrototypes[FACTION_BLACK_PREFIX + COMPONENT_PREFIX + TYPE_CATAPULT];
                self.models[KEYS[5]] = self.gameManager.object3DPrototypes[FACTION_BLACK_PREFIX + COMPONENT_PREFIX + TYPE_GOLDMINE];

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        },
        getMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;
            let mesh;

            if (this.cacheList[key] === undefined) {

                console.warn('Tower getMesh received unknown key: ', key);

            }

            if (this.cacheList[key].length !== 0) {

                mesh = this.cacheList[key].pop();

            } else {

                mesh = THREE.AnimationUtils.clone(this.models[key].model);
                mesh.animations = this.models[key].model.animations;

            }
            return mesh;

        },
        cacheMesh: function(component) {
            /**
             *  @param {unit-component} component
             */

            const key = component.data.faction + '-' + component.data.type;
            let mesh = component.el.getObject3D('mesh');

            this.cacheList[key].push(mesh);

        },
        getNearestEnemy: function(component) {
            /**
             *  @param {unit-component} component
             */

            if (component.enemiesInRange.length === 0) {

                return undefined;

            }

            let minDistance = Infinity;
            let distance;
            let targetEl;

            component.enemiesInRange.forEach(enemyEl => {

                distance = enemyEl.object3D.position.distanceToSquared(component.el.object3D.position);
                if (distance < component.rangeSquare && distance < minDistance) {

                    minDistance = distance;
                    targetEl = enemyEl;

                }

            });

            return targetEl;

        },
        isTargetInRange: function(component) {
            /**
             *  @param {unit-component} component
             */

            if (component.targetEl === undefined || component.targetEl.components['unit'] === undefined || component.targetEl.components['unit'].currentHP <= 0) {

                return false;

            }
            return (component.targetEl.object3D.position.distanceToSquared(component.el.object3D.position) < component.rangeSquare);

        },
        onFire: function(component) {
            /**
             *  @param {unit-component} component
             */

            switch (component.data.type) {

                case TYPE_CATAPULT:
                    let missileEl = document.createElement('a-entity');

                    component.muzzle.getWorldPosition(component.tmpVec);
                    missileEl.object3D.position.copy(this.gameManager.dynamicScene.object3D.worldToLocal(component.tmpVec));

                    missileEl.setAttribute('cannonball', {
                        damagePoint: component.damagePoint,
                        attackRange: component.setting[component.data.tier].attackRange,
                        speed: component.setting[component.data.tier].speed,
                        targetPos: component.targetEl.object3D.position
                    });

                    this.gameManager.dynamicScene.appendChild(missileEl);
                    break;

                case TYPE_LASER:
                    component.muzzle.getWorldPosition(component.tmpVec);
                    component.laserLine.geometry.vertices[0].copy(component.laserLine.parent.worldToLocal(component.tmpVec));

                    component.targetEl.object3D.getWorldPosition(component.tmpVec);
                    component.laserLine.geometry.vertices[1].copy(component.laserLine.parent.worldToLocal(component.tmpVec));

                    component.laserLine.geometry.verticesNeedUpdate = true;

                    component.laserAttackCount++;
                    if (component.laserAttackCount >= LASER_EMIT_THRESHOLD) {

                        this.networkManager.emit('playingEvent', {
                            event_name: 'enemy_be_attacked',
                            id: component.targetEl.id,
                            damage: component.damagePoint * component.laserAttackCount,
                            type: component.data.type
                        });
                        component.laserAttackCount = 0;

                    }
                    break;

                case TYPE_GOLDMINE:
                    break;

                default:
                    console.warn('Tower fire with unknown type.');

            }

        }
    });

    AFRAME.registerComponent(COMPONENT_NAME, {

        schema: {
            faction: {
                type: 'string',
                default: 'RED',
                oneOf: ['RED', 'BLACK']
            },
            type: {
                type: "string",
                default: TYPE_LASER,
                oneOf: [TYPE_LASER, TYPE_CATAPULT, TYPE_GOLDMINE]
            },
            tier: {
                type: "number",
                default: 0
            }
        },
        init: function() {

            this.el.setObject3D('mesh', this.system.getMesh(this));

            this.upgradeTier = this.upgradeTier.bind(this);
            this.isMaxTier = this.isMaxTier.bind(this);
            this.requestUpdateTargetEl = this.requestUpdateTargetEl.bind(this);
            this.executeUpdateTargetEl = this.executeUpdateTargetEl.bind(this);

            switch (this.data.type) {

                case TYPE_LASER:
                    this.setting = this.system.laserSetting;
                    break;

                case TYPE_CATAPULT:
                    this.setting = this.system.catapultSetting;
                    break;

                case TYPE_GOLDMINE:
                    this.setting = this.system.goldMineSetting;
                    break;

                default:
                    console.warn('Tower init with unknown type.');

            }
            // initialize tower parameters.
            this.targetEl = undefined;
            this.targetFac = (this.data.faction === 'RED') ? 'BLACK' : 'RED';
            this.timeCounter = 0;
            this.restDuration = null;
            this.activateDuration = null;
            this.range = null;
            this.rangeSquare = null;
            this.damagePoint = null;
            this.laserLine = null;
            this.tmpVec = new THREE.Vector3();
            this.enemiesInRange = [];
            this.laserAttackCount = 0;
            this.roter = null;
            this.muzzle = null;

            let self = this;
            let model = this.el.getObject3D('mesh');

            switch (this.data.type) {

                case TYPE_LASER:
                    model.traverse(_find);
                    // play create animation.
                    /*
                    this.el.setAttribute('animation-mixer', {
                        timeScale: this.setting.common.animation_timeScale,
                        loop: 'once'
                    });
                    this.el.addState('initializing');
                    this.el.addEventListener('animation-finished', function _listener() {
                        self.el.removeState('initializing');
                        self.el.removeEventListener('animation-finished', _listener);
                    });
                    */
                    break;

                case TYPE_CATAPULT:
                    model.traverse(_find);
                    this.roter = this.el.object3D;
                    break;

                case TYPE_GOLDMINE:
                    break;

                default:
                    console.warn('Tower init with unknown type.');

            }

            this.el.addEventListener('update-target', this.executeUpdateTargetEl);

            function _find(child) {

                if (child.name === 'roter') {

                    self.roter = child;

                }
                if (child.name === 'muzzle') {

                    self.muzzle = child;

                }

            }

        },
        update: function() {

            let currentSetting = this.setting[this.data.tier];

            this.restDuration = currentSetting.restDuration;
            this.activateDuration = currentSetting.activateDuration;
            this.range = currentSetting.range;
            this.rangeSquare = this.range * this.range;
            this.damagePoint = currentSetting.damagePoint;

            this.system.gameManager.updateTowerToTileMap(this.el.object3D.position, this.range, this.el);

            // Initial laser object.
            switch (this.data.type) {

                case TYPE_LASER:
                    if (this.laserLine === null) {

                        let laserMaterial = new THREE.LineBasicMaterial({
                            blending: THREE.AdditiveBlending,
                            color: currentSetting.laserColor,
                            transparent: true
                        });
                        let laserGeometry = new THREE.Geometry();
                        laserGeometry.vertices.push(
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(0, 0, 0)
                        );
                        this.laserLine = new THREE.Line(laserGeometry, laserMaterial);
                        this.laserLine.visible = false;
                        this.el.setObject3D('laser', this.laserLine);

                    } else {

                        this.laserLine.material.color = new THREE.Color(currentSetting.laserColor);
                        this.laserLine.material.needsUpdate = true;

                    }
                    break;

                case TYPE_CATAPULT:
                    break;

                case TYPE_GOLDMINE:
                    break;

                default:
                    console.warn('Tower update with unknown type.');

            }

        },
        tick: function(time, timeDelta) {

            if (this.data.type === TYPE_GOLDMINE || this.el.is('initializing') || this.el.is('synchronizing')) {

                return true;

            }

            if (this.el.is('activate')) {

                if (this.system.isTargetInRange(this)) {

                    this.timeCounter += timeDelta;
                    this.targetEl.object3D.getWorldPosition(this.tmpVec);
                    this.roter.lookAt(this.tmpVec);

                    if (this.timeCounter >= this.restDuration && !this.el.is('attacking')) {

                        this.el.addState('attacking');
                        this.timeCounter = 0;
                        if (this.data.type === TYPE_LASER) {

                            this.laserLine.visible = true;

                        }

                    }

                    if (this.timeCounter >= this.activateDuration && this.el.is('attacking')) {

                        this.el.removeState('attacking');
                        this.timeCounter = 0;
                        if (this.data.type === TYPE_LASER) {

                            this.laserLine.visible = false;

                        }

                    }

                    if (this.el.is('attacking')) {

                        this.system.onFire(this);

                    }

                } else {

                    this.el.removeState('activate');
                    this.el.removeState('attacking');
                    this.timeCounter = 0;
                    this.targetEl = undefined;
                    if (this.data.type === TYPE_LASER) {

                        this.laserLine.visible = false;

                    }

                }

            } else {

                // this.targetEl = this.system.getNearestEnemy(this);
                this.requestUpdateTargetEl(this.system.getNearestEnemy(this));
                if (this.targetEl !== undefined) {

                    this.el.addState('activate');
                    this.timeCounter = 0;

                }

            }

        },
        remove: function() {

            this.system.gameManager.updateTowerToTileMap(this.el.object3D.position, this.range, this.el, true);
            this.system.cacheMesh(this);

            // this.el.removeAttribute('animation-mixer');
            this.el.removeObject3D('mesh');
            this.el.removeObject3D('laser');

            delete this.setting;
            delete this.targetEl;
            delete this.targetFac;
            delete this.timeCounter;
            delete this.restDuration;
            delete this.activateDuration;
            delete this.range;
            delete this.rangeSquare;
            delete this.damagePoint;
            delete this.laserLine;
            delete this.tmpVec;
            delete this.enemiesInRange;
            delete this.laserAttackCount;
            delete this.roter;
            delete this.muzzle;

        },
        upgradeTier: function() {

            if (this.data.tier < this.setting.length) {

                this.el.setAttribute('tower', {
                    tier: this.data.tier + 1
                });

            }

        },
        isMaxTier: function() {

            return this.data.tier >= this.setting.length - 1;

        },
        requestUpdateTargetEl: function(targetEl) {

            if (targetEl === undefined) {

                return true;

            }

            this.el.addState('synchronizing');
            this.system.networkManager.emit('playingEvent', {
                event_name: 'tower_request_update_target',
                id: this.el.id,
                enemy_id: targetEl.id
            });

        },
        executeUpdateTargetEl: function(evt) {

            this.targetEl = this.system.gameManager.dynamicScene.querySelector('#' + evt.detail.enemy_id);
            this.el.removeState('synchronizing');

        }

    });
})();
// add cash to line 31
