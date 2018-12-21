(() => {
	const MAX_TIER = 3;

	AFRAME.registerSystem('tower', {
		init: function() {
			this.faction = {
				A: {},
				B: {}
			};
			this.faction.A.enemies = [];
			this.faction.B.enemies = [];
		},
		updateEnemies: function(fac) {
			if (this.faction[fac].enemies === this.el.systems['enemy'].faction[fac].enemies)
				console.warn('Redundent operation between tower and enemy.');

			this.faction[fac].enemies = this.el.systems['enemy'].faction[fac].enemies;
		}
	});

	AFRAME.registerComponent('tower', {
		schema: {
			faction: {
				type: 'string',
				default: 'A',
				oneOf: ['A', 'B']
			},
			type: {
				type: "string",
				default: "laser",
				oneOf: ['laser', 'missile']
			},
			tier: {
				type: "number",
				default: 0
			}
		},
		init: function() {
			// load tower settings.
			this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

			let setting = this.setting = this.gameManager.settings.towers;



			// load object3D model.
			this.fortBase = document.createElement('a-entity');
			this.fortBase.setAttribute('gltf-model', setting.common.fortBase);
			this.el.appendChild(this.fortBase);

			this.rotationPart = document.createElement('a-entity');
			this.rotationPart.setAttribute('gltf-model', setting.common.fort);
			this.rotationPart.setAttribute('animation-mixer', {
				timeScale: setting.common.animation_timeScale,
				loop: 'once'
			});
			// set fire point.
			this.firePoint = document.createElement('a-entity');
			this.firePoint.setAttribute('position', setting.common.firePointOffset);
			/*
			this.firePoint.setAttribute('geometry', {
			    primitive: "sphere",
			    radius: 1,
			    segmentsHeight: 2,
			    segmentsWidth: 2
			});
			*/
			this.rotationPart.appendChild(this.firePoint);
			this.el.appendChild(this.rotationPart);

			this.el.setAttribute('scale', setting.common.scale);



			// initialize tower parameters.
			this.targetEl = null;
			this.targetFac = (this.data.faction == 'A') ? 'B' : 'A';
			this.timeCounter = 0;
			this.el.addEventListener('fire', this._onFire.bind(this));

			let self = this;
			this.el.addState('initializing');
			this.rotationPart.addEventListener('animation-finished', function() {
				self.el.removeState('initializing');
				self.rotationPart.removeEventListener('animation-finished', this);
			});

			this.el.addEventListener('stateadded', this._onStateAdded.bind(this));
			this.el.addEventListener('stateremoved', this._onStateRemoved.bind(this));

			this.upgradeTier = this.upgradeTier.bind(this);
			this.isMaxTier = this.isMaxTier.bind(this);
		},
		update: function() {
			let currentSetting = this.setting[this.data.type][this.data.tier];
			this.restDuration = currentSetting.restDuration;
			this.activateDuration = currentSetting.activateDuration;
			this.range = currentSetting.range;
			this.damagePoint = currentSetting.damagePoint;

			// Initial laser object.
			if (this.data.type == 'laser') {
				let laserMaterial = new THREE.LineBasicMaterial({
					blending: THREE.AdditiveBlending,
					color: currentSetting.laserColor,
					transparent: true
				});
				let laserGeometry = new THREE.Geometry();
				laserGeometry.vertices.push(
					new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(0, 0, 0)
				);
				let laserMesh = new THREE.Line(laserGeometry, laserMaterial);
				laserMesh.visible = false;
				this.rotationPart.setObject3D('laser', laserMesh);
			}
		},
		tick: function(time, timeDelta) {
			if (this.el.is('initializing'))
				return;

			if (this.el.is('activate')) {
				if (this._checkTargetDistance()) {
					let p = new THREE.Vector3();
					this.targetEl.object3D.getWorldPosition(p);
					this.rotationPart.object3D.lookAt(p);

					this.timeCounter += timeDelta;
					if (this.timeCounter >= this.restDuration && !this.el.is('attacking')) {
						this.el.addState('attacking');
					} else if (this.el.is('attacking')) {
						this.el.emit('fire');
						if (this.timeCounter >= this.activateDuration) {
							this.el.removeState('attacking');
						}
					}
				} else {
					// ONLY USE IN DEVELOPER TESTING
					/*
					this.targetEl.setAttribute('glow', {
						enabled: false
					});
					*/
					////////////////////////////////
					this.el.removeState('activate');
					this.el.removeState('attacking');
				}
			} else {
				if (this._getNearestEnemy()) {
					// ONLY USE IN DEVELOPER TESTING
					/*
                    this.targetEl.setAttribute('glow', {
                        enabled: true
                    });
					*/
					////////////////////////////////
					this.el.addState('activate');
					this.el.addState('attacking');
				}
			}
		},
		remove: function() {
			// ONLY USE IN DEVELOPER TESTING
			/*
            if (this.targetEl != null)
                this.targetEl.setAttribute('glow', {
                    enabled: false
                });
			*/
			////////////////////////////////
			delete this.fortBase;
			delete this.rotationPart;
			delete this.firePoint;
			delete this.targetEl;
			delete this.targetFac;
			delete this.duration;
			delete this.timeCounter;
			delete this.restDuration;
			delete this.activateDuration;
			delete this.range;
			delete this.damagePoint;
			this.el.removeEventListener('fire', this._onFire.bind(this));
		},
		_checkTargetDistance: function() {
			if (this.system.faction[this.targetFac].enemies.indexOf(this.targetEl) < 0) // Prevent target doesn't exist cause null error.
				return false;
			let p = new THREE.Vector3();
			this.targetEl.object3D.getWorldPosition(p);
			return (this.el.parentNode.object3D.worldToLocal(p).distanceTo(this.el.object3D.position) < this.range);
		},
		_getNearestEnemy: function() {
			if (this.system.faction[this.targetFac].enemies.length <= 0) // Prevent empty array cause error.
				return false;

			var minDistance = Infinity;
			this.system.faction[this.targetFac].enemies.forEach((enemyEl) => {
				let p = new THREE.Vector3();
				enemyEl.object3D.getWorldPosition(p);
				var distance = this.el.parentNode.object3D.worldToLocal(p).distanceTo(this.el.object3D.position);
				if (distance < minDistance) {
					minDistance = distance;
					this.targetEl = enemyEl;
				}
			});
			return this._checkTargetDistance();
		},
		_onFire: function() {
			if (this.el.sceneEl.querySelector('#' + this.targetEl.id)) {
				let p = new THREE.Vector3();
				switch (this.data.type) {
					case 'missile':
						// Attack by missile.
						var missileEl = document.createElement('a-entity');
						this.firePoint.object3D.getWorldPosition(p);
						missileEl.object3D.position.copy(this.gameManager.dynamicScene.object3D.worldToLocal(p));
						missileEl.setAttribute('missile', {
							damagePoint: 100,
							attackRange: 1.5,
							speed: 0.5,
							targetPos: this.targetEl.object3D.position
						});
						this.gameManager.dynamicScene.appendChild(missileEl);
						break;
					case 'laser':
						// Attack by laser.
						let laserMesh = this.rotationPart.getObject3D('laser');
						laserMesh.geometry.vertices[0].copy(this.firePoint.object3D.position);
						this.targetEl.object3D.getWorldPosition(p);
						laserMesh.geometry.vertices[1].copy(this.rotationPart.object3D.worldToLocal(p));
						laserMesh.geometry.verticesNeedUpdate = true;
						this.networkManager.emit('playingEvent', {
							event_name: 'enemy_be_attacked',
							id: this.targetEl.getAttribute('id'),
							damage: 1
						});
						break;
				}

			}
		},
		_onStateAdded: function(evt) {
			switch (evt.detail) {
				case 'activate':
					this.timeCounter = 0;
					break;
				case 'attacking':
					this.timeCounter = 0;
					if (this.data.type == 'laser') {
						let laserMesh = this.rotationPart.getObject3D('laser');
						laserMesh.visible = true;
					}
					break;
			}
		},
		_onStateRemoved: function(evt) {
			switch (evt.detail) {
				case 'activate':
					this.timeCounter = 0;
					this.targetEl = null;
					break;
				case 'attacking':
					this.timeCounter = 0;
					if (this.data.type == 'laser') {
						let laserMesh = this.rotationPart.getObject3D('laser');
						laserMesh.visible = false;
					}
					break;
			}
		},
		upgradeTier: function() {
			if (this.data.tier < MAX_TIER)
				this.el.setAttribute('tower', {
					tier: this.data.tier + 1
				});
		},
		isMaxTier: function() {
			return this.data.tier >= MAX_TIER - 1;
		}
	});
})();
