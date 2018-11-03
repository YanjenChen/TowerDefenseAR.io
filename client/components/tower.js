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
            this.targetEl = null;
            this.targetFac = (this.data.faction == 'A') ? 'B' : 'A';
            this.duration = 1000 / this.data.dps; // Unit is (ms).
            this.timeCounter = 0;
            this.el.addEventListener('fire', this._onFire.bind(this));
        },
        tick: function(time, timeDelta) {
            if (this.el.is('activate')) {
                if (this._checkTargetDistance()) {
                    this.el.object3D.lookAt(this.targetEl.object3D.getWorldPosition());

                    // TESTING PART
                    this.timeCounter += timeDelta;
                    if (this.timeCounter >= this.duration) {
                        this.el.emit('fire');
                        this.timeCounter = 0;
                    }
                } else {
                    // ONLY USE IN DEVELOPER TESTING
                    this.targetEl.setAttribute('glow', {
                        enabled: false
                    });
                    ////////////////////////////////

                    this.targetEl = null;
                    this.el.removeState('activate');
                }
            } else {
                if (this._getNearestEnemy()) {
                    // ONLY USE IN DEVELOPER TESTING
                    this.targetEl.setAttribute('glow', {
                        enabled: true
                    });
                    ////////////////////////////////

                    this.el.addState('activate');
                    this.el.object3D.lookAt(this.targetEl.object3D.getWorldPosition());
                }
            }
        },
        remove: function() {
            delete this.targetEl;
            delete this.targetFac;
            delete this.duration;
            delete this.timeCounter;
            this.el.removeEventListener('fire', this._onFire.bind(this));
        },
        _checkTargetDistance: function() {
            if (this.system.faction[this.targetFac].enemies.indexOf(this.targetEl) < 0) // Prevent target doesn't exist cause null error.
                return false;

            return (this.targetEl.object3D.getWorldPosition().distanceTo(this.el.object3D.getWorldPosition()) < this.data.range);
        },
        _getNearestEnemy: function() {
            if (this.system.faction[this.targetFac].enemies.length <= 0) // Prevent empty array cause error.
                return false;

            var minDistance = Infinity;
            this.system.faction[this.targetFac].enemies.forEach((enemyEl) => {
                var distance = enemyEl.object3D.getWorldPosition().distanceTo(this.el.object3D.getWorldPosition());
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
                bulletEl.setAttribute('position', this.el.object3D.position);
                bulletEl.setAttribute('bullet', {
                    damagePoint: 1,
                    maxRange: this.data.range,
                    speed: 20,
                    target: '#' + this.targetEl.id
                });
                this.el.sceneEl.appendChild(bulletEl);
            }
        }
    });
})();