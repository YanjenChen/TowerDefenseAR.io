(() => {
    const MAX_TIER = 3;

    AFRAME.registerSystem('tower', {
        init: function() {
            this.faction = {
                A: {},
                B: {}
            };
            this.faction.A.enemies = [];
            this.faction.B.enemies = [];
        },
        updateEnemies: function(fac) {
            //if (this.faction[fac].enemies === this.el.systems['enemy'].faction[fac].enemies)
            //	console.warn('Redundent operation between tower and enemy.');

            this.faction[fac].enemies = this.el.systems['enemy'].faction[fac].enemies;
        }
    });

    AFRAME.registerComponent('tower', {
        schema: {
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            },
            type: {
                type: "string",
                default: "laser",
                oneOf: ['laser', 'missile']
            },
            tier: {
                type: "number",
                default: 0
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;


            this.setting = this.gameManager.settings.tower;


            this.el.setAttribute('gltf-model', '#' + this.setting.common.mesh);
            this.el.object3D.scale.copy(this.gameManager.object3DPrototypes[this.setting.common.mesh].model.scale);
            // this.el.setObject3D('mesh', this.gameManager.object3DPrototypes[this.setting.common.mesh].model.clone());

            let self = this;
            this.el.addEventListener('model-loaded', function _listener() {
                self.roter = self.el.getObject3D('mesh').children.find(x => x.name == 'roter');
                self.muzzle = self.roter.children.find(x => x.name == 'muzzle');
                self.el.setAttribute('animation-mixer', {
                    timeScale: self.setting.common.animation_timeScale,
                    loop: 'once'
                });
                self.el.removeEventListener('model-loaded', _listener);
            });


            // play create animation.
            this.el.addState('initializing');
            this.el.addEventListener('animation-finished', function _listener() {
                self.el.removeState('initializing');
                self.el.removeEventListener('animation-finished', _listener);
            });


            this.upgradeTier = this.upgradeTier.bind(this);
            this.isMaxTier = this.isMaxTier.bind(this);
            this.onFire = this.onFire.bind(this);


            // initialize tower parameters.
            this.targetEl = null;
            this.targetFac = (this.data.faction == 'A') ? 'B' : 'A';
            this.timeCounter = 0;
            this.restDuration = null;
            this.activateDuration = null;
            this.range = null;
            this.damagePoint = null;
            this.laserLine = null;
            this.tmpVec = new THREE.Vector3();


            // this.el.addEventListener('fire', this.onFire);
        },
        update: function() {
            let currentSetting = this.setting[this.data.type][this.data.tier];
            this.restDuration = currentSetting.restDuration;
            this.activateDuration = currentSetting.activateDuration;
            this.range = currentSetting.range;
            this.damagePoint = currentSetting.damagePoint;


            // Initial laser object.
            if (this.data.type == 'laser') {
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
            }
        },
        tick: function(time, timeDelta) {
            if (this.el.is('initializing'))
                return;

            if (this.el.is('activate')) {
                if (this.checkTargetDistance()) {
                    this.timeCounter += timeDelta;
                    this.targetEl.object3D.getWorldPosition(this.tmpVec);
                    this.roter.lookAt(this.tmpVec);


                    if (this.timeCounter >= this.restDuration && !this.el.is('attacking')) {
                        this.el.addState('attacking');
                        this.timeCounter = 0;
                        if (this.data.type == 'laser')
                            this.laserLine.visible = true;
                    }

                    if (this.timeCounter >= this.activateDuration && this.el.is('attacking')) {
                        this.el.removeState('attacking');
                        this.timeCounter = 0;
                        if (this.data.type == 'laser')
                            this.laserLine.visible = false;
                    }

                    if (this.el.is('attacking'))
                        this.onFire();
                    //this.el.emit('fire');
                } else {
                    this.el.removeState('activate');
                    this.el.removeState('attacking');
                    this.timeCounter = 0;
                    this.targetEl = null;
                    if (this.data.type == 'laser')
                        this.laserLine.visible = false;
                }
            } else {
                if (this.getNearestEnemy()) {
                    this.el.addState('activate');
                    this.timeCounter = 0;
                }
            }
        },
        remove: function() {
            delete this.gameManager;
            delete this.networkManager;

            delete this.setting;

            this.el.removeObject3D('laser');

            this.el.removeAttribute('gltf-model');
            this.el.removeAttribute('animation-mixer');
            // this.el.removeObject3D('mesh');

            delete this.roter;
            delete this.muzzle;

            delete this.targetEl;
            delete this.targetFac;
            delete this.timeCounter;
            delete this.restDuration;
            delete this.activateDuration;
            delete this.range;
            delete this.damagePoint;
            delete this.laserLine;
            delete this.tmpVec;

            // this.el.removeEventListener('fire', this.onFire);
        },
        checkTargetDistance: function() {
            if (this.system.faction[this.targetFac].enemies.indexOf(this.targetEl) < 0) // Prevent target doesn't exist cause null error.
                return false;
            return (this.targetEl.object3D.position.distanceTo(this.el.object3D.position) < this.range);
        },
        getNearestEnemy: function() {
            if (this.system.faction[this.targetFac].enemies.length <= 0) // Prevent empty array cause error.
                return false;

            let minDistance = Infinity;
            this.system.faction[this.targetFac].enemies.forEach(enemyEl => {
                let distance = enemyEl.object3D.position.distanceTo(this.el.object3D.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    this.targetEl = enemyEl;
                }
            });
            return (minDistance < this.range);
        },
        onFire: function() {
            if (this.gameManager.dynamicScene.querySelector('#' + this.targetEl.id)) {
                switch (this.data.type) {
                    case 'missile':
                        let missileEl = document.createElement('a-entity');
                        this.muzzle.getWorldPosition(this.tmpVec);
                        missileEl.object3D.position.copy(this.gameManager.dynamicScene.object3D.worldToLocal(this.tmpVec));
                        missileEl.setAttribute('missile', {
                            damagePoint: this.damagePoint,
                            attackRange: this.setting[this.data.type][this.data.tier].attackRange,
                            speed: this.setting[this.data.type][this.data.tier].speed,
                            targetPos: this.targetEl.object3D.position
                        });
                        this.gameManager.dynamicScene.appendChild(missileEl);
                        break;
                    case 'laser':
                        this.muzzle.getWorldPosition(this.tmpVec);
                        this.laserLine.geometry.vertices[0].copy(this.laserLine.parent.worldToLocal(this.tmpVec));

                        this.targetEl.object3D.getWorldPosition(this.tmpVec);
                        this.laserLine.geometry.vertices[1].copy(this.laserLine.parent.worldToLocal(this.tmpVec));

                        this.laserLine.geometry.verticesNeedUpdate = true;
                        this.networkManager.emit('playingEvent', {
                            event_name: 'enemy_be_attacked',
                            id: this.targetEl.id,
                            damage: this.damagePoint,
                            type: this.data.type
                        });
                        break;
                }
            }
        },
        upgradeTier: function() {
            if (this.data.tier < MAX_TIER)
                this.el.setAttribute('tower', {
                    tier: this.data.tier + 1
                });
        },
        isMaxTier: function() {
            return this.data.tier >= MAX_TIER - 1;
        }
    });
})();
