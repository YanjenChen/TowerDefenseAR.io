class GameManager {
	constructor(sceneEl, configDir, mode) {
		/*
		 * FUNCTION API SPEC
		 *  mapDir: Directory of the game map.
		 *  mode: Game operation mode, one of ['ar', 'vr'].
		 *  sceneEl: DOM node point to <a-scene> element.
		 *
		 * CLASS PROPERTY
		 *  anchorEl: <a-entity> which indicate AR anchor entity, all object3D should be contained under this entity.
		 *  configs: Object receive from mapDir, contain all game initial params.
		 *  configDir: Directory of the config file.
		 *  dynamicScene: <a-entity> which indicate game dynamic scene, all dynamic object3D should be contained under this entity.
		 *  gameGrid: PF.Grid object which store dynamic game walkable grid.
		 *  mode: Game operation mode, one of ['ar', 'vr'].
		 *  object3DPrototypes: object with property {key: THREE.object3D}, use to speed up performance.
		 *  pathFinder: PF.AStarFinder. Handle graph search.
		 *  enemyPath: Object contain two faction's enemy moving path.
		 *  sceneEl: DOM node which point to <a-scene> element.
		 *  settings: Contain all components' static params.
		 *  staticScene: <a-entity> which indicate game static scene, all static object3D should be contained under this entity.
		 *  towerBases: Two dimensional array of <a-entity>.components.['tower-base'], use to quick access UI content.
		 */
		this.anchorEl = null;
		this.configs = null;
		this.configDir = configDir;
		this.dynamicScene = null;
		this.gameGrid = null;
		this.mode = mode;
		this.object3DPrototypes = {};
		this.pathFinder = new PF.AStarFinder();
		this.enemyPath = {
			A: null,
			B: null
		};
		this.sceneEl = sceneEl;
		this.settings = null;
		this.staticScene = null;
		this.towerBases = null;

		this.loadConfig = this.loadConfig.bind(this);
		this.loadScene = this.loadScene.bind(this);
		this.loadObject3D = this.loadObject3D.bind(this);
		this.sceneToGamegrid = this.sceneToGamegrid.bind(this);
		this.gamegridToScene = this.gamegridToScene.bind(this);
	}
	loadConfig() {
		if (!this.configDir) {
			console.warn('Game manager does not receive config directory.');
			return;
		}

		let self = this;
		jQuery.getJSON(this.configDir, configs => {
			self.configs = configs;
			self.settings = configs.settings;

			// Pre-load model by assets management system.
			let assetsEl = document.createElement('a-assets');
			jQuery.each(configs.assets, function(key, value) {
				let assetEl = document.createElement('a-asset-item');
				assetEl.setAttribute('id', key);
				assetEl.setAttribute('src', value);
				assetsEl.appendChild(assetEl);
			});

			assetsEl.addEventListener('loaded', self.loadObject3D);
			self.sceneEl.appendChild(assetsEl);
		});
	}
	loadScene() {
		let self = this;
		let mode = this.mode;
		let sceneEl = this.sceneEl;
		let globalVar = this.configs.globalVar;


		// Init cash manager.
		sceneEl.systems['tdar-game'].cashManager = new CashManager(sceneEl);


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
			sceneEl.object3D.add(shadowMesh);

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
			sceneEl.appendChild(light);
			sceneEl.appendChild(directionalLight);

			// Insert anchor container.
			let anchorEl = document.createElement('a-entity');
			anchorEl.setAttribute('id', 'tdar-anchor-container');
			anchorEl.setAttribute('shadow', {
				cast: true,
				receive: true
			});
			sceneEl.appendChild(anchorEl);

			sceneEl = this.anchorEl = anchorEl;
		}

		// add static scene.
		let staticScene = document.createElement('a-entity');
		staticScene.setAttribute('id', 'tdar-static-scene');
		jQuery.each(this.configs.staticScene, function(name, values) {
			if (name != 'abstractName') {
				values.forEach(value => {
					let object3D = self.object3DPrototypes[name].clone();
					object3D.position.set(value.position);
					if (value.rotation)
						object3D.rotation.set(value.rotation);
					if (value.scale)
						object3D.scale.set(
							object3D.scale.x * value.scale.x,
							object3D.scale.y * value.scale.y,
							object3D.scale.z * value.scale.z
						);
					staticScene.object3D.add(object3D);
				});
			}
		});
		staticScene.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
		sceneEl.appendChild(staticScene);
		this.staticScene = staticScene;


		// Init grid system.
		let walkableMatrix = [];
		for (let k = 0; k < globalVar.gridConfig.depth; k++) {
			let row = [];
			for (let i = 0; i < globalVar.gridConfig.width; i++) {
				row.push(0);
			}
			walkableMatrix.push(row);
		}
		this.gameGrid = new PF.Grid(walkableMatrix);
		let gridEl = document.createElement('a-entity');
		gridEl.setAttribute('id', 'tdar-game-grid');
		gridEl.setAttribute('grid', {
			width: globalVar.gridConfig.width,
			depth: globalVar.gridConfig.depth
		});
		gridEl.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
		sceneEl.appendChild(gridEl);


		// add dynamic scene.
		let dynamicScene = document.createElement('a-entity');
		dynamicScene.setAttribute('id', 'tdar-dynamic-scene');
		dynamicScene.setAttribute('shadow', {
			cast: true,
			receive: false
		});
		let idCounter;
		jQuery.each(this.configs.dynamicScene, function(name, values) {
			switch (name) {
				case 'wave-spawner':
					// Assign id "wave-spawner-A-{id}" for each entity.
					idCounter = 0;
					jQuery.each(values, function(faction, arr) {
						arr.forEach(el => {
							let entity = document.createElement('a-entity');
							entity.setAttribute('id', name + '-' + faction + '-' + idCounter.toString());
							idCounter++;
							entity.setAttribute(name, {
								faction: faction
							});
							entity.object3D.position.set(
								el.position.x + 0.5,
								el.position.y,
								el.position.z + 0.5
							);
							dynamicScene.appendChild(entity);
						});
					});
					break;
				case 'castle':
					// Assign id "castle-A" for each entity.
					jQuery.each(values, function(faction, el) {
						let entity = document.createElement('a-entity');
						entity.setAttribute('id', name + '-' + faction);
						idCounter++;
						entity.setAttribute(name, {
							faction: faction,
							healthPoint: this.settings[name].common.healthPoint
						});
						entity.object3D.position.set(
							el.position.x + 0.5,
							el.position.y,
							el.position.z + 0.5
						);
						dynamicScene.appendChild(entity);
					});
					break;
				case 'obstacle':
					values.forEach(el => {
						self.updateGameGrid(el.position.x, el.position.z, false);
					});
					break;
			}
		});
		dynamicScene.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
		sceneEl.appendChild(dynamicScene);
		this.dynamicScene = dynamicScene;


		// Pause game after init.
		this.dynamicScene.addEventListener('loaded', function() {
			self.dynamicScene.pause();
		});


		// add initial content to dynamic scene.
		for (let i = 0; i < this.configs.dynamicScene.width; i++) {
			for (let k = 0; k < 10; k++) {
				if (!(i == 1 && k == 1) && !(i == 18 && k == 8)) {
					let baseEl = document.createElement('a-entity');
					baseEl.setAttribute('geometry', this.settings.towerBase.geometry);
					baseEl.setAttribute('material', this.settings.towerBase.material);
					baseEl.setAttribute('position', {
						x: i + 0.5,
						y: 0,
						z: k + 0.5
					});
					baseEl.setAttribute('data-raycastable', '');
					baseEl.setAttribute('tower-base', {
						faction: this.configs.dynamicScene.factions[1].name
					});
					dynamicScene.appendChild(baseEl);
				}
			}
			for (let k = 11; k < this.configs.dynamicScene.depth; k++) {
				if (!(i == 1 && k == 12) && !(i == 18 && k == 19)) {
					let baseEl = document.createElement('a-entity');
					baseEl.setAttribute('geometry', this.settings.towerBase.geometry);
					baseEl.setAttribute('material', this.settings.towerBase.material);
					baseEl.setAttribute('position', {
						x: i + 0.5,
						y: 0,
						z: k + 0.5
					});
					baseEl.setAttribute('data-raycastable', '');
					baseEl.setAttribute('tower-base', {
						faction: this.configs.dynamicScene.factions[0].name
					});
					dynamicScene.appendChild(baseEl);
				}
			}
		}
		this.configs.dynamicScene.factions.forEach(faction => {
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
		this.calculatePath('A');
		this.calculatePath('B');


		if (mode == 'ar') {
			// TODO: NEED UPDATE ALL SCRIPT HERE.
			sceneEl.addEventListener('loaded', function() {
				this.object3D.visible = false;

				let reticle = document.createElement('a-entity');
				// Affect base scene object scale.
				reticle.setAttribute('reticle', {
					targetEl: '#' + this.id,
					scaleFactor: self.configs.staticScene.scaleFactor
				});
				this.sceneEl.appendChild(reticle);
			});
		} else {
			this.sceneEl.systems['tdar-game'].networkManager.emit('nonPlayingEvent', {
				event_name: 'model_ready'
			});
		}
	}
	updateGameGrid(x, z, walkable, callback) {
		/*
		 * SPEC
		 *   (int) x: x coord on walkable map.
		 *   (int) z: z coord on walkable map.
		 *   (boolen) walkable: walkable or not.
		 *   (function) callback: callback function.
		 */
		this.gameGrid.setWalkableAt(x, z, walkable);
		if (callback)
			callback();
	}
	calculatePath(faction) {
		/*
		 * SPEC
		 *   (string) faction: one of ['A', 'B'].
		 */
		let grid = this.gameGrid.clone();
		let path;

		if (faction == 'A') {
			path = this.pathFinder.findPath(
				this.configs.dynamicScene.factions[0].waveSpawner.position[0],
				this.configs.dynamicScene.factions[0].waveSpawner.position[2],
				this.configs.dynamicScene.factions[1].castle.position[0],
				this.configs.dynamicScene.factions[1].castle.position[2],
				grid
			);
		} else {
			path = this.pathFinder.findPath(
				this.configs.dynamicScene.factions[1].waveSpawner.position[0],
				this.configs.dynamicScene.factions[1].waveSpawner.position[2],
				this.configs.dynamicScene.factions[0].castle.position[0],
				this.configs.dynamicScene.factions[0].castle.position[2],
				grid
			);
		}

		path = path.map(point => {
			return new THREE.Vector3(point[0] + 0.5, 0, point[1] + 0.5);
		});
		delete this.enemyPath[faction];
		this.enemyPath[faction] = path;

		return path;
	}
	getNewPath(pos, faction) {
		/*
		 * Calculate the shortest path from given position to castle.
		 *
		 * SPEC
		 *	(Vec3) startPos
		 *  (string) faction: one of ['A', 'B'].
		 */
		const startPos = pos;
		let transPos = this.sceneToGamegrid(startPos);
		let grid = this.gameGrid.clone();
		let path;
		let self = this;

		if (faction == 'A') {
			path = this.pathFinder.findPath(
				transPos.x,
				transPos.z,
				this.configs.dynamicScene.factions[1].castle.position[0],
				this.configs.dynamicScene.factions[1].castle.position[2],
				grid
			);
		} else {
			path = this.pathFinder.findPath(
				transPos.x,
				transPos.z,
				this.configs.dynamicScene.factions[0].castle.position[0],
				this.configs.dynamicScene.factions[0].castle.position[2],
				grid
			);
		}

		path = path.map(point => {
			return new THREE.Vector3(self.gamegridToScene({
				x: point[0],
				y: 0,
				z: point[1]
			}));
		});
		path.splice(0, 1, startPos.clone());

		return new THREE['CatmullRomCurve3'](path);
	}
	sceneToGamegrid(position) {
		return {
			x: Math.floor(position.x + (this.configs.globalVar.gridConfig.width / 2)),
			y: position.y,
			z: Math.floor(position.z + (this.configs.globalVar.gridConfig.depth / 2))
		}
	}
	gamegridToScene(position) {
		return {
			x: position.x + 0.5 - (this.configs.globalVar.gridConfig.width / 2),
			y: position.y,
			z: position.z + 0.5 - (this.configs.globalVar.gridConfig.depth / 2)
		}
	}
	async loadObject3D() {
		console.log('ENTER LOAD OBJECT3D.');

		let assets = [];
		jQuery.each(this.configs.assets, function(key, value) {
			assets.push({ key: key, value: value });
		});

		const loaderPromises = assets.map(async asset => {
			const loader = promisifyLoader(new THREE.GLTFLoader());
			const gltfModel = await loader.load(asset.value);
			let model = gltfModel.scene || gltfModel.scenes[0];

			// normalize size.
			let bbox = new THREE.Box3().setFromObject(model);
			if (bbox.max.x < bbox.max.z)
				model.scale.set(1 / bbox.max.x, 1 / bbox.max.x, 1 / bbox.max.x);
			else
				model.scale.set(1 / bbox.max.z, 1 / bbox.max.z, 1 / bbox.max.z);
			delete bbox;

			return { key: asset.key, model: model };
		});

		for (const loaderPromise of loaderPromises) {
			const result = await loaderPromise;
			this.object3DPrototypes[result.key] = result.model;
			console.log('LOAD ASSET.');
		}

		console.log('FINISHED PARLLEL LOADING ASSETS.');
		this.loadScene();
	}
}

function promisifyLoader(loader, onProgress) {
	function promiseLoader(url) {
		return new Promise((resolve, reject) => {
			loader.load(url, resolve, onProgress, reject);
		});
	}

	return {
		originalLoader: loader,
		load: promiseLoader,
	};
}
