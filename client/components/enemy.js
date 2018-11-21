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
            //this._idCounter = 0;
        },
        registerEnemy: function(el) {
            var fac = el.components.enemy.data.faction;
            //el.setAttribute('id', 'enemy-' + (this._idCounter++).toString());
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
            id: {
                type: 'string',
                default: ''
            },
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
            },
            damage: {
                type: 'number',
                default: 1
            },
            targetCastle: {
                type: 'selector',
                default: null
            }
        },
        init: function() {
            //console.log('Initial enemy.');
            this.currentHP = this.data.healthPoint;
            this.el.setAttribute('id', this.data.id);

            /*
            this.el.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 0.4,
                segmentsWidth: 4,
                segmentsHeight: 4
            });
            */
            this.el.setAttribute('gltf-model', '#knight');
            this.el.setAttribute('animation-mixer', 'timeScale: 2.7');
            this.el.setAttribute('scale', '0.5 0.5 0.5')
            this.system.registerEnemy(this.el);
            this.el.setAttribute('moveonpath', {
                path: '#' + this.data.faction + 'faction' + this.data.type + 'path',
                speed: this.data.speed
            });
            this.el.addEventListener('be-attacked', this._onBeAttacked.bind(this));
            this.el.addEventListener('movingended', this._onArrived.bind(this));
        },
        remove: function() {
            delete this.currentHP;
            this.system.unregisterEnemy(this.el);
            this.el.removeEventListener('be-attacked', this._onBeAttacked.bind(this));
            this.el.removeEventListener('movingended', this._onArrived.bind(this));
        },
        _onArrived: function() {
            this.data.targetCastle.emit('castle-be-attacked', {
                damage: this.data.damage
            });
            this.el.parentNode.removeChild(this.el);
        },
        _onBeAttacked: function(evt) {
            //console.log(this.el.id + ' be attacked.');

            this.currentHP -= evt.detail.damage;
            if (this.currentHP <= 0) {
                this.el.parentNode.removeChild(this.el);
            }
        }
    });
})();