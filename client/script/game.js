/*** DEPEDENCY: Need to execute network.js first. ***/
(() => {
	AFRAME.registerSystem('tdar-game', {
		schema: {
			mode: {
				type: 'string',
				default: 'multi-player',
				oneOf: ['single-player', 'multi-player']
			},
			ar: {
				type: 'boolean',
				default: false,
			}
		},
		init: function() {
			let self = this;
			this.gameLoader = new GameLoader(this.el);
			this.gameLoader.setMapDir('./renderer/maps/demo.json');
			this.gameLoader.setMode(this.data.ar ? 'ar' : 'vr');
			this.gameLoader.loadMap(null, function() {
				self.assetsEl = document.querySelector('a-assets');
				self.map = self.gameLoader.getMap();
				self.settings = self.gameLoader.getSettings();

				switch (self.data.mode) {
					case 'single-player':
						self.ENEMY_COUNTER = 0;

						if (self.data.ar) {
							self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
							self.el.addEventListener('placed_target_to_ar', self.onStabilized.bind(self));
						} else {
							self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
							self.el.addEventListener('gameloadscene', self.onStabilized.bind(self));
						}
						self.el.addEventListener('start_game', self.onStartGame.bind(self));
						//console.warn("AFRAME Init");

						self.el.addEventListener('broadcast', self.onBroadcast.bind(self)); // Listen local event.
						self.el.addEventListener('executeRequest', self.onExecute.bind(self)); // Listen server broadcast.
						break;
					case 'multi-player':
						self.socket = SOCKET;
						self.room_id = jQuery("#room_id").val();
						self.user = jQuery("#user").val();
						self.user_faction = jQuery("#user_faction").val() == '1' ? 'A' : 'B';
						//console.log("game.js initialized. ROOM_ID: " + ROOM_ID + ", USER: " + USER);

						self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
						self.el.addEventListener('gameloadscene', self.onStabilized.bind(self));
						self.socket.on('client_start_game', self.onStartGame.bind(self));
						//console.warn("AFRAME Init");

						self.el.addEventListener('broadcast', self.onBroadcast.bind(self)); // Listen local event.
						self.socket.on('playingEvent', self.onExecute.bind(self)); // Listen server broadcast.
						break;
					default:
						console.warn('GAME MODE ERROR.');
				}
			});
		},
		onAssetsLoaded: function() {
			this.gameLoader.loadScene();
		},
		onStabilized: function() {
			//console.warn('Assets successful loaded.');
			this.sceneEntity = document.querySelector('#tdar-dynamic-scene');
			switch (this.data.mode) {
				case 'single-player':
					if (!this.el.is('tdar-game-running'))
						this.el.emit('start_game');
					break;
				case 'multi-player':
					this.socket.emit("nonPlayingEvent", {
						room_id: this.room_id,
						event_name: 'model_ready',
						user: this.user
					});
					break;
				default:
					console.warn('GAME MODE ERROR.');
			}
		},
		onStartGame: function() {
			//console.warn('Client start game.');

			// Insert cursor under camera.
			let cursor = document.createElement('a-entity');
			cursor.setAttribute('cursor', {
				fuse: false
			});
			cursor.setAttribute('position', '0 0 -0.1');
			cursor.setAttribute('geometry', 'primitive: ring; radiusInner: 0.002; radiusOuter: 0.003');
			cursor.setAttribute('material', 'color: black; shader: flat');
			cursor.setAttribute('raycaster', 'objects: [data-raycastable]');
			document.querySelector('[camera]').appendChild(cursor);

			this.gameLoader.getDynamicScene().play();
		},
		onBroadcast: function(evt) {
			switch (this.data.mode) {
				case 'single-player':
					// Client simulate multi player server behavior.
					var content = evt.detail;

					switch (evt.detail.event_name) {
						case 'enemy_be_attacked':
							content.event_name = 'enemy_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'castle_be_attacked':
							content.event_name = 'castle_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'request_create_tower':
							content.event_name = 'create_tower_success';
							this.el.emit('executeRequest', content);
							break;
						case 'tower_be_attacked':
							content.event_name = 'tower_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'wave_spawner_request_spawn_enemy':
							content.event_name = 'wave_spawner_create_enemy';
							content.enemy_id = 'enemy-' + this.ENEMY_COUNTER.toString();
							this.ENEMY_COUNTER++;
							this.el.emit('executeRequest', content);
							break;
					}
					break;
				case 'multi-player':
					var content = evt.detail;
					content.room_id = this.room_id;
					content.user = this.user;
					this.socket.emit('playingEvent', content);
					//console.warn('Emit event to server, name: ' + content['event_name']);
					break;
				default:
					console.warn('GAME MODE ERROR.');
			}
		},
		onExecute: function(content) {
			if (this.data.mode == 'single-player')
				content = content.detail;
			//console.warn('Receive event from server, name: ' + content['event_name']);

			switch (content['event_name']) {
				case 'enemy_get_damaged':
					if (document.querySelector('#' + content['id']) != null)
						document.querySelector('#' + content['id']).emit('be-attacked', {
							damage: content['damage']
						});
					break;
				case 'castle_get_damaged':

					break;
				case 'create_tower_success':

					break;
				case 'tower_get_damaged':

					break;
				case 'wave_spawner_create_enemy':
					if (document.querySelector('#' + content['id']) != null) {
						//console.log(content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle');

						document.querySelector('#' + content['id']).emit('spawn_enemy', {
							id: content['enemy_id'],
							faction: content['ws_faction'],
							healthPoint: 600,
							speed: 0.03,
							targetCastle: content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle'
						});
					}
					break;
			}
		}
	});
	class GameLoader {
		constructor(object, mapDir, mode) {
			this.sceneEl = object;
			this.mapDir = mapDir;
			this.mode = mode;
			this.map = null;
			this.settings = null;
			this.anchorEl = null;
			this.staticScene = null;
			this.dynamicScene = null;
			this.walkableGrid = null;
			this.pathFinder = new PF.AStarFinder();
			this.pathA = null;
			this.pathB = null;
		}
		setMapDir(mapDir) {
			this.mapDir = mapDir;
		}
		setMode(mode) {
			this.mode = mode;
		}
		getMap() {
			return this.map;
		}
		getPathA() {
			return this.pathA;
		}
		getPathB() {
			return this.pathB;
		}
		getSettings() {
			return this.settings;
		}
		getAnchorEl() {
			return this.anchorEl;
		}
		getStaticScene() {
			return this.staticScene;
		}
		getDynamicScene() {
			return this.dynamicScene;
		}
		loadMap(mapDir, callback) {
			let self = this;
			let dir = mapDir ? mapDir : this.mapDir;

			jQuery.getJSON(dir, map => {
				self.map = map;
				self.settings = map.settings;

				// Pre-load model by assets management system.
				let assetsEl = document.createElement('a-assets');
				map.assets.forEach(asset => {
					let assetEl = document.createElement('a-asset-item');
					assetEl.setAttribute('id', asset.id);
					assetEl.setAttribute('src', asset.src);
					assetsEl.appendChild(assetEl);
				});
				self.sceneEl.appendChild(assetsEl);

				callback();
			});
		}
		loadScene(env) {
			let self = this;
			let mode = env ? env : this.mode;
			if (mode == 'ar') {
				// Insert shadow plane.
				let planeGeometry = new THREE.PlaneGeometry(2000, 2000);
				planeGeometry.rotateX(-Math.PI / 2);
				let shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
					color: 0x111111,
					opacity: 0.2,
				}));
				shadowMesh.name = 'arShadowMesh';
				shadowMesh.receiveShadow = true;
				shadowMesh.position.y = 10000;
				this.sceneEl.object3D.add(shadowMesh);

				// Insert light to scene.
				let light = document.createElement('a-entity');
				light.setAttribute('light', {
					type: 'ambient',
					color: '#fff',
					intensity: 1
				});
				let directionalLight = document.createElement('a-entity');
				directionalLight.setAttribute('light', {
					type: 'directional',
					color: '#fff',
					intensity: 0.3,
					castShadow: true
				});
				directionalLight.setAttribute('position', '10 15 10');
				this.sceneEl.appendChild(light);
				this.sceneEl.appendChild(directionalLight);

				// Insert anchor container.
				let anchorEl = document.createElement('a-entity');
				anchorEl.setAttribute('id', 'tdar-anchor-container');
				anchorEl.setAttribute('shadow', {
					cast: true,
					receive: true
				});
				this.sceneEl.appendChild(anchorEl);

				this.sceneEl = this.anchorEl = anchorEl;
			}

			// add static scene.
			let staticScene = document.createElement('a-entity');
			staticScene.setAttribute('id', 'tdar-static-scene');
			if (this.map.staticScene.model)
				staticScene.setAttribute('gltf-model', this.map.staticScene.model);
			if (this.map.staticScene.child)
				staticScene.insertAdjacentHTML('beforeend', this.map.staticScene.child);
			this.sceneEl.appendChild(staticScene);
			this.staticScene = staticScene;

			// add dynamic scene.
			let dynamicScene = document.createElement('a-entity');
			dynamicScene.setAttribute('id', 'tdar-dynamic-scene');
			dynamicScene.setAttribute('shadow', {
				cast: true,
				receive: false
			});
			dynamicScene.setAttribute('position', this.map.dynamicScene.offset);
			this.sceneEl.appendChild(dynamicScene);
			this.dynamicScene = dynamicScene;

			// add obstacles to dynamic scene.
			this.map.dynamicScene.obstacles.forEach(obs_position => {
				let obsEl = document.createElement('a-entity');
				obsEl.setAttribute('geometry', this.map.settings.obstacle.geometry);
				obsEl.setAttribute('material', this.map.settings.obstacle.material);
				obsEl.setAttribute('position', { x: obs_position[0] + 0.5, y: obs_position[1], z: obs_position[2] + 0.5 });
				self.staticScene.appendChild(obsEl);
			});

			// Pause game after init.
			this.dynamicScene.addEventListener('loaded', function() {
				document.querySelector('#tdar-dynamic-scene').pause();
			});

			// add initial content to dynamic scene.
			/* SCENE LOADER */
			/*
			this.map.dynamicScene.factions.forEach(faction => {
				// load enemy path. DERPACTED, change to init path by calculation.
				faction.enemyPath.forEach(path => {
					var curveEl = document.createElement('a-entity');
					curveEl.setAttribute('path', {
						lineType: path.lineType
					});
					curveEl.setAttribute('id', faction.name + 'faction' + path.type + 'path');
					path.points.forEach((point) => {
						var pointEl = document.createElement('a-entity');
						pointEl.setAttribute('path-point', {});
						pointEl.setAttribute('position', point);
						curveEl.appendChild(pointEl);
					});

					dynamicScene.appendChild(curveEl);
				});

				// load tower bases.
				faction.towerBases.forEach(base => {
					let baseEl = document.createElement('a-entity');
					baseEl.setAttribute('geometry', this.settings.towerBase.geometry);
					baseEl.setAttribute('material', this.settings.towerBase.material);
					baseEl.setAttribute('position', base.position);
					baseEl.setAttribute('data-raycastable', '');
					baseEl.setAttribute('tower-base', {
						faction: faction.name
					});
					dynamicScene.appendChild(baseEl);
				});


				// load wave spawner.
				let waveSpawnerEl = document.createElement('a-entity');
				waveSpawnerEl.setAttribute('wave-spawner', faction.waveSpawner.schema);
				waveSpawnerEl.setAttribute('position', faction.waveSpawner.position);
				dynamicScene.appendChild(waveSpawnerEl);

				// load castle
				let castleEl = document.createElement('a-entity');
				castleEl.setAttribute('castle', faction.castle.schema);
				castleEl.setAttribute('geometry', this.settings.castle.geometry);
				castleEl.setAttribute('position', faction.castle.position);
				dynamicScene.appendChild(castleEl);

				//this.el.addState('tdar-game-running');
			});
            */
			for (let i = 0; i < this.map.dynamicScene.width; i++) {
				for (let k = 0; k < 10; k++) {
					if (!(i == 1 && k == 1) && !(i == 18 && k == 8)) {
						let baseEl = document.createElement('a-entity');
						baseEl.setAttribute('geometry', this.settings.towerBase.geometry);
						baseEl.setAttribute('material', this.settings.towerBase.material);
						baseEl.setAttribute('position', { x: i + 0.5, y: 0, z: k + 0.5 });
						baseEl.setAttribute('data-raycastable', '');
						baseEl.setAttribute('tower-base', {
							faction: this.map.dynamicScene.factions[1].name
						});
						dynamicScene.appendChild(baseEl);
					}
				}
				for (let k = 11; k < this.map.dynamicScene.depth; k++) {
					if (!(i == 1 && k == 12) && !(i == 18 && k == 19)) {
						let baseEl = document.createElement('a-entity');
						baseEl.setAttribute('geometry', this.settings.towerBase.geometry);
						baseEl.setAttribute('material', this.settings.towerBase.material);
						baseEl.setAttribute('position', { x: i + 0.5, y: 0, z: k + 0.5 });
						baseEl.setAttribute('data-raycastable', '');
						baseEl.setAttribute('tower-base', {
							faction: this.map.dynamicScene.factions[0].name
						});
						dynamicScene.appendChild(baseEl);
					}
				}
			}
			this.map.dynamicScene.factions.forEach(faction => {
				// load wave spawner.
				let waveSpawnerEl = document.createElement('a-entity');
				waveSpawnerEl.setAttribute('wave-spawner', faction.waveSpawner.schema);
				waveSpawnerEl.setAttribute('position', {
					x: faction.waveSpawner.position[0] + 0.5,
					y: faction.waveSpawner.position[1],
					z: faction.waveSpawner.position[2] + 0.5
				});
				dynamicScene.appendChild(waveSpawnerEl);

				// load castle
				let castleEl = document.createElement('a-entity');
				castleEl.setAttribute('castle', faction.castle.schema);
				castleEl.setAttribute('geometry', this.settings.castle.geometry);
				castleEl.setAttribute('position', {
					x: faction.castle.position[0] + 0.5,
					y: faction.castle.position[1],
					z: faction.castle.position[2] + 0.5
				});
				dynamicScene.appendChild(castleEl);
			});
			// Init path.
			let walkableMatrix = [];
			for (let k = 0; k < this.map.dynamicScene.depth; k++) {
				let row = [];
				for (let i = 0; i < this.map.dynamicScene.width; i++) {
					row.push(0);
				}
				walkableMatrix.push(row);
			}
			this.map.dynamicScene.obstacles.forEach(obs_position => {
				walkableMatrix[obs_position[2]][obs_position[0]] = 1;
			});
			this.walkableGrid = new PF.Grid(walkableMatrix);
			this.calculatePathA();
			this.calculatePathB();



			if (mode == 'ar') {
				this.sceneEl.addEventListener('loaded', function() {
					this.object3D.visible = false;

					let reticle = document.createElement('a-entity');
					// Affect base scene object scale.
					reticle.setAttribute('reticle', {
						targetEl: '#' + this.id,
						scaleFactor: self.map.staticScene.scaleFactor
					});
					this.sceneEl.appendChild(reticle);
				});
			} else {
				document.querySelector('a-scene').emit('gameloadscene');
			}
		}
		updateWalkableGrid(x, z, walkable, callback) {
			/*
			 * SPEC
			 *   (int) x: x coord on walkable map.
			 *   (int) z: z coord on walkable map.
			 *   (boolen) walkable: walkable or not.
			 *   (function) callback: callback function.
			 */
			this.walkableGrid.setWalkableAt(x, z, walkable);
			if (callback)
				callback();
		}
		calculatePathA() {
			let grid = this.walkableGrid.clone();
			let path = this.pathFinder.findPath(
				this.map.dynamicScene.factions[0].waveSpawner.position[0],
				this.map.dynamicScene.factions[0].waveSpawner.position[2],
				this.map.dynamicScene.factions[1].castle.position[0],
				this.map.dynamicScene.factions[1].castle.position[2],
				grid
			);
			path = PF.Util.compressPath(path);
			path = path.map((point) => {
				return [point[0] + 0.5, point[1] + 0.5];
			});
			this.pathA = path;
		}
		calculatePathB() {
			let grid = this.walkableGrid.clone();
			let path = this.pathFinder.findPath(
				this.map.dynamicScene.factions[1].waveSpawner.position[0],
				this.map.dynamicScene.factions[1].waveSpawner.position[2],
				this.map.dynamicScene.factions[0].castle.position[0],
				this.map.dynamicScene.factions[0].castle.position[2],
				grid
			);
			path = PF.Util.compressPath(path);
            path = path.map((point) => {
				return [point[0] + 0.5, point[1] + 0.5];
			});
			this.pathB = path;
		}
	}
})();
