(() => {

    'use strict';

    const TIME_RATIO = 0.001;

    const COMPONENT_NAME = 'cannonball';
    const COMPONENT_PREFIX = 'cannonball-'
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

            let self = this;

            this.el.addEventListener('gamemodelloaded', function _init() {

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        }

    });

    AFRAME.registerComponent(COMPONENT_NAME, {

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
            this.completeDist = 0;
            this.attackRangeSquare = this.data.attackRange * this.data.attackRange;

            this.onMovingEnded = this.onMovingEnded.bind(this);

        },
        tick: function(time, timeDelta) {

            if (this.el.is('endofpath')) {

                return true;

            }

            this.completeDist += this.data.speed * timeDelta * TIME_RATIO;
            if (this.completeDist >= this.totalDist) {

                this.el.object3D.position.copy(this.curve.getPoint(1));
                this.el.addState('endofpath');
                this.onMovingEnded();

            } else {

                this.el.object3D.position.copy(this.curve.getPoint(this.completeDist / this.totalDist));

            }

        },
        remove: function() {

            this.el.removeAttribute('geometry');

            delete this.curve;
            delete this.totalDist;
            delete this.completeDist;
            delete this.attackRangeSquare;

        },
        onMovingEnded: function() {

            let unitList = this.el.sceneEl.systems['unit'].unitList;
            let self = this;

            if (this.data.explodeAnimation) {

                let explosionEl = document.createElement('a-entity');
                explosionEl.object3D.position.copy(this.el.object3D.position);
                explosionEl.setAttribute('explosion', {});
                this.system.gameManager.dynamicScene.appendChild(explosionEl);

            }

            // Attack enemy if is in attack range.
            for (let key in unitList) {

                unitList[key].forEach(unit => {

                    let distance = self.el.object3D.position.distanceToSquared(unit.el.object3D.position);
                    if (distance < self.attackRangeSquare) {

                        self.system.networkManager.emit('playingEvent', {
                            event_name: 'enemy_be_attacked',
                            id: unit.el.id,
                            damage: self.data.damagePoint,
                            type: 'missile'
                        });

                    }

                });

            }
            // remove self after attacked.
            this.el.parentNode.removeChild(this.el);

        }

    });

})();
