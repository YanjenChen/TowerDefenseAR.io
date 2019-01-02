(() => {
    const ANIMATION_GROUP_NUM = 4;
    const BAR_COLOR_GREEN = 0x4ecdc4;
    const BAR_COLOR_RED = 0xff6b6b;

    AFRAME.registerSystem('enemy', {
        init: function() {
            this.faction = {
                A: {},
                B: {}
            };
            this.faction.A.enemies = [];
            this.faction.B.enemies = [];
            this.el.addEventListener('systemupdatepath', this.onPathUpdated.bind(this));

            // Set animation object groups.
            // REMIND: THREE.AnimationObjectGroup has a method called .uncache() to Deallocates all memory resources for the passed objects of this AnimationObjectGroup.
            this.animationGroups = [];
            this.animationMixers = [];
            this.animationActions = [];
            let self = this;
            this.el.addEventListener('gamemodelloaded', function _setAnimation() {
                let gameManager = self.el.systems['tdar-game'].gameManager;
                for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {
                    let group = new THREE.AnimationObjectGroup();
                    let mixer = new THREE.AnimationMixer(group);
                    let action = mixer.clipAction(gameManager.object3DPrototypes[gameManager.settings.enemy.common.mesh].model.animations[0]);
                    action.setEffectiveTimeScale(gameManager.settings.enemy.common.animation_timeScale);
                    action.play();
                    mixer.update((1 / 60) / ANIMATION_GROUP_NUM * i); // provide time offset to different group.

                    self.animationGroups.push(group);
                    self.animationMixers.push(mixer);
                    self.animationActions.push(action);
                }

                self.el.removeEventListener('gamemodelloaded', _setAnimation);
            });
        },
        tick: function(time, timeDelta) {
            if (this.animationMixers.length !== ANIMATION_GROUP_NUM)
                return;

            for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {
                this.animationMixers[i].update(timeDelta / 1000);
            }
        },
        registerEnemy: function(el, obj, id) {
            var fac = el.components.enemy.data.faction;
            this.faction[fac].enemies.push(el);

            // Add to animation group.
            this.animationGroups[Math.round(id % ANIMATION_GROUP_NUM)].add(obj);
        },
        unregisterEnemy: function(el, obj, id) {
            var fac = el.components.enemy.data.faction;
            var index = this.faction[fac].enemies.indexOf(el);
            if (index > -1) {
                this.faction[fac].enemies.splice(index, 1);
            }

            // Remove from animation group.
            this.animationGroups[Math.round(id % ANIMATION_GROUP_NUM)].remove(obj);
            this.animationGroups[Math.round(id % ANIMATION_GROUP_NUM)].uncache(obj);

            /*
            let objingroup = 0;
            for (let i = 0; i < ANIMATION_GROUP_NUM; i++) {
                objingroup += this.animationGroups[i]._objects.length;
            }
            console.log('Obj3D in group: ', objingroup);
            console.log('Obj3D on field: ', this.faction.A.enemies.length + this.faction.B.enemies.length);
            */
        },
        onPathUpdated: function(evt) {
            /*
            // Use for reduce calculation.
            this.faction[evt.detail.faction == 'A' ? 'B' : 'A'].enemies.forEach(enemy => {
                enemy.addState('needupdatepath');
            });
            */
            this.faction.A.enemies.forEach(enemy => {
                enemy.addState('needupdatepath');
                enemy.components['enemy'].updatePath();
            });
            this.faction.B.enemies.forEach(enemy => {
                enemy.addState('needupdatepath');
                enemy.components['enemy'].updatePath();
            });
        }
    });

    AFRAME.registerComponent('enemy', {
        schema: {
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            },
            healthPoint: {
                // Receive from server.
                type: 'number',
                default: 1
            },
            id: {
                // Receive from server.
                type: 'number',
                default: 0
            },
            reward: {
                // Receive from server.
                type: 'number',
                default: 10
            },
            targetCastle: {
                // Receive from server.
                type: 'selector',
                default: null
            },
            timeRatio: {
                // const.
                type: 'number',
                default: 0.001
            },
            type: {
                type: 'string',
                default: 'normal',
                oneOf: ['normal', 'resistLaser', 'resistMissile']
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
            this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;
            this.cashManager = this.el.sceneEl.systems['tdar-game'].cashManager;


            this.setting = this.gameManager.settings.enemy;


            let model = THREE.AnimationUtils.clone(this.gameManager.object3DPrototypes[this.setting.common.mesh].model);
            this.el.setObject3D('mesh', model);
            let geometry = new THREE.PlaneGeometry(this.gameManager.object3DPrototypes[this.setting.common.mesh].width, 0.1);
            geometry.vertices.forEach(point => {
                point.x += this.gameManager.object3DPrototypes[this.setting.common.mesh].width / 2;
                point.y += 0.05;
            });
            let material = new THREE.MeshBasicMaterial({
                color: BAR_COLOR_GREEN,
                side: THREE.DoubleSide
            });
            let lifeBar = new THREE.Mesh(geometry, material);
            lifeBar.position.setX(-this.gameManager.object3DPrototypes[this.setting.common.mesh].width / 2);
            lifeBar.position.setY(this.gameManager.object3DPrototypes[this.setting.common.mesh].height + 0.05);
            this.el.setObject3D('lifebar', lifeBar);

            this.el.setAttribute('id', 'enemy-' + this.data.id.toString());
            this.system.registerEnemy(this.el, this.el.getObject3D('mesh'), this.data.id);


            this.onBeAttacked = this.onBeAttacked.bind(this);
            this.onArrived = this.onArrived.bind(this);
            this.updatePath = this.updatePath.bind(this);
            this.updateToTile = this.updateToTile.bind(this);

            this.speed = this.setting[this.data.type].speed;
            this.currentHP = this.data.healthPoint;
            this.line = null;
            this.lineLength = null;
            this.completeDist = 0;
            this.prevTile = this.gameManager.Utils.sceneToTile(this.el.object3D.position);
            this.lifeBar = lifeBar;

            this.el.addState('needupdatepath');
            this.updatePath();


            this.el.addEventListener('be-attacked', this.onBeAttacked);
            this.el.addEventListener('movingended', this.onArrived);
        },
        tick: function(time, timeDelta) {
            if (this.el.is('needupdatepath'))
                return;

            if (!this.el.is('endofpath')) {
                this.completeDist += this.speed * timeDelta * this.data.timeRatio;

                if (this.completeDist >= this.lineLength) {
                    this.el.addState('endofpath');
                    this.el.emit('movingended');
                } else {
                    let p = this.line.getPointAt(this.completeDist / this.lineLength);
                    let d = this.el.parentNode.object3D.localToWorld(p.clone());
                    this.el.object3D.lookAt(d);
                    this.el.object3D.position.copy(p);

                    this.updateToTile();
                }
            }
        },
        remove: function() {
            this.gameManager.removeEnemyFromTileMap(this.prevTile, this.el);
            this.system.unregisterEnemy(this.el, this.el.getObject3D('mesh'), this.data.id);

            delete this.gameManager;
            delete this.networkManager;
            delete this.uiManager;
            delete this.cashManager;

            delete this.setting;
            delete this.speed;
            delete this.currentHP;
            delete this.line;
            delete this.lineLength;
            delete this.completeDist;
            delete this.prevTile;
            delete this.lifeBar;


            // this.el.removeAttribute('gltf-model');
            // this.el.removeAttribute('animation-mixer');
            this.el.removeObject3D('mesh');
            this.el.removeObject3D('lifebar');
            this.el.removeEventListener('be-attacked', this.onBeAttacked);
            this.el.removeEventListener('movingended', this.onArrived);
        },
        onArrived: function() {
            this.data.targetCastle.emit('enemy-arrived', {
                damage: this.setting[this.data.type].damage
            });
            this.el.parentNode.removeChild(this.el);
        },
        onBeAttacked: function(evt) {
            switch (evt.detail.type) {
                case 'laser':
                    this.currentHP -= evt.detail.damage * this.setting[this.data.type].laserEffectiveness;
                    break;
                case 'missile':
                    this.currentHP -= evt.detail.damage * this.setting[this.data.type].missileEffectiveness;
                    break;
                default:
                    console.warn('Enemy receive unknown attack type.');
            }
            if (this.currentHP <= 0) {
                this.cashManager.requestUpdateCash(
                    this.data.reward,
                    this.data.faction == 'A' ? 'B' : 'A'
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
            this.line = await this.gameManager.getNewPath(this.el.object3D.position, this.data.faction);
            this.lineLength = this.line.getLength();
            this.completeDist = 0;
            this.el.removeState('needupdatepath');
        },
        updateToTile: function() {
            let p = this.gameManager.Utils.sceneToTile(this.el.object3D.position);
            if (p.x != this.prevTile.x || p.z != this.prevTile.z) {
                this.gameManager.removeEnemyFromTileMap(this.prevTile, this.el);
                this.gameManager.addEnemyToTileMap(this.el.object3D.position, this.el);
                this.prevTile = p;
            }
        }
    });
})();
