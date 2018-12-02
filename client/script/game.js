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
            switch (this.data.mode) {
                case 'single-player':
                    this.ENEMY_COUNTER = -1;

                    this.el.addEventListener('loaded', this.onAssetsLoaded.bind(this));
                    this.el.addEventListener('placed_target_to_ar', this.onStabilized.bind(this));
                    this.el.addEventListener('start_game', this.onStartGame.bind(this));
                    //console.warn("AFRAME Init");

                    this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
                    this.el.addEventListener('executeRequest', this.onExecute.bind(this)); // Listen server broadcast.
                    break;
                case 'multi-player':
                    this.socket = SOCKET;
                    this.room_id = jQuery("#room_id").val();
                    this.user = jQuery("#user").val();
                    this.user_faction = jQuery("#user_faction").val() == '1' ? 'A' : 'B';
                    //console.log("game.js initialized. ROOM_ID: " + ROOM_ID + ", USER: " + USER);

                    this.el.addEventListener('loaded', this.onStabilized.bind(this));
                    this.socket.on('client_start_game', this.onStartGame.bind(this));
                    //console.warn("AFRAME Init");

                    this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
                    this.socket.on('playingEvent', this.onExecute.bind(this)); // Listen server broadcast.
                    break;
                default:
                    console.warn('GAME MODE ERROR.');
            }
        },
        onAssetsLoaded: function() {
            // Inset shadow plane.
            let planeGeometry = new THREE.PlaneGeometry(2000, 2000);
            planeGeometry.rotateX(-Math.PI / 2);
            let shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
                color: 0x111111,
                opacity: 0.2,
            }));
            shadowMesh.name = 'arShadowMesh';
            shadowMesh.receiveShadow = true;
            shadowMesh.position.y = 10000;
            this.el.object3D.add(shadowMesh);

            // Insert light in scene.
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
            this.el.appendChild(light);
            this.el.appendChild(directionalLight);

            // add reticle and table-object to scene.
            let table = document.createElement('a-entity');
            table.setAttribute('gltf-model', '#table');
            table.setAttribute('id', 'ar-mode-baseEntity');
            table.setAttribute('shadow', {
                cast: true,
                receive: true
            });
            // For complex AR scene testing.
            table.insertAdjacentHTML('beforeend', '<a-entity gltf-model="renderer/assets/mill/model.gltf" position="-4.233 9.5 -7.462" scale="2 2 2" rotation="0 29.999999999999996 0"></a-entity><a-entity gltf-model="renderer/assets/mill/model.gltf" position="3.747 9.5 7.481" scale="2 2 2" rotation="0 210.00000000000003 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="-1.16 7.443 -8.049" scale="0.008 0.008 0.008" rotation=""></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="0.682 7.443 -7.144" scale="0.008 0.008 0.008" rotation="0 80 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="2.736 7.443 -8.005" scale="0.008 0.008 0.008" rotation="0 210.00000000000003 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="4.492 7.443 -8.254" scale="0.008 0.008 0.008" rotation="0 140 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="3.838 7.443 -5.63" scale="0.008 0.008 0.008" rotation="0 10 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="4.679 7.443 -3.913" scale="0.008 0.008 0.008" rotation="0 95 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="0.039 7.443 8.086" scale="0.008 0.008 0.008" rotation="0 210.00000000000003 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="-1.942 7.443 7.219" scale="0.008 0.008 0.008" rotation="0 170 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="-3.773 7.443 8.075" scale="0.008 0.008 0.008" rotation="0 270 0"></a-entity><a-entity gltf-model="renderer/assets/tree01/model.gltf" position="-4.689 7.443 6.142" scale="0.008 0.008 0.008" rotation=""></a-entity><a-entity gltf-model="renderer/assets/corn_field/model.gltf" position="-3.995 7.443 0.834" scale="0.15 0.15 0.15" rotation=""></a-entity><a-entity gltf-model="renderer/assets/corn_field/model.gltf" position="-2.302 7.443 -1.035" scale="0.15 0.15 0.15" rotation=""></a-entity><a-entity gltf-model="renderer/assets/corn_field/model.gltf" position="1.959 7.443 1.891" scale="0.15 0.15 0.15" rotation=""></a-entity><a-entity gltf-model="renderer/assets/corn_field/model.gltf" position="4.069 7.443 1.891" scale="0.15 0.15 0.15" rotation=""></a-entity><a-entity gltf-model="renderer/assets/stone/model.gltf" position="-3.888 7.443 4.785" scale="" rotation=""></a-entity><a-entity gltf-model="renderer/assets/stone/model.gltf" position="-3.036 7.443 3.242" scale="" rotation="0 38 0"></a-entity><a-entity gltf-model="renderer/assets/stone/model.gltf" position="2.151 7.443 -1.341" scale="" rotation="0 59.99999999999999 0"></a-entity><a-entity gltf-model="renderer/assets/stone/model.gltf" position="4.142 7.443 -1.341" scale="" rotation="0 210.00000000000003 0"></a-entity>');
            let sceneEntity = document.createElement('a-entity');
            sceneEntity.setAttribute('id', 'ar-mode-sceneEntity');
            sceneEntity.setAttribute('shadow', {
                cast: true,
                receive: false
            })
            sceneEntity.setAttribute('position', '0 7.543 0');
            table.appendChild(sceneEntity);
            this.el.appendChild(table);

            table.addEventListener('loaded', function() {
                this.object3D.visible = false;

                let reticle = document.createElement('a-entity');
                // Affect base scene object scale.
                reticle.setAttribute('reticle', {
                    targetEl: '#' + this.id,
                    scaleFactor: 0.08
                });
                this.sceneEl.appendChild(reticle);
            });
        },
        onStabilized: function() {
            //console.warn('Assets successful loaded.');
            this.sceneEntity = this.data.ar ? document.querySelector('#ar-mode-sceneEntity') : document.querySelector('a-scene');
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
            //console.warn('Client start game.')
            let cursor = document.createElement('a-entity');
            cursor.setAttribute('cursor', {
                fuse: false
            });
            cursor.setAttribute('position', '0 0 -0.1');
            cursor.setAttribute('geometry', 'primitive: ring; radiusInner: 0.002; radiusOuter: 0.003');
            cursor.setAttribute('material', 'color: black; shader: flat');
            cursor.setAttribute('raycaster', 'objects: [data-raycastable]');
            document.querySelector('[camera]').appendChild(cursor);

            jQuery.getJSON('./renderer/maps/webxr_test.json', (map) => {
                /* SCENE LOADER */
                map.factions.forEach(faction => {
                    // load enemy path.
                    faction.enemyPath.forEach(path => {
                        var curveEl = document.createElement('a-entity');
                        curveEl.setAttribute('path', {});
                        curveEl.setAttribute('id', faction.name + 'faction' + path.type + 'path');
                        path.points.forEach((point) => {
                            var pointEl = document.createElement('a-entity');
                            pointEl.setAttribute('path-point', {});
                            pointEl.setAttribute('position', point);
                            curveEl.appendChild(pointEl);
                        });

                        // ONLY USE IN DEVELOPER TESTING
                        //curveEl.setAttribute('draw-path', {
                        //    path: '#' + faction.name + 'faction' + path.type + 'path'
                        //});
                        ////////////////////////////////

                        this.sceneEntity.appendChild(curveEl);
                    });

                    // load tower bases.
                    faction.towerBases.forEach(base => {
                        baseEl = document.createElement('a-entity');
                        baseEl.setAttribute('geometry', map.settings.towerBase.geometry);
                        baseEl.setAttribute('material', map.settings.towerBase.material);
                        baseEl.setAttribute('position', base.position);
                        baseEl.setAttribute('data-raycastable', '');
                        baseEl.setAttribute('tower-base', {
                            faction: faction.name
                        });
                        this.sceneEntity.appendChild(baseEl);
                    });

                    // load wave spawner.
                    waveSpawnerEl = document.createElement('a-entity');
                    waveSpawnerEl.setAttribute('wave-spawner', faction.waveSpawner.schema);
                    waveSpawnerEl.setAttribute('position', faction.waveSpawner.position);
                    this.sceneEntity.appendChild(waveSpawnerEl);

                    // load castle
                    castleEl = document.createElement('a-entity');
                    castleEl.setAttribute('castle', faction.castle.schema);
                    castleEl.setAttribute('geometry', map.settings.castle.geometry);
                    castleEl.setAttribute('position', faction.castle.position);
                    this.sceneEntity.appendChild(castleEl);

                    this.el.addState('tdar-game-running');
                });
            });
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
                            healthPoint: 6,
                            speed: 0.6,
                            targetCastle: content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle'
                        });
                    }
                    break;
            }
        }
    });
})();
