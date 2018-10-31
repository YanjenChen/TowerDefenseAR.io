(() => {
    AFRAME.registerComponent('wave-spawner', {
        schema: {
            amount: {
                type: "number",
                default: 3
            },
            duration: {
                type: "number",
                default: 5000
            },
            timeOffSet: {
                type: "number",
                default: 750
            }
        },
        init: function() {
            this.el.timeCounter = 0;
            this.el.spawnCounter = 0;
            this.el.addState('activate');
        },
        tick: function(time, timeDelta) {
            if (this.el.is('activate')) {
                if (this.el.timeCounter > this.data.timeOffSet) {
                    this._spawnEnemy({});
                    if (this.el.spawnCounter++ > this.data.amount) {
                        this.el.spawnCounter = 0;
                        this.el.removeState('activate');
                    }
                    this.el.timeCounter = 0
                } else
                    this.el.timeCounter += timeDelta;
            } else {
                if (this.el.timeCounter > this.data.duration)
                    this.el.addState('activate');
                else
                    this.el.timeCounter += timeDelta;
            }
        },
        _spawnEnemy: function(schema) {
            var enemyEl = document.createElement('a-entity');
            enemyEl.setAttribute('enemy', schema);
            document.querySelector('a-scene').appendChild(enemyEl);
            this.el.spawnCounter++;
        }
    });
})();