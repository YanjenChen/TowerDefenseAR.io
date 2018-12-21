(() => {
    AFRAME.registerSystem('enemy', {
        init: function() {
            this.faction = {
                A: {},
                B: {}
            };
            this.faction.A.enemies = [];
            this.faction.B.enemies = [];
            this.el.addEventListener('systemupdatepath', this.onPathUpdated.bind(this));
        },
        registerEnemy: function(el) {
            var fac = el.components.enemy.data.faction;
            this.faction[fac].enemies.push(el);
            this.el.systems['tower'].updateEnemies(fac);
        },
        unregisterEnemy: function(el) {
            var fac = el.components.enemy.data.faction;
            var index = this.faction[fac].enemies.indexOf(el);
            if (index > -1) {
                this.faction[fac].enemies.splice(index, 1);
                this.el.systems['tower'].updateEnemies(fac);
            }
        },
        onPathUpdated: function(evt) {
            this.faction[evt.detail.faction == 'A' ? 'B' : 'A'].enemies.forEach(enemy => {
                enemy.emit('pathupdate');
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
                type: 'string',
                default: ''
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


            this.el.setObject3D('mesh', this.gameManager.object3DPrototypes[this.setting.common.mesh].model.clone());
            this.el.setAttribute('id', this.data.id);
            this.el.setAttribute('animation-mixer', {
                timeScale: this.setting.common.animation_timeScale
            });
            this.system.registerEnemy(this.el);


            this.onBeAttacked = this.onBeAttacked.bind(this);
            this.onArrived = this.onArrived.bind(this);
            this.onPathUpdated = this.onPathUpdated.bind(this);

            this.speed = this.setting[this.data.type].speed;
            this.currentHP = this.data.healthPoint;
            this.line = null;
            this.lineLength = null;
            this.completeDist = 0;
            this.onPathUpdated();


            this.el.addEventListener('be-attacked', this.onBeAttacked);
            this.el.addEventListener('movingended', this.onArrived);
            this.el.addEventListener('pathupdate', this.onPathUpdated);
        },
        tick: function(time, timeDelta) {
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
                }
            }
        },
        remove: function() {
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

            this.system.unregisterEnemy(this.el);
            this.el.removeAttribute('animation-mixer');
            this.el.removeObject3D('mesh');
            this.el.removeEventListener('be-attacked', this.onBeAttacked);
            this.el.removeEventListener('movingended', this.onArrived);
            this.el.removeEventListener('pathupdate', this.onPathUpdated);
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
            }
        },
        onPathUpdated: function() {
            delete this.line;
            this.line = this.gameManager.getNewPath(this.el.object3D.position, this.data.faction);
            this.lineLength = this.line.getLength();
            this.completeDist = 0;
        }
    });
})();
