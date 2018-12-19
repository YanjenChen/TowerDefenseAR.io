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

        this.loadConfig = this.loadConfig.bind(this);
        this.loadScene = this.loadScene.bind(this);
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
    loadConfig() {
        if(!this.configDir){
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
            assetsEl.addEventListener('loaded', self.loadScene);
            self.sceneEl.appendChild(assetsEl);
        });
    }
    loadScene() {
        let self = this;
        let mode = this.mode;
        let sceneEl = this.sceneEl;

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
        if (this.configs.staticScene.model)
            staticScene.setAttribute('gltf-model', this.configs.staticScene.model);
        if (this.configs.staticScene.child)
            staticScene.insertAdjacentHTML('beforeend', this.configs.staticScene.child);
        sceneEl.appendChild(staticScene);
        this.staticScene = staticScene;

        // add dynamic scene.
        let dynamicScene = document.createElement('a-entity');
        dynamicScene.setAttribute('id', 'tdar-dynamic-scene');
        dynamicScene.setAttribute('shadow', {
            cast: true,
            receive: false
        });
        dynamicScene.setAttribute('position', this.configs.dynamicScene.offset);
        sceneEl.appendChild(dynamicScene);
        this.dynamicScene = dynamicScene;

        // visualize obstacles to static scene.
        this.configs.dynamicScene.obstacles.forEach(obs_position => {
            let obsEl = document.createElement('a-entity');
            obsEl.setAttribute('geometry', this.configs.settings.obstacle.geometry);
            obsEl.setAttribute('material', this.configs.settings.obstacle.material);
            obsEl.setAttribute('position', {
                x: obs_position[0] + 0.5,
                y: obs_position[1],
                z: obs_position[2] + 0.5
            });
            self.staticScene.appendChild(obsEl);
        });

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
        let walkableMatrix = [];
        for (let k = 0; k < this.configs.dynamicScene.depth; k++) {
            let row = [];
            for (let i = 0; i < this.configs.dynamicScene.width; i++) {
                row.push(0);
            }
            walkableMatrix.push(row);
        }
        this.configs.dynamicScene.obstacles.forEach(obs_position => {
            walkableMatrix[obs_position[2]][obs_position[0]] = 1;
        });
        this.gameGrid = new PF.Grid(walkableMatrix);
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
        let grid = this.gameGrid.clone();;
        let path;

        if(faction == 'A') {
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

        path = PF.Util.smoothenPath(grid, path);
        path = path.map((point) => {
            return [point[0] + 0.5, point[1] + 0.5];
        });
        delete this.enemyPath[faction];
        this.enemyPath[faction] = path;

        return path;
    }
}
