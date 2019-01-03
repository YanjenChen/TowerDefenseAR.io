(() => {
    'use strict';

    AFRAME.registerComponent('spawner', {
        schema: {
            amount: {
                type: 'number',
                default: 1
            },
            duration: {
                type: 'number',
                default: 5000
            },
            faction: {
                type: 'string',
                default: 'RED',
                oneOf: ['RED', 'BLACK']
            },
            timeOffSet: {
                type: 'number',
                default: 1000
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
            this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

            this.setting = this.gameManager.settings.spawner;

            let model = THREE.AnimationUtils.clone(this.gameManager.object3DPrototypes[this.data.type + '-' + this.setting.common.mesh].model);
            this.el.setObject3D('mesh', model);

            this.onSpawnEnemy = this.onSpawnEnemy.bind(this);

            this.timeCounter = 0;
            this.spawnCounter = 0;

            this.el.addState('activate');

            this.el.addEventListener('spawn_enemy', this.onSpawnEnemy);
        },
        tick: function(time, timeDelta) {
            this.timeCounter += timeDelta;

            if (this.el.is('activate') && this.timeCounter > this.data.timeOffSet) {
                if (!this.el.id)
                    console.warn('Wave spawner does not receive id.');

                this.networkManager.emit('playingEvent', {
                    event_name: 'wave_spawner_request_spawn_enemy',
                    id: this.el.id,
                    ws_faction: this.data.faction,
                    type: 'normal',
                    time: time
                });

                this.timeCounter = 0
            } else if (this.timeCounter > this.data.duration) {
                this.el.addState('activate');
            }
        },
        remove: function() {
            this.el.removeObject3D('mesh');

            delete this.gameManager;
            delete this.networkManager;
            delete this.uiManager;
            delete this.timeCounter;
            delete this.spawnCounter;

            this.el.removeEventListener('spawn_enemy', this.onSpawnEnemy);
        },
        onSpawnEnemy: function(evt) {
            this.spawnCounter++;

            if (this.spawnCounter > this.data.amount) {
                this.spawnCounter = 0;
                this.el.removeState('activate');

                return;
            }

            var enemyEl = document.createElement('a-entity');
            this.gameManager.dynamicScene.appendChild(enemyEl);
            enemyEl.object3D.position.copy(this.el.object3D.position);
            enemyEl.setAttribute('enemy', evt.detail);
        }
    });
})();
