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
			this.el.addEventListener('systemupdatepath', this.onPathUpdated.bind(this));
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
		},
		onPathUpdated: function(evt) {
			this.faction[evt.detail.faction == 'A' ? 'B' : 'A'].enemies.forEach(enemy => {
				enemy.emit('pathupdate');
			});
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
				default: 0.5
			},
			timeRatio: {
				type: 'number',
				default: 0.001
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
			},
			cost: {
				type: 'number',
				default: 10
			}
		},
		init: function() {
			//console.log('Initial enemy.');
			let setting = this.el.sceneEl.systems['tdar-game'].settings.enemy;

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
			this.gameloader = this.el.sceneEl.systems['tdar-game'].gameLoader;
			this.line = null;
			this.lineLength = null;
			this._initLine();
			this.el.setAttribute('enemy', {
				speed: this.data.speed / (2 * Math.PI)
			});
			this.timeCounter = 0;
			this.completeDist = 0;

			this.el.addEventListener('be-attacked', this._onBeAttacked.bind(this));
			this.el.addEventListener('movingended', this._onArrived.bind(this));
			this.el.addEventListener('pathupdate', this._onPathUpdated.bind(this));
		},
		tick: function(time, timeDelta) {
			if (!this.el.is('endofpath')) {
				this.timeCounter += (timeDelta * this.data.timeRatio);
				this.completeDist += this.data.speed * this.timeCounter;

				if (this.completeDist >= this.lineLength) {
					this.el.addState('endofpath');
					this.el.emit('movingended');
				} else {
					let p = this.line.getUtoTmapping(0, this.completeDist);
					p = this.line.getPoint(p);
					this.el.object3D.position.copy(p);
					let d = this.el.parentNode.object3D.localToWorld(p);
					this.el.object3D.lookAt(d);
				}
			}
		},
		remove: function() {
			delete this.currentHP;
			delete this.line;
			delete this.timeCounter;
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
			let points = this.data.faction == 'A' ? this.gameloader.getPathA() : this.gameloader.getPathB();
			let pathPoints = points.map(point => {
				let p = new THREE.Vector3(point[0], 0, point[1]);
				return p;
			});
			this.line = new THREE['CatmullRomCurve3'](pathPoints);
			this.lineLength = this.line.getLength();
		},
		_onPathUpdated: function() {
            console.log('FACTION', this.data.faction, 'UPDATE PATH');

			let points = this.data.faction == 'A' ? this.gameloader.getPathA() : this.gameloader.getPathB();
			let minDistance = Infinity;
			let ptr = points.length - 1;
			for (let i = 0; i < points.length - 1; i++) {
				let p = new THREE.Vector3(points[i][0], 0, points[i][1]);
				if (p.distanceTo(this.el.object3D.position) < minDistance)
					ptr = i;
			}
			points = points.slice(ptr);
			points.splice(0, 0, [this.el.object3D.position.x, this.el.object3D.position.z]);
			let pathPoints = points.map(point => {
				let p = new THREE.Vector3(point[0], 0, point[1]);
				return p;
			});
			delete this.line;
			this.line = new THREE['CatmullRomCurve3'](pathPoints);
			this.lineLength = this.line.getLength();
			this.timeCounter = 0;
			this.completeDist = 0;
		}
	});
})();
