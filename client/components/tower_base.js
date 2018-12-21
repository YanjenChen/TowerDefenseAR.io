(() => {
	AFRAME.registerComponent('tower-base', {
		schema: {
		},
		init: function() {
			this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;
			this.cashManager = this.el.sceneEl.systems['tdar-game'].cashManager;

			this.fortBase = undefined;
			this.towerEl = undefined;

			this.el.addState('empty');

			this.onStateAdded = this.onStateAdded.bind(this);
			this.onStateRemoved = this.onStateRemoved.bind(this);
			this.createLaserTower = this.createLaserTower.bind(this);
			this.createMissileTower = this.createMissileTower.bind(this);
			this.upgradeTower = this.upgradeTower.bind(this);
			this.removeTower = this.removeTower.bind(this);
			this.getUIsets = this.getUIsets.bind(this);
			this.updateUI = this.updateUI.bind(this);

			this.el.addEventListener('stateadded', this.onStateAdded);
			this.el.addEventListener('stateremoved', this.onStateRemoved);

			this.el.addEventListener('click', function(evt) {
				console.log(evt.detail.intersection.point);
			});
		},
		tick: function(time, timeDelta) {
			// ONLY USE IN DEVELOPER TESTING
			if (this.el.is('cursor-hovered'))
				this.el.setAttribute('glow', {
					enabled: true
				});
			else
				this.el.setAttribute('glow', {
					enabled: false
				});
			////////////////////////////////
		},
		remove: function() {
			delete this.towerEl;

			this.el.removeEventListener('click', this.onClick.bind(this));
		},
		onStateAdded: function(evt) {
			if (evt.detail == 'cursor-hovered') {
				this.uiManager.updateObjectControl(this.getUIsets());
			}
		},
		createLaserTower: function() {
			this.towerEl = document.createElement('a-entity');
			this.towerEl.setAttribute('tower', {
				faction: this.data.faction,
				type: 'laser',
				tier: 0
			});
			this.el.appendChild(this.towerEl);
			this.el.removeState('empty');
			this.gameManager.updateGameGrid(
				Math.floor(this.el.object3D.position.x),
				Math.floor(this.el.object3D.position.z),
				false
			);
			this.gameManager.calculatePath(this.data.faction == 'A' ? 'B' : 'A');
			this.el.sceneEl.emit('systemupdatepath', { faction: this.data.faction });
			this.updateUI();
		},
		createMissileTower: function() {
			this.towerEl = document.createElement('a-entity');
			this.towerEl.setAttribute('tower', {
				faction: this.data.faction,
				type: 'missile',
				tier: 0
			});
			this.el.appendChild(this.towerEl);
			this.el.removeState('empty');
			this.gameManager.updateGameGrid(
				Math.floor(this.el.object3D.position.x),
				Math.floor(this.el.object3D.position.z),
				false
			);
			this.gameManager.calculatePath(this.data.faction == 'A' ? 'B' : 'A');
			this.el.sceneEl.emit('systemupdatepath', { faction: this.data.faction });
			this.updateUI();
		},
		upgradeTower: function() {
			this.towerEl.components['tower'].upgradeTier();
			this.updateUI();
		},
		removeTower: function() {
			this.towerEl.parentNode.removeChild(this.towerEl);
			this.towerEl = undefined;
			this.el.addState('empty');
			this.gameManager.updateGameGrid(
				Math.floor(this.el.object3D.position.x),
				Math.floor(this.el.object3D.position.z),
				true
			);
			this.gameManager.calculatePath(this.data.faction == 'A' ? 'B' : 'A');
			this.el.sceneEl.emit('systemupdatepath', { faction: this.data.faction });
			this.updateUI();
		},
		onStateRemoved: function(evt) {
			if (evt.detail == 'cursor-hovered') {
				this.uiManager.clearObjectControl();
			}
		},
		getUIsets: function() {
			var uisets;
			if (this.el.is('empty')) {
				uisets = [{
					callback: this.createLaserTower,
					icon: 'beam',
					header: 'Beam'
				}, {
					callback: this.createMissileTower,
					icon: 'rocket',
					header: 'Missile'
				}];
			} else if (this.towerEl.components['tower'].isMaxTier()) {
				uisets = [{
					callback: this.removeTower,
					icon: 'demolish',
					header: 'Remove'
				}];
			} else {
				uisets = [{
					callback: this.removeTower,
					icon: 'demolish',
					header: 'Remove'
				}, {
					callback: this.upgradeTower,
					icon: 'upgrade',
					header: 'Upgrade'
				}];
			}
			return uisets;
		},
		updateUI: function() {
			this.uiManager.clearObjectControl();
			var self = this;
			setTimeout(function() {
				if (self.el.is('cursor-hovered'))
					self.uiManager.updateObjectControl(self.getUIsets());
			}, 1000);
		}
	});
})();
