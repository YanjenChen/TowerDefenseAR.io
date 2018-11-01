(() => {
    AFRAME.registerComponent('wave-spawner', {
        schema: {
            amount: {
                type: "number",
                default: 4
            },
            duration: {
                type: "number",
                default: 3000
            },
            timeOffSet: {
                type: "number",
                default: 300
            }
        },
        init: function() {
            this.timeCounter = 0;
            this.spawnCounter = 0;
            this.el.addState('activate');
        },
        tick: function(time, timeDelta) {
            if (this.el.is('activate')) {
                if (this.timeCounter > this.data.timeOffSet) {
                    this.spawnCounter++;
                    this._spawnEnemy({});
                    if (this.spawnCounter >= this.data.amount) {
                        this.spawnCounter = 0;
                        this.el.removeState('activate');
                    }
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
        _spawnEnemy: function(schema) {
            var enemyEl = document.createElement('a-entity');
            enemyEl.setAttribute('enemy', schema);
            document.querySelector('a-scene').appendChild(enemyEl);
        }
    });
})();