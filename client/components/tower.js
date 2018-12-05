(() => {
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
            this.faction[fac].enemies = document.querySelector('a-scene').systems['enemy'].faction[fac].enemies;
        }
    });

    AFRAME.registerComponent('tower', {
        schema: {
            dps: {
                type: "number",
                default: 1
            },
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            },
            range: {
                type: "number",
                default: 10
            },
            type: {
                type: "string",
                default: "default"
            }
        },
        init: function() {
            // load fort base.
            this.fortBase = document.createElement('a-entity');
            this.fortBase.setAttribute('gltf-model', '#fort-base');
            this.el.appendChild(this.fortBase);
            // load fort rotation part.
            this.rotationPart = document.createElement('a-entity');
            this.rotationPart.setAttribute('gltf-model', '#fort');
            this.rotationPart.setAttribute('animation-mixer', {
                timeScale: 0.8,
                loop: 'once'
            });
            // set fire point.
            this.firePoint = document.createElement('a-entity');
            this.firePoint.setAttribute('position', '0 4.831 3.5');
            this.rotationPart.appendChild(this.firePoint);
            //this.rotationPart.setAttribute('position', '0 2.51 0');
            this.el.appendChild(this.rotationPart);

            this.el.setAttribute('scale', '0.15 0.15 0.15');

            this.targetEl = null;
            this.targetFac = (this.data.faction == 'A') ? 'B' : 'A';
            this.duration = 1000 / this.data.dps; // Unit is (ms).
            this.timeCounter = 0;
            this.el.addEventListener('fire', this._onFire.bind(this));

            let self = this;
            this.el.addState('initializing');
            this.rotationPart.addEventListener('animation-finished', function() {
                self.el.removeState('initializing');
                self.rotationPart.removeEventListener('animation-finished', this);
            });
        },
        tick: function(time, timeDelta) {
            if (this.el.is('initializing'))
                return;

            if (this.el.is('activate')) {
                if (this._checkTargetDistance()) {
                    let p = new THREE.Vector3();
                    this.targetEl.object3D.getWorldPosition(p);
                    this.rotationPart.object3D.lookAt(p);

                    this.timeCounter += timeDelta;
                    if (this.timeCounter >= this.duration) {
                        this.el.emit('fire');
                        this.timeCounter = 0;
                    }
                } else {
                    // ONLY USE IN DEVELOPER TESTING
                    /*
                    this.targetEl.setAttribute('glow', {
                    	enabled: false
                    });
                    */
                    ////////////////////////////////

                    this.targetEl = null;
                    this.el.removeState('activate');
                }
            } else {
                if (this._getNearestEnemy()) {
                    // ONLY USE IN DEVELOPER TESTING
                    /*
                    this.targetEl.setAttribute('glow', {
                        enabled: true
                    });
					*/
                    ////////////////////////////////

                    this.el.addState('activate');
                }
            }
        },
        remove: function() {
            // ONLY USE IN DEVELOPER TESTING
            /*
            if (this.targetEl != null)
                this.targetEl.setAttribute('glow', {
                    enabled: false
                });
			*/
            ////////////////////////////////
            delete this.fortBase;
            delete this.rotationPart;
            delete this.firePoint;
            delete this.targetEl;
            delete this.targetFac;
            delete this.duration;
            delete this.timeCounter;
            this.el.removeEventListener('fire', this._onFire.bind(this));
        },
        _checkTargetDistance: function() {
            if (this.system.faction[this.targetFac].enemies.indexOf(this.targetEl) < 0) // Prevent target doesn't exist cause null error.
                return false;
            let p = new THREE.Vector3();
            this.targetEl.object3D.getWorldPosition(p);
            return (this.el.parentNode.object3D.worldToLocal(p).distanceTo(this.el.object3D.position) < this.data.range);
        },
        _getNearestEnemy: function() {
            if (this.system.faction[this.targetFac].enemies.length <= 0) // Prevent empty array cause error.
                return false;

            var minDistance = Infinity;
            this.system.faction[this.targetFac].enemies.forEach((enemyEl) => {
                let p = new THREE.Vector3();
                enemyEl.object3D.getWorldPosition(p);
                var distance = this.el.parentNode.object3D.worldToLocal(p).distanceTo(this.el.object3D.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    this.targetEl = enemyEl;
                }
            });
            return this._checkTargetDistance();
        },
        _onFire: function() {
            if (this.el.sceneEl.querySelector('#' + this.targetEl.id)) {
                var bulletEl = document.createElement('a-entity');
                let p = new THREE.Vector3();
                this.firePoint.object3D.getWorldPosition(p);
                bulletEl.object3D.position.copy(this.el.sceneEl.systems['tdar-game'].sceneEntity.object3D.worldToLocal(p));
                bulletEl.setAttribute('bullet', {
                    damagePoint: 1,
                    maxRange: this.data.range,
                    speed: 20,
                    target: '#' + this.targetEl.id
                });
                this.el.sceneEl.systems['tdar-game'].sceneEntity.appendChild(bulletEl);
            }
        }
    });
})();
