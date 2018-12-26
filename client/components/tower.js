(() => {
    const MAX_TIER = 3;

    AFRAME.registerSystem('tower', {
        init: function() {},
        getNearestEnemy: function(component) {

            //console.log(component.enemiesInRange);

            if (component.enemiesInRange.length === 0)
                return undefined;

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

            if (component.targetEl.components['enemy'] === undefined || component.targetEl.components['enemy'].currentHP <= 0)
                return false;

            return (component.targetEl.object3D.position.distanceToSquared(component.el.object3D.position) < component.rangeSquare);

        },
        onFire: function(component) {

            switch (component.data.type) {

                case 'missile':
                    let missileEl = document.createElement('a-entity');
                    component.muzzle.getWorldPosition(component.tmpVec);
                    missileEl.object3D.position.copy(component.gameManager.dynamicScene.object3D.worldToLocal(component.tmpVec));
                    missileEl.setAttribute('missile', {
                        damagePoint: component.damagePoint,
                        attackRange: component.setting[component.data.type][component.data.tier].attackRange,
                        speed: component.setting[component.data.type][component.data.tier].speed,
                        targetPos: component.targetEl.object3D.position
                    });
                    component.gameManager.dynamicScene.appendChild(missileEl);
                    break;

                case 'laser':
                    component.muzzle.getWorldPosition(component.tmpVec);
                    component.laserLine.geometry.vertices[0].copy(component.laserLine.parent.worldToLocal(component.tmpVec));

                    component.targetEl.object3D.getWorldPosition(component.tmpVec);
                    component.laserLine.geometry.vertices[1].copy(component.laserLine.parent.worldToLocal(component.tmpVec));

                    component.laserLine.geometry.verticesNeedUpdate = true;
                    component.networkManager.emit('playingEvent', {
                        event_name: 'enemy_be_attacked',
                        id: component.targetEl.id,
                        damage: component.damagePoint,
                        type: component.data.type
                    });
                    break;

            }

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


            // this.el.setAttribute('gltf-model', '#' + this.setting.common.mesh);
            // this.el.object3D.scale.copy(this.gameManager.object3DPrototypes[this.setting.common.mesh].model.scale);
            let model = THREE.AnimationUtils.clone(this.gameManager.object3DPrototypes[this.setting.common.mesh].model);
            model.animations = this.gameManager.object3DPrototypes[this.setting.common.mesh].model.animations;
            this.el.setObject3D('mesh', model);


            this.roter = model.children.find(x => x.name == 'roter');
            this.muzzle = this.roter.children.find(x => x.name == 'muzzle');
            this.el.setAttribute('animation-mixer', {
                timeScale: this.setting.common.animation_timeScale,
                loop: 'once'
            });


            // play create animation.
            let self = this;
            this.el.addState('initializing');
            this.el.addEventListener('animation-finished', function _listener() {
                self.el.removeState('initializing');
                self.el.removeEventListener('animation-finished', _listener);
            });


            this.upgradeTier = this.upgradeTier.bind(this);
            this.isMaxTier = this.isMaxTier.bind(this);


            // initialize tower parameters.
            this.targetEl = undefined;
            this.targetFac = (this.data.faction == 'A') ? 'B' : 'A';
            this.timeCounter = 0;
            this.restDuration = null;
            this.activateDuration = null;
            this.range = null;
            this.rangeSquare = null;
            this.damagePoint = null;
            this.laserLine = null;
            this.tmpVec = new THREE.Vector3();
            this.enemiesInRange = [];

        },
        update: function() {

            let currentSetting = this.setting[this.data.type][this.data.tier];
            this.restDuration = currentSetting.restDuration;
            this.activateDuration = currentSetting.activateDuration;
            this.range = currentSetting.range;
            this.rangeSquare = this.range * this.range;
            this.damagePoint = currentSetting.damagePoint;


            this.gameManager.updateTowerToTileMap(this.el.object3D.position, this.range, this.el);


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
                if (this.system.isTargetInRange(this)) {
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
                        this.system.onFire(this);
                    //this.el.emit('fire');
                } else {
                    this.el.removeState('activate');
                    this.el.removeState('attacking');
                    this.timeCounter = 0;
                    this.targetEl = undefined;
                    if (this.data.type == 'laser')
                        this.laserLine.visible = false;
                }
            } else {
                this.targetEl = this.system.getNearestEnemy(this);
                if (this.targetEl !== undefined) {
                    this.el.addState('activate');
                    this.timeCounter = 0;
                }
            }

        },
        remove: function() {

            this.gameManager.updateTowerToTileMap(this.el.object3D.position, this.range, this.el, true);

            delete this.gameManager;
            delete this.networkManager;

            delete this.setting;

            this.el.removeObject3D('laser');

            // this.el.removeAttribute('gltf-model');
            this.el.removeAttribute('animation-mixer');
            this.el.removeObject3D('mesh');

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
            delete this.enemiesInRange;

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
