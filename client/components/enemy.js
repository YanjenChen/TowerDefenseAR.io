(() => {
    //var ID_COUNTER = 0;

    AFRAME.registerSystem('enemy', {
        init: function() {
            this.faction = {
                A: {},
                B: {}
            };
            this.faction.A.enemies = [];
            this.faction.B.enemies = [];
            this._idCounter = 0;
        },
        registerEnemy: function(el) {
            var fac = el.components.enemy.data.faction;
            el.setAttribute('id', 'enemy-' + (this._idCounter++).toString());
            this.faction[fac].enemies.push(el);
            document.querySelector('a-scene').systems['tower'].updateEnemies(fac);
        },
        unregisterEnemy: function(el) {
            var fac = el.components.enemy.data.faction;
            var index = this.faction[fac].enemies.indexOf(el);
            if (index > -1) {
                this.faction[fac].enemies.splice(index, 1);
                document.querySelector('a-scene').systems['tower'].updateEnemies(fac);
            }
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
                type: 'number',
                default: 1
            },
            speed: {
                type: 'number',
                default: 6
            },
            type: {
                type: 'string',
                default: 'default'
            }
        },
        init: function() {
            //console.log('Initial enemy.');
            this.el.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 0.4,
                segmentsWidth: 4,
                segmentsHeight: 4
            });
            this.system.registerEnemy(this.el);
            this.el.setAttribute('moveonpath', {
                path: '#' + this.data.faction + 'faction' + this.data.type + 'path',
                speed: this.data.speed
            });
            this.el.addEventListener('movingended', this._onArrived.bind(this));
        },
        remove: function() {
            this.system.unregisterEnemy(this.el);
            this.el.removeEventListener('movingended', this._onArrived.bind(this));
        },
        _onArrived: function() {
            //console.log('Enemy arrived target point.');
            this.el.parentNode.removeChild(this.el);
        }
    });
})();