(() => {
    AFRAME.registerComponent('wave-spawner', {
        schema: {
            id: {
                type: 'string',
                default: ''
            },
            amount: {
                type: 'number',
                default: 3
            },
            duration: {
                type: 'number',
                default: 10000
            },
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            },
            timeOffSet: {
                type: 'number',
                default: 500
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

            this.el.setAttribute('id', this.data.id);
            this.timeCounter = 0;
            this.spawnCounter = 0;
            this.el.addState('activate');
            this.el.addEventListener('spawn_enemy', this._spawnEnemy.bind(this));
        },
        tick: function(time, timeDelta) {
            if (this.el.is('activate') && this.data.amount > 0) {
                if (this.timeCounter > this.data.timeOffSet) {
                    this.spawnCounter++;
                    /* following is local method */
                    /*
                    this._spawnEnemy({
                        faction: this.data.faction,
                        healthPoint: 6,
                        speed: 4
                    });
                    */
                    this.networkManager.emit('playingEvent', {
                        event_name: 'wave_spawner_request_spawn_enemy',
                        id: this.data.id,
                        ws_faction: this.data.faction,
                        type: 'default'
                    });
                    //console.warn('WSID: ' + this.data.id);

                    this.timeCounter = 0
                } else
                    this.timeCounter += timeDelta;
            } else {
                if (this.timeCounter > this.data.duration)
                    this.el.addState('activate');
                else
                    this.timeCounter += timeDelta;
            }
        },
        remove: function() {
            delete this.timeCounter;
            delete this.spawnCounter;
        },
        _spawnEnemy: function(evt) {
            var enemyEl = document.createElement('a-entity');
            enemyEl.setAttribute('enemy', evt.detail);
            this.gameManager.dynamicScene.appendChild(enemyEl);

            if (this.spawnCounter >= this.data.amount) {
                this.spawnCounter = 0;
                this.el.removeState('activate');
            }
        }
    });
})();
