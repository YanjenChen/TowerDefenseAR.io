(() => {
	AFRAME.registerSystem('enemy', {
		init: function() {
			this.faction = {
				A: {},
				B: {}
			};
			this.faction.A.enemies = [];
			this.faction.B.enemies = [];
			this.el.addEventListener('systemupdatepath', this.onPathUpdated.bind(this));
		},
		registerEnemy: function(el) {
			var fac = el.components.enemy.data.faction;
			this.faction[fac].enemies.push(el);
			this.el.systems['tower'].updateEnemies(fac);
		},
		unregisterEnemy: function(el) {
			var fac = el.components.enemy.data.faction;
			var index = this.faction[fac].enemies.indexOf(el);
			if (index > -1) {
				this.faction[fac].enemies.splice(index, 1);
				this.el.systems['tower'].updateEnemies(fac);
			}
		},
		onPathUpdated: function(evt) {
			this.faction[evt.detail.faction == 'A' ? 'B' : 'A'].enemies.forEach(enemy => {
				enemy.emit('pathupdate');
			});
		}
	});

	AFRAME.registerComponent('enemy', {
		schema: {
			damage: {
				type: 'number',
				default: 1
			},
			faction: {
				type: 'string',
				default: 'A',
				oneOf: ['A', 'B']
			},
			healthPoint: {
				// Receive from server.
				type: 'number',
				default: 1
			},
			id: {
				// Receive from server.
				type: 'string',
				default: ''
			},
			reward: {
				// Receive from server.
				type: 'number',
				default: 10
			},
			speed: {
				type: 'number',
				default: 0.5
			},
			targetCastle: {
				type: 'selector',
				default: null
			},
			timeRatio: {
				type: 'number',
				default: 0.001
			},
			type: {
				type: 'string',
				default: 'default'
			}
		},
		init: function() {
			// console.log('Initial enemy.');
			this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

			let setting = this.gameManager.settings.enemy;

			this.currentHP = this.data.healthPoint;
			this.el.setAttribute('id', this.data.id);
			this.el.setAttribute('gltf-model', setting.model);
			this.el.setAttribute('animation-mixer', {
				timeScale: setting.animation_timeScale
			});
			this.el.setAttribute('scale', setting.scale);

			this.system.registerEnemy(this.el);
			/*
			this.el.setAttribute('moveonpath', {
			    path: '#' + this.data.faction + 'faction' + this.data.type + 'path',
			    speed: this.data.speed
			});
			*/
			this.line = null;
			this.lineLength = null;
			this._initLine();
			this.el.setAttribute('enemy', {
				speed: this.data.speed / (2 * Math.PI)
			});
			this.completeDist = 0;

			this.el.addEventListener('be-attacked', this._onBeAttacked.bind(this));
			this.el.addEventListener('movingended', this._onArrived.bind(this));
			this.el.addEventListener('pathupdate', this._onPathUpdated.bind(this));
		},
		tick: function(time, timeDelta) {
			if (!this.el.is('endofpath')) {
				this.completeDist += this.data.speed * timeDelta * this.data.timeRatio;

				if (this.completeDist >= this.lineLength) {
					this.el.addState('endofpath');
					this.el.emit('movingended');
				} else {
					let p = this.line.getPointAt(this.completeDist / this.lineLength);
					let d = this.el.parentNode.object3D.localToWorld(p.clone());
					this.el.object3D.lookAt(d);
					this.el.object3D.position.copy(p);
				}
			}
		},
		remove: function() {
			delete this.currentHP;
			delete this.line;
			delete this.completeDist;
			this.system.unregisterEnemy(this.el);
			this.el.removeEventListener('be-attacked', this._onBeAttacked.bind(this));
			this.el.removeEventListener('movingended', this._onArrived.bind(this));
			this.el.removeEventListener('pathupdate', this._onPathUpdated.bind(this));
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
				this.el.sceneEl.emit('enemydestroy', {
					cost: Math.floor(this.data.cost / 4),
					faction: this.data.faction
				});
				this.el.parentNode.removeChild(this.el);

			}
		},
		_initLine: function() {
			this.line = new THREE['CatmullRomCurve3'](this.gameManager.enemyPath[this.data.faction]);
			this.lineLength = this.line.getLength();
		},
		_onPathUpdated: function() {
			delete this.line;
			this.line = this.gameManager.getNewPath(this.el.object3D.position.x, this.el.object3D.position.z, this.data.faction);
			this.lineLength = this.line.getLength();
			this.completeDist = 0;
		}
	});
})();
