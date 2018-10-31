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
            this.el.addEventListener('enemy-spawned', this.onEnemySpawned.bind(this));
            this.el.addEventListener('enemy-despawned', this.onEnemyDespawned.bind(this));
        },
        tick: function() {
            //console.log(this.el.enemies);
        },
        onEnemySpawned: function(evt) {
            this.el.enemies.push(evt.detail.id);
        },
        onEnemyDespawned: function(evt) {
            if (this.el.enemies.indexOf(evt.detail.id) > -1)
                this.el.enemies.splice(this.el.enemies.indexOf(evt.detail.id), 1);
        }
    });
})();