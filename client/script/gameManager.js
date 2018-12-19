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
         *  pathFinder: PF.AStarFinder. Handle graph search.
         *  enemyPath: Object contain two faction's enemy moving path.
         *  sceneEl: DOM node which point to <a-scene> element.
         *  settings: Contain all components' static params.
         *  staticScene: <a-entity> which indicate game static scene, all static object3D should be contained under this entity.
         */
        this.anchorEl = null;
        this.configs = null;
        this.configDir = configDir;
        this.dynamicScene = null;
        this.gameGrid = null;
        this.mode = mode;
        this.pathFinder = new PF.AStarFinder();
        this.enemyPath = {
            A: null,
            B: null
        };
        this.sceneEl = sceneEl;
        this.settings = null;
        this.staticScene = null;
    }
    get anchorEl() {
        return this.anchorEl;
    }
    get configs() {
        return this.configs;
    }
    get configDir() {
        return this.configDir;
    }
    get dynamicScene() {
        return this.dynamicScene;
    }
    get gameGrid() {
        return this.gameGrid;
    }
    get mode() {
        return this.mode;
    }
    get pathFinder() {
        return this.pathFinder;
    }
    get enemyPath() {
        return this.enemyPath;
    }
    get sceneEl() {
        return this.sceneEl;
    }
    get settings() {
        return this.settings;
    }
    get staticScene() {
        return this.staticScene;
    }
    loadConfig(callback) {
        if(!this.mapDir){
            console.warn('Game manager does not receive config directory.');
            return;
        }

        let self = this;
        jQuery.getJSON(this.configDir, configs => {
            self.configs = configs;
            self.settings = configs.settings;

            // Pre-load model by assets management system.
            let assetsEl = document.createElement('a-assets');
            configs.assets.forEach(asset => {
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
            obsEl.setAttribute('position', {
                x: obs_position[0] + 0.5,
                y: obs_position[1],
                z: obs_position[2] + 0.5
            });
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
                    baseEl.setAttribute('position', {
                        x: i + 0.5,
                        y: 0,
                        z: k + 0.5
                    });
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
                    baseEl.setAttribute('position', {
                        x: i + 0.5,
                        y: 0,
                        z: k + 0.5
                    });
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