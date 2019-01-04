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
         *  placeableGrid: PF.Grid object which store dynamic game placeable grid.
         *  enemyPath: Object contain two faction's enemy moving path.
         *  sceneEl: DOM node which point to <a-scene> element.
         *  settings: Contain all components' static params.
         *  staticScene: <a-entity> which indicate game static scene, all static object3D should be contained under this entity.
         *  towerBases: Two dimensional array of <a-entity>.components['tower-base'], use to quick access UI content.
         *  tileMap: Two dimensional map of {towerInRange: [], enemyInRange: []}, use to optimize performance.
         *  tileSize: width and depth of one time relative to one grid.
         *  tileWidth: width of tileMap.
         *  tileDepth: depth of tileMap.
         *  Utils: util object store utility functions.
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
        this.placeableGrid = null;
        this.enemyPath = {
            A: null,
            B: null
        };
        this.sceneEl = sceneEl;
        this.settings = null;
        this.staticScene = null;
        this.towerBases = null;
        this.tileMap = null;
        this.tileSize = null;
        this.tileWidth = 0;
        this.tileDepth = 0;
        this.Utils = null;


        this.loadConfig = this.loadConfig.bind(this);
        this.loadScene = this.loadScene.bind(this);
        this.updateGameGridByModel = this.updateGameGridByModel.bind(this);
        this.updatePlaceableGridByModel = this.updatePlaceableGridByModel.bind(this);
        this.updateTowerToTileMap = this.updateTowerToTileMap.bind(this);
        this.addEnemyToTileMap = this.addEnemyToTileMap.bind(this);
        this.removeEnemyFromTileMap = this.removeEnemyFromTileMap.bind(this);
        this.areaIsPlaceable = this.areaIsPlaceable.bind(this);
        //this.calculatePath = this.calculatePath.bind(this);
        this.getNewPath = this.getNewPath.bind(this);
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
            self.Utils = new Utils(configs.globalVar);
            self.sceneEl.systems['tdar-game'].cashManager = new CashManager(self.sceneEl); // Init cash manager.

            // Pre-load model by assets management system.
            let assetsEl = document.createElement('a-assets');

            jQuery.each(configs.assets, function(faction, contents) {

                jQuery.each(contents, function(name, value) {

                    let assetEl = document.createElement('a-asset-item');

                    assetEl.setAttribute('id', faction + '-' + name + '-asset');
                    assetEl.setAttribute('src', value.src);
                    assetsEl.appendChild(assetEl);

                });

            });

            assetsEl.addEventListener('loaded', self.loadObject3D);
            self.sceneEl.appendChild(assetsEl);

        });

    }


    async loadObject3D() {

        console.log('ENTER LOAD OBJECT3D.');

        let assets = [];

        jQuery.each(this.configs.assets, function(faction, contents) {

            jQuery.each(contents, function(key, value) {

                assets.push({
                    key: faction + '-' + key,
                    src: value.src,
                    scalar: value.scalar
                });

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

            if (width < depth) {

                model.scale.set(1 / depth, 1 / depth, 1 / depth);

            } else {

                model.scale.set(1 / width, 1 / width, 1 / width);

            }
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
            console.log('LOAD ASSET: ', result.key);

        }

        console.log('FINISHED PARLLEL LOADING ASSETS.');
        this.sceneEl.emit('gamemodelloaded');
        this.loadScene();

    }


    async loadScene() {

        let self = this;
        let mode = this.mode;
        let sceneEl = this.sceneEl;
        let globalVar = this.configs.globalVar;


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
        this.placeableGrid = this.gameGrid.clone();
        let gridEl = document.createElement('a-entity');
        gridEl.setAttribute('id', 'tdar-game-grid');
        gridEl.setAttribute('grid', {
            width: globalVar.gridConfig.width,
            depth: globalVar.gridConfig.depth
        });
        gridEl.object3D.scale.set(globalVar.sceneScale, globalVar.sceneScale, globalVar.sceneScale);
        sceneEl.appendChild(gridEl);
        this.gridEl = gridEl;


        // Init tile system.
        this.tileMap = [];
        this.tileSize = globalVar.tileSize;
        this.tileWidth = Math.floor(globalVar.gridConfig.width / globalVar.tileSize);
        this.tileDepth = Math.floor(globalVar.gridConfig.depth / globalVar.tileSize);
        for (let i = 0; i < this.tileWidth; i++) {

            let column = [];
            for (let k = 0; k < this.tileDepth; k++) {

                column.push({
                    towerInRange: [],
                    enemyInRange: []
                });

            }
            this.tileMap.push(column);

        }


        // add static scene.
        let staticScene = document.createElement('a-entity');
        staticScene.setAttribute('id', 'tdar-static-scene');
        jQuery.each(this.configs.staticScene, function(name, values) {

            if (name != 'abstractName') {

                name = 'static-' + name; // Add prefix.
                if (self.object3DPrototypes[name] === undefined) {

                    console.warn('Static scene config receive unknown model name: ', name);

                }

                values.forEach(value => {

                    let object3D = THREE.AnimationUtils.clone(self.object3DPrototypes[name].model);
                    object3D.position.set(value.scenePosition.x, value.scenePosition.y, value.scenePosition.z);
                    if (value.rotation)
                        object3D.rotation.set(value.rotation.x, value.rotation.y, value.rotation.z);
                    if (value.scalar)
                        object3D.scale.multiplyScalar(value.scalar);
                    staticScene.object3D.add(object3D);
                    self.updateGameGridByModel(
                        value.scenePosition,
                        name,
                        value.walkable,
                        value.scalar
                    );
                    /*
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

                case 'spawner':
                    // Assign id "RED-spawner-{id}" for each entity.
                    idCounter = 0;
                    jQuery.each(values, function(faction, arr) {

                        arr.forEach(el => {

                            let entityEl = document.createElement('a-entity');
                            entityEl.setAttribute('id', faction + '-' + name + '-' + idCounter.toString());
                            idCounter++;
                            entityEl.setAttribute(name, {
                                faction: faction
                            });
                            let scePos = self.Utils.gamegridToScene(el.gridPosition);
                            entityEl.object3D.position.set(scePos.x, scePos.y, scePos.z);
                            dynamicScene.appendChild(entityEl);
                            self.updatePlaceableGridByModel(
                                entityEl.object3D.position,
                                faction + '-' + name, // Add prefix.
                                false
                            );

                        });

                    });
                    break;

                case 'castle':
                    // Assign id "RED-castle" for each entity.
                    jQuery.each(values, function(faction, el) {

                        let entityEl = document.createElement('a-entity');
                        entityEl.setAttribute('id', faction + '-' + name);
                        entityEl.setAttribute(name, {
                            faction: faction,
                            healthPoint: self.settings[name].common.healthPoint
                        });
                        let scePos = self.Utils.gamegridToScene(el.gridPosition);
                        entityEl.object3D.position.set(scePos.x, scePos.y, scePos.z);
                        dynamicScene.appendChild(entityEl);
                        self.updatePlaceableGridByModel(
                            entityEl.object3D.position,
                            faction + '-' + name, // Add prefix.
                            false
                        );

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
    updateGameGridByModel(pos, key, walkable, scalar) {
        /**
         *  @param {THREE.Vector3 like} pos - position in dynamicScene of the object.
         *  @param {string} key - property of this.object3DPrototypes.
         *  @param {boolen} walkable - set to true to allow walkable on grid coordinate.
         *  @param {number} scalar - (Optional) scalar of this model.
         */

        this.updatePlaceableGridByModel(pos, key, walkable, scalar);

        if (scalar === undefined) {

            scalar = 1;

        }

        let info = this.object3DPrototypes[key];

        if (info === undefined) {

            console.warn('updateGameGridByModel received unknown key: ', key);

        }

        let min = {
            x: pos.x - (info.width / 2) * scalar,
            y: 0,
            z: pos.z - (info.depth / 2) * scalar
        };
        let max = {
            x: pos.x + (info.width / 2) * scalar,
            y: 0,
            z: pos.z + (info.depth / 2) * scalar
        };

        this.Utils.updateGameGridArea(min, max, walkable, this.gameGrid);

    }
    updatePlaceableGridByModel(pos, key, walkable, scalar) {
        /**
         *  @param {THREE.Vector3 like} pos - position in dynamicScene of the object.
         *  @param {string} key - property of this.object3DPrototypes.
         *  @param {boolen} walkable - set to true to allow walkable on grid coordinate.
         *  @param {number} scalar - (Optional) scalar of this model.
         */

        if (scalar === undefined) {

            scalar = 1;

        }

        let info = this.object3DPrototypes[key];

        if (info === undefined) {

            console.warn('updatePlaceableGridByModel received unknown key: ', key);

        }

        let min = {
            x: pos.x - (info.width / 2) * scalar,
            y: 0,
            z: pos.z - (info.depth / 2) * scalar
        };
        let max = {
            x: pos.x + (info.width / 2) * scalar,
            y: 0,
            z: pos.z + (info.depth / 2) * scalar
        };

        this.Utils.updateGameGridArea(min, max, walkable, this.placeableGrid);

    }
    updateTowerToTileMap(pos, range, el, remove) {
        /*
         *  SPEC
         *      (Vec3 like) pos: position in dynamicScene of the object.
         *      (Number) range: attack range of the tower.
         *      (DOM node) el: <a-entity> of the
         *      (boolen) remove: (Optional) set to true to remove tower form tile map.
         */
        let tileMin = this.Utils.sceneToTile({
            x: pos.x - range,
            z: pos.z - range
        });
        let tileMax = this.Utils.sceneToTile({
            x: pos.x + range,
            z: pos.z + range
        }, true);

        for (let i = tileMin.x; i <= tileMax.x; i++) {
            if (i < 0 || i >= this.tileWidth)
                continue;

            for (let k = tileMin.z; k <= tileMax.z; k++) {
                if (k < 0 || k >= this.tileDepth)
                    continue;

                let index = this.tileMap[i][k].towerInRange.indexOf(el);
                if (!(remove === true) && index == -1)
                    this.tileMap[i][k].towerInRange.push(el);
                else if (remove === true && index > -1)
                    this.tileMap[i][k].towerInRange.splice(index, 1);

            }
        }
    }
    addEnemyToTileMap(pos, el) {
        /*
         *  SPEC
         *      (Vec3 like) pos: position in dynamicScene of the object.
         *      (DOM node) el: <a-entity> of the enemy.
         */
        let tilePos = this.Utils.sceneToTile(pos);
        let index = this.tileMap[tilePos.x][tilePos.z].enemyInRange.indexOf(el);
        if (index === -1) {
            this.tileMap[tilePos.x][tilePos.z].enemyInRange.push(el);
            this.tileMap[tilePos.x][tilePos.z].towerInRange.forEach(towerEl => {
                if (towerEl.components['tower'].data.faction !== el.components['unit'].data.faction && towerEl.components['tower'].enemiesInRange.indexOf(el) === -1)
                    towerEl.components['tower'].enemiesInRange.push(el);
            });
        }

        // console.log(this.tileMap);
    }
    removeEnemyFromTileMap(tilePos, el) {
        let index = this.tileMap[tilePos.x][tilePos.z].enemyInRange.indexOf(el);
        if (index > -1) {
            this.tileMap[tilePos.x][tilePos.z].enemyInRange.splice(index, 1);
            this.tileMap[tilePos.x][tilePos.z].towerInRange.forEach(towerEl => {
                if (towerEl.components['tower'].data.faction === el.components['unit'].data.faction)
                    return;

                index = towerEl.components['tower'].enemiesInRange.indexOf(el)
                if (index > -1)
                    towerEl.components['tower'].enemiesInRange.splice(index, 1);
            });
        }

        // console.log(this.tileMap);
    }
    async areaIsPlaceable(pos, width, depth) {
        /*
         *  EXPLAIN:
         *      Check area on game grid is placeable.
         *  SPEC
         *      (Vec3 like) pos: position in dynamicScene.
         *      (number) width: width of the area.
         *      (number) depth: depth of the area.
         */

        let grid = this.gameGrid.clone();

        let gridMin = this.Utils.sceneToGamegrid({
            x: pos.x - (width / 2),
            y: 0,
            z: pos.z - (depth / 2)
        });
        let gridMax = this.Utils.sceneToGamegrid({
            x: pos.x + (width / 2),
            y: 0,
            z: pos.z + (depth / 2)
        }, true);

        for (let i = gridMin.x; i <= gridMax.x; i++) {
            if (i < 0 || i >= this.configs.globalVar.gridConfig.width)
                return false;

            for (let k = gridMin.z; k <= gridMax.z; k++) {
                if (k < 0 || k >= this.configs.globalVar.gridConfig.depth)
                    return false;

                if (!this.placeableGrid.isWalkableAt(i, k)) // prevent set on spawner or castle.
                    return false;

                grid.setWalkableAt(i, k, false);
            }
        }

        let self = this;
        let passables = [];
        jQuery.each(this.configs.dynamicScene['spawner'], function(faction, arr) {
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
                self.configs.dynamicScene.castle[faction === 'RED' ? 'BLACK' : 'RED'].gridPosition.x,
                self.configs.dynamicScene.castle[faction === 'RED' ? 'BLACK' : 'RED'].gridPosition.z,
                g
            );
            if (path.length === 0)
                return false;
            else
                return true;
        }
    }
    calculatePath(faction) {
        /*
         * SPEC
         *   (string) faction: one of ['RED', 'BLACK'].
         */
        console.warn('Depracted function calculatePath has been called.');
        return;

        let grid = this.gameGrid.clone();
        let path;

        if (faction == 'RED') {
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
    async getNewPath(startPos, faction) {
        /*
         * Calculate the shortest path from given position to castle.
         *
         * SPEC
         *	(Vec3) startPos
         *  (string) faction: one of ['RED', 'BLACK'].
         */
        let transPos = this.Utils.sceneToGamegrid(startPos);
        let grid = this.gameGrid.clone();
        let path;
        let self = this;

        path = this.pathFinder.findPath(
            transPos.x,
            transPos.z,
            this.configs.dynamicScene.castle[faction == 'RED' ? 'BLACK' : 'RED'].gridPosition.x,
            this.configs.dynamicScene.castle[faction == 'RED' ? 'BLACK' : 'RED'].gridPosition.z,
            grid
        );

        if (path.length == 0)
            console.warn('Pathfind result in no route avaliable.');

        path = path.map(point => {
            let pos = self.Utils.gamegridToScene({
                x: point[0],
                y: 0,
                z: point[1]
            });
            return new THREE.Vector3(pos.x, pos.y, pos.z);
        });
        if (path.length == 1)
            path.splice(0, 0, startPos.clone());
        else
            path.splice(0, 1, startPos.clone());

        return new THREE['CatmullRomCurve3'](path);
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
