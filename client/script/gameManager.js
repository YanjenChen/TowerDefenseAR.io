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
         *  gridEl: <a-entity grid> of the displayed grid.
         *  mode: Game operation mode, one of ['ar', 'vr'].
         *  object3DPrototypes: object with property { key: asset.key, model: THREE.object3D, width: width, height: height, depth: depth }, use to speed up performance.
         *  pathFinder: PF.AStarFinder. Handle graph search.
         *  enemyPath: Object contain two faction's enemy moving path.
         *  sceneEl: DOM node which point to <a-scene> element.
         *  settings: Contain all components' static params.
         *  staticScene: <a-entity> which indicate game static scene, all static object3D should be contained under this entity.
         *  towerBases: Two dimensional array of <a-entity>.components['tower-base'], use to quick access UI content.
         */
        this.anchorEl = null;
        this.configs = null;
        this.configDir = configDir;
        this.dynamicScene = null;
        this.gameGrid = null;
        this.gridEl = null;
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
        this.updateGameGrid = this.updateGameGrid.bind(this);
        this.updateGameGridArea = this.updateGameGridArea.bind(this);
        this.updateGameGridByModel = this.updateGameGridByModel.bind(this);
        this.areaIsPlaceable = this.areaIsPlaceable.bind(this);
        //this.calculatePath = this.calculatePath.bind(this);
        this.getNewPath = this.getNewPath.bind(this);
        this.sceneToGamegrid = this.sceneToGamegrid.bind(this);
        this.gamegridToScene = this.gamegridToScene.bind(this);
        this.loadObject3D = this.loadObject3D.bind(this);
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
                assetEl.setAttribute('src', value.src);
                assetsEl.appendChild(assetEl);
            });

            assetsEl.addEventListener('loaded', self.loadObject3D);
            self.sceneEl.appendChild(assetsEl);
        });
    }
    async loadScene() {
        let self = this;
        let mode = this.mode;
        let sceneEl = this.sceneEl;
        let globalVar = this.configs.globalVar;


        // Init cash manager.
        sceneEl.systems['tdar-game'].cashManager = new CashManager(sceneEl);


        if (mode == 'ar') {
            // Insert shadow plane.
            console.warn('Old AR script has been executed.');

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
        this.gridEl = gridEl;


        // add static scene.
        let staticScene = document.createElement('a-entity');
        staticScene.setAttribute('id', 'tdar-static-scene');
        jQuery.each(this.configs.staticScene, function(name, values) {
            if (name != 'abstractName') {
                if (self.object3DPrototypes[name] === undefined)
                    console.warn('Static scene config receive unknown model name: ', name);
                values.forEach(value => {
                    let objectEl = document.createElement('a-entity');
                    objectEl.setAttribute('gltf-model', '#' + name);
                    objectEl.object3D.position.set(value.scenePosition.x, value.scenePosition.y, value.scenePosition.z);
                    if (value.rotation)
                        objectEl.object3D.rotation.set(value.rotation.x, value.rotation.y, value.rotation.z);
                    if (value.scalar)
                        objectEl.object3D.scale.copy(self.object3DPrototypes[name].model.scale).multiplyScalar(value.scalar);
                    staticScene.appendChild(objectEl);
                    self.updateGameGridByModel(
                        value.scenePosition,
                        name,
                        value.walkable,
                        value.scalar
                    );
                    /*
                    TODO:
                        Load object3D using self.object3DPrototypes[name].model.clone()
                    */
                });
            }
        });
        staticScene.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
        sceneEl.appendChild(staticScene);
        this.staticScene = staticScene;


        // add dynamic scene.
        let dynamicScene = document.createElement('a-entity');
        dynamicScene.setAttribute('id', 'tdar-dynamic-scene');
        /*
        dynamicScene.addEventListener('loaded', function _listener() {
            console.log('Dynamic scene pause.');
            self.dynamicScene.pause();
            self.dynamicScene.removeEventListener('loaded', _listener);
        }); // Pause game after init.
        */
        /*
        dynamicScene.setAttribute('shadow', {
            cast: true,
            receive: false
        });
		*/
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
                            let scePos = self.gamegridToScene(el.gridPosition);
                            entity.object3D.position.set(scePos.x, scePos.y, scePos.z);
                            dynamicScene.appendChild(entity);
                        });
                    });
                    break;
                case 'castle':
                    // Assign id "castle-A" for each entity.
                    jQuery.each(values, function(faction, el) {
                        let entity = document.createElement('a-entity');
                        entity.setAttribute('id', name + '-' + faction);
                        entity.setAttribute(name, {
                            faction: faction,
                            healthPoint: self.settings[name].common.healthPoint
                        });
                        let scePos = self.gamegridToScene(el.gridPosition);
                        entity.object3D.position.set(scePos.x, scePos.y, scePos.z);
                        dynamicScene.appendChild(entity);
                    });
                    break;
                default:
                    console.warn('Dynamic scene config received unknown name: ', name);
            }
        });
        // Init towerBases. (Assume gameGrid has updated to init state.)
        this.towerBases = [];
        for (let i = -globalVar.gridConfig.width / 2; i <= globalVar.gridConfig.width / 2; i += 1) {
            let column = [];
            for (let k = -globalVar.gridConfig.depth / 2; k <= globalVar.gridConfig.depth / 2; k += 1) {
                let p = {
                    x: i,
                    y: 0,
                    z: k
                };
                if (await this.areaIsPlaceable(p, 2, 2, true)) {
                    let towerBaseEl = document.createElement('a-entity');
                    towerBaseEl.object3D.position.set(i, 0, k);
                    towerBaseEl.setAttribute('id', 'tower-base-' + i.toString() + '-' + k.toString());
                    towerBaseEl.setAttribute('tower-base', {});
                    column.push(towerBaseEl.components['tower-base']);
                    dynamicScene.appendChild(towerBaseEl);
                } else {
                    column.push(null);
                }
            }
            this.towerBases.push(column);
        }
        dynamicScene.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
        sceneEl.appendChild(dynamicScene);
        this.dynamicScene = dynamicScene;


        if (mode == 'ar') {
            // TODO: NEED UPDATE ALL SCRIPT HERE.
            console.warn('Old AR script has been executed.');

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
    updateGameGridArea(min, max, walkable, callback) {
        /*
         *  SPEC
         *      (Vec3 like) min: min coord in dynamicScene coord.
         *      (Vec3 like) max: max coord in dynamicScene coord.
         *      (boolen) walkable: walkable or not.
         *      (function) callback: callback function.
         */
        const maxShift = {
            x: max.x + (this.configs.globalVar.gridConfig.width / 2),
            y: 0,
            z: max.z + (this.configs.globalVar.gridConfig.depth / 2)
        };
        let gridMin = this.sceneToGamegrid(min);
        let gridMax = this.sceneToGamegrid(max);
        if (gridMax.x == maxShift.x) gridMax.x -= 1;
        if (gridMax.z == maxShift.z) gridMax.z -= 1;

        for (let i = gridMin.x; i <= gridMax.x; i++) {
            if (i < 0 || i >= this.configs.globalVar.gridConfig.width)
                continue;

            for (let k = gridMin.z; k <= gridMax.z; k++) {
                if (k < 0 || k >= this.configs.globalVar.gridConfig.depth)
                    continue;

                this.updateGameGrid(i, k, walkable);
            }
        }

        if (callback)
            callback();
    }
    updateGameGridByModel(pos, modelName, walkable, scalar) {
        /*
         *  SPEC
         *      (Vec3 like) pos: position in dynamicScene of the object.
         *      (string) modelName: model name in config file.
         *      (boolen) walkable: walkable or not.
         *      (number) scalar: (Optional) scalar of this model.
         */
        const scenePos = pos;

        if (scalar === undefined)
            scalar = 1;

        let info = this.object3DPrototypes[modelName];
        let min = {
            x: scenePos.x - (info.width / 2) * scalar,
            y: 0,
            z: scenePos.z - (info.depth / 2) * scalar
        };
        let max = {
            x: scenePos.x + (info.width / 2) * scalar,
            y: 0,
            z: scenePos.z + (info.depth / 2) * scalar
        };
        this.updateGameGridArea(min, max, walkable);
    }
    async areaIsPlaceable(pos, width, depth, mute) {
        /*
         *  EXPLAIN:
         *      Check area on game grid is placeable.
         *  SPEC
         *      (Vec3 like) pos: position in dynamicScene.
         *      (number) width: width of the area.
         *      (number) depth: depth of the area.
         *      (boolen) mute: (Optional) set to true to turn off output warning.
         */

        const scenePos = pos;
        let grid = this.gameGrid.clone();

        let min = {
            x: scenePos.x - (width / 2) + (this.configs.globalVar.gridConfig.width / 2),
            y: 0,
            z: scenePos.z - (depth / 2) + (this.configs.globalVar.gridConfig.depth / 2)
        };
        let max = {
            x: scenePos.x + (width / 2) + (this.configs.globalVar.gridConfig.width / 2),
            y: 0,
            z: scenePos.z + (depth / 2) + (this.configs.globalVar.gridConfig.depth / 2)
        };
        let gridMin = {
            x: Math.floor(min.x),
            y: 0,
            z: Math.floor(min.z)
        };
        let gridMax = {
            x: Math.floor(max.x),
            y: 0,
            z: Math.floor(max.z)
        };
        if (gridMax.x == max.x) gridMax.x -= 1;
        if (gridMax.z == max.z) gridMax.z -= 1;

        for (let i = gridMin.x; i <= gridMax.x; i++) {
            if (i < 0 || i >= this.configs.globalVar.gridConfig.width)
                return false;

            for (let k = gridMin.z; k <= gridMax.z; k++) {
                if (k < 0 || k >= this.configs.globalVar.gridConfig.depth)
                    return false;

                if (!this.gameGrid.isWalkableAt(i, k))
                    return false;

                grid.setWalkableAt(i, k, false);
            }
        }

        let self = this;
        let passables = [];
        jQuery.each(this.configs.dynamicScene['wave-spawner'], function(faction, arr) {
            arr.forEach(el => {
                passables.push(isPathPassable(el, faction));
            });
        });

        for (const passable of passables) {
            const _passable = await passable;
            if (!_passable)
                return false;
        }

        return true;

        async function isPathPassable(el, faction) {
            let g = grid.clone();
            let path = self.pathFinder.findPath(
                el.gridPosition.x,
                el.gridPosition.z,
                self.configs.dynamicScene.castle[faction == 'A' ? 'B' : 'A'].gridPosition.x,
                self.configs.dynamicScene.castle[faction == 'A' ? 'B' : 'A'].gridPosition.z,
                g
            );
            if (path.length == 0)
                return false;
            else
                return true;
        }
    }
    calculatePath(faction) {
        /*
         * SPEC
         *   (string) faction: one of ['A', 'B'].
         */
        console.warn('Depracted function calculatePath has been called.');
        return;

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
    async getNewPath(pos, faction) {
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
                this.configs.dynamicScene.castle['B'].gridPosition.x,
                this.configs.dynamicScene.castle['B'].gridPosition.z,
                grid
            );
        } else {
            path = this.pathFinder.findPath(
                transPos.x,
                transPos.z,
                this.configs.dynamicScene.castle['A'].gridPosition.x,
                this.configs.dynamicScene.castle['A'].gridPosition.z,
                grid
            );
        }

        if (path.length == 0)
            console.warn('Pathfind result in no route avaliable.');

        path = path.map(point => {
            let scePos = self.gamegridToScene({
                x: point[0],
                y: 0,
                z: point[1]
            });
            return new THREE.Vector3(scePos.x, scePos.y, scePos.z);
        });
        if (path.length == 1)
            path.splice(0, 0, startPos.clone());
        else
            path.splice(0, 1, startPos.clone());

        return new THREE['CatmullRomCurve3'](path);
    }
    sceneToGamegrid(position, mute) {
        /*
         *  EXPLAIN:
         *      Transform dynamicScene position (real number space) to game grid position (one block on grid).
         */
        let p = {
            x: Math.floor(position.x + (this.configs.globalVar.gridConfig.width / 2)),
            y: position.y,
            z: Math.floor(position.z + (this.configs.globalVar.gridConfig.depth / 2))
        }
        if ((p.x < 0 || p.x >= this.configs.globalVar.gridConfig.width || p.z < 0 || p.z >= this.configs.globalVar.gridConfig.depth) && !mute)
            console.warn('Function sceneToGamegrid return position out of grid range: ', p);

        return p;
    }
    gamegridToScene(position, mute) {
        /*
         *  EXPLAIN:
         *      Transform game grid position (one block on grid) to dynamicScene position (real number space).
         */
        if ((position.x < 0 || position.x >= this.configs.globalVar.gridConfig.width || position.z < 0 || position.z >= this.configs.globalVar.gridConfig.depth) && !mute)
            console.warn('Function gamegridToScene receive position out of grid range: ', position);

        return {
            x: position.x + 0.5 - (this.configs.globalVar.gridConfig.width / 2),
            y: position.y,
            z: position.z + 0.5 - (this.configs.globalVar.gridConfig.depth / 2)
        }
    }
    async loadObject3D() {
        console.log('ENTER LOAD OBJECT3D.');

        console.log('THREE have bug in cloning gltf model, object3DPrototypes is not implement. Currently use aframe gltf-model, this would cause some drop in performance.');

        let assets = [];
        jQuery.each(this.configs.assets, function(key, value) {
            assets.push({
                key: key,
                src: value.src,
                scalar: value.scalar
            });
        });

        const loaderPromises = assets.map(async asset => {
            const loader = promisifyLoader(new THREE.GLTFLoader());
            const gltfModel = await loader.load(asset.src);
            let model = gltfModel.scene || gltfModel.scenes[0];
            model.animations = gltfModel.animations;

            // normalize size.
            let bbox = new THREE.Box3().setFromObject(model);
            let width = bbox.max.x - bbox.min.x;
            let height = bbox.max.y - bbox.min.y;
            let depth = bbox.max.z - bbox.min.z;

            if (width < depth)
                model.scale.set(1 / depth, 1 / depth, 1 / depth);
            else
                model.scale.set(1 / width, 1 / width, 1 / width);
            model.scale.multiplyScalar(asset.scalar);

            bbox = new THREE.Box3().setFromObject(model);
            width = bbox.max.x - bbox.min.x;
            height = bbox.max.y - bbox.min.y;
            depth = bbox.max.z - bbox.min.z;

            return {
                key: asset.key,
                model: model,
                width: width,
                height: height,
                depth: depth
            };
        });

        for (const loaderPromise of loaderPromises) {
            const result = await loaderPromise;
            this.object3DPrototypes[result.key] = result;
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
