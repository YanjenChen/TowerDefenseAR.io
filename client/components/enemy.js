(() => {
    var ID_COUNTER = 0;

    AFRAME.registerComponent('enemy', {
        schema: {
            duration: {
                type: "number",
                default: 10000
            },
            healthPoint: {
                type: "number",
                default: 1
            },
            speed: {
                type: "number",
                default: 1
            },
            type: {
                type: "string",
                default: "default"
            }
        },
        init: function() {
            //console.log('Initial enemy.');
            this.el.setAttribute('id', 'enemy-' + (ID_COUNTER++).toString());
            this.el.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 0.4,
                segmentsWidth: 4,
                segmentsHeight: 4
            });
            this.el.setAttribute('moveonpath', {
                path: '#' + this.data.type + '-path',
                speed: this.data.speed
            });
            this.el.addEventListener('movingended', this.onArrived.bind(this));
            this.el.sceneEl.querySelectorAll('[tower]').forEach((towerEl) => {
                towerEl.emit('enemy-spawned', {
                    id: this.el.getAttribute('id')
                });
            });
        },
        onArrived: function() {
            //console.log('Enemy arrived target point.');
            this.el.sceneEl.querySelectorAll('[tower]').forEach((towerEl) => {
                towerEl.emit('enemy-despawned', {
                    id: this.el.getAttribute('id')
                });
            });
            this.el.parentNode.removeChild(this.el);
        }
    });
})();