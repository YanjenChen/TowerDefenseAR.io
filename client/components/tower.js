(() => {
    AFRAME.registerComponent('tower', {
        schema: {
            type: {
                type: "string",
                default: "default"
            }
        },
        init: function() {
            this.el.enemies = [];
            this.el.addEventListener('enemy-spawned');
            this.el.addEventListener('enemy-despawned');
        },
        tick: function(time, timeDelta) {

        },
        onEnemySpawned: function(evt) {
            console.log('push', evt.detail.el, 'into enemies list.');
            this.el.enemies.push(evt.detail.el);
        },
        onEnemyDespawned: function(evt) {
            this.el.enemies.push(evt.detail.el);
        }
    });
})();