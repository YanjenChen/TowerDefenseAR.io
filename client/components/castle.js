(() => {
	AFRAME.registerComponent('castle', {
		schema: {
			faction: {
				type: 'string',
				default: 'A',
				oneOf: ['A', 'B']
			},
			healthPoint: {
				type: "number",
				default: 100
			}
		},
		init: function() {
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

			this.currentHP = this.data.healthPoint;

			this.onBeAttacked = this.onBeAttacked.bind(this);
			this.onGetDamage = this.onGetDamage.bind(this);

			if (this.data.faction == this.el.sceneEl.systems['tdar-game'].data.userFaction)
				this.uiManager.updateHealthPoint(this.currentHP);

			this.el.addEventListener('enemy-arrived', this.onBeAttacked);
			this.el.addEventListener('castle-get-damage', this.onGetDamage);
		},
		remove: function() {
			delete this.networkManager;
			delete this.uiManager;
			delete this.currentHP;

			this.el.removeEventListener('enemy-arrived', this.onBeAttacked);
			this.el.removeEventListener('castle-get-damage', this.onGetDamage);
		},
		onBeAttacked: function(evt) {
			if (!this.el.id)
				console.warn('Castle does not receive id.');

			this.networkManager.emit('playingEvent', {
				event_name: 'castle_be_attacked',
				damage: evt.detail.damage,
				id: this.el.id
			});
		},
		onGetDamage: function(evt) {
			this.currentHP -= evt.detail.damage;
			if (this.data.faction == this.el.sceneEl.systems['tdar-game'].data.userFaction)
				this.uiManager.updateHealthPoint(this.currentHP);

			if (this.currentHP <= 0) {
				console.log("Gameover");
			}
		}
	});
})();
