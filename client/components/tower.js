(() => {
	AFRAME.registerComponent('tower', {
		schema: {
			range: {
				type: "number",
				default: 10
			},
			type: {
				type: "string",
				default: "default"
			}
		},
		init: function() {
			this.el.enemiesId = [];
			this.el.targetId = null;
			this.el.addEventListener('enemy-spawned', this.onEnemySpawned.bind(this));
			this.el.addEventListener('enemy-despawned', this.onEnemyDespawned.bind(this));
		},
		tick: function() {
			//console.log(this.el.targetId);
			if (this.el.is('activate')) {
				if (this._checkTargetDistance()) {
					//console.log(this.el.sceneEl.querySelector('#' + this.el.targetId).object3D.getWorldPosition());
					this.el.object3D.lookAt(this.el.sceneEl.querySelector('#' + this.el.targetId).object3D.getWorldPosition());
				} else {
					this.el.targetId = null;
					this.el.removeState('activate');
				}
			} else {
				if (this._getNearestEnemy()) {
					this.el.addState('activate');
					this.el.object3D.lookAt(this.el.sceneEl.querySelector('#' + this.el.targetId).object3D.getWorldPosition());
				}
			}
		},
		onEnemySpawned: function(evt) {
			this.el.enemiesId.push(evt.detail.id);
		},
		onEnemyDespawned: function(evt) {
			if (this.el.enemiesId.indexOf(evt.detail.id) > -1)
				this.el.enemiesId.splice(this.el.enemiesId.indexOf(evt.detail.id), 1);
		},
		_checkTargetDistance: function() {
			if (this.el.enemiesId.indexOf(this.el.targetId) < 0) // Prevent target doesn't exist cause null error.
				return false;

			return (this.el.sceneEl.querySelector('#' + this.el.targetId).object3D.getWorldPosition().distanceTo(this.el.object3D.getWorldPosition()) < this.data.range);
		},
		_getNearestEnemy: function() {
			if (this.el.enemiesId.length <= 0) // Prevent empty array cause error.
				return false;

			var minDistance = Infinity;
			this.el.enemiesId.forEach((enemyId) => {
				var distance = this.el.sceneEl.querySelector('#' + enemyId).object3D.getWorldPosition().distanceTo(this.el.object3D.getWorldPosition());
				if (distance < minDistance) {
					minDistance = distance;
					this.el.targetId = enemyId;
				}
			});
			return this._checkTargetDistance();
		}
	});
})();
