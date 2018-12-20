(() => {
    AFRAME.registerComponent('missile', {
        schema: {
            damagePoint: {
                type: 'number',
                default: 100
            },
            attackRange: {
                type: 'number',
                default: 0.5
            },
            speed: {
                type: 'number',
                default: 0.1
            },
            timeRatio: {
                type: 'number',
                default: 0.001
            },
            targetPos: {
                // Target positio relative to dynamicSceneEl.
                type: 'vec3',
                default: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            },
            explodeAnimation: {
                type: 'boolean',
                default: true
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

            let p3 = this.data.targetPos.clone();
            let p1 = this.el.object3D.position.clone();
            let p2 = p3.clone().sub(p1).multiplyScalar(0.5).add(p1);
            p2.setY(p2.y + 3); // create Y range.

            // Temporary set mesh.
            this.el.setAttribute('geometry', {
                primitive: "sphere",
                radius: 0.2,
                segmentsHeight: 16,
                segmentsWidth: 8
            });

            let projectionLine = new THREE['CatmullRomCurve3']([p1, p3]);
            this.curve = new THREE['CatmullRomCurve3']([p1, p2, p3]);
            this.totalDist = projectionLine.getLength();
            this.speed = this.data.speed / (2 * Math.PI);
            this.timeCounter = 0;
            this.completeDist = 0;

            this.el.addEventListener('movingended', this.onMovingEnded.bind(this));
        },
        tick: function(time, timeDelta) {
            if (!this.el.is('endofpath')) {
                this.timeCounter += (timeDelta * this.data.timeRatio);
                this.completeDist += this.data.speed * this.timeCounter;

                if (this.completeDist >= this.totalDist) {
                    let p = this.curve.getPoint(1);
                    this.el.object3D.position.copy(p);
                    this.el.addState('endofpath');
                    this.el.emit('movingended');
                } else {
                    let p = this.curve.getPoint(this.completeDist / this.totalDist);
                    this.el.object3D.position.copy(p);
                    //this.el.object3D.lookAt(this.el.parentNode.object3D.localToWorld(p));
                }
            }
        },
        remove: function() {
            delete this.curve;
            delete this.totalDist;
            delete this.speed;
            delete this.timeCounter;
            delete this.completeDist;
        },
        onMovingEnded: function() {
            let enemySystem = this.el.sceneEl.systems['enemy'];
            let enemyList = enemySystem.faction.A.enemies.concat(enemySystem.faction.B.enemies);
            var self = this;

            if (this.data.explodeAnimation) {
                var explosionEl = document.createElement('a-entity');
                explosionEl.object3D.position.copy(this.el.object3D.position);
                explosionEl.setAttribute('explosion', {});
                this.gameManager.dynamicScene.appendChild(explosionEl);
            }

            // Attack enemy if is in attack range.
            enemyList.forEach((enemyEl) => {
                let distance = self.el.object3D.position.distanceTo(enemyEl.object3D.position);
                if (distance < self.data.attackRange) {
                    self.networkManager.emit('playingEvent', {
                        event_name: 'enemy_be_attacked',
                        id: enemyEl.getAttribute('id'),
                        damage: self.data.damagePoint
                    });
                }
            });

            // remove self after attacked.
            this.el.parentNode.removeChild(this.el);
        }
    });
})();
