(() => {

    'use strict';

    const MAX_REALITY_SIZE = 1.3;

    const COMPONENT_NAME = 'reticle';
    const COMPONENT_PREFIX = 'reticle-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';

    AFRAME.registerSystem(COMPONENT_NAME, {

        init: function() {

            this.indicatorEl;

            let self = this;

            this.el.addEventListener('enter-ar', function _onEnterAR() {

                console.log('RETICLE ENTER AR CALLBACK.');

                self.arManager = self.el.renderer.xr;
                self.camera = self.arManager.getCamera(self.el.camera);
                self.frameOfReference = self.el.frameOfReference;
                self.session = self.el.xrSession;
                self.raycaster = new THREE.Raycaster();

                self.el.removeEventListener('enter-ar', _onEnterAR);

            });
            this.el.addEventListener('gamemodelloaded', function _init() {

                console.log('RETICLE GAMEMODELLOADED CALLBACK.');

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        },
        getIndicator: function() {

            if (this.indicatorEl === undefined) {

                this.indicatorEl = document.createElement('div');
                this.indicatorEl.setAttribute('id', 'stabilization');
                this.indicatorEl.classList.add('a-hidden');
                this.el.appendChild(this.indicatorEl);

            }

            return this.indicatorEl;

        },
        getRing: function() {

            let geometry = new THREE.RingGeometry(0.1, 0.11, 24, 1);
            let material = new THREE.MeshBasicMaterial({
                color: 0xffffff
            });

            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));
            return new THREE.Mesh(geometry, material);

        },
        getIcon: function() {

            let loader = new THREE.TextureLoader();
            let geometry = new THREE.PlaneBufferGeometry(0.15, 0.15);
            let material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });

            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));
            geometry.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(0)));

            let icon = new THREE.Mesh(geometry, material);

            loader.load('renderer/assets/Anchor.png', texture => {
                icon.material.opacity = 1;
                icon.material.map = texture;
                icon.material.needsUpdate = true;
            });

            return icon;

        },
        updatePositionByHitTest: async function(component) {
            /**
             *  @param {reticle-component} component
             */

            let camera = this.camera = this.arManager.getCamera(this.el.camera);
            this.raycaster.setFromCamera({
                x: 0,
                y: 0
            }, camera);

            let ray = this.raycaster.ray;
            let origin = new Float32Array(ray.origin.toArray());
            let direction = new Float32Array(ray.direction.toArray());
            let hits = await this.session.requestHitTest(origin, direction, this.frameOfReference);

            if (hits.length) {

                let hit = hits[0];
                let hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);
                let targetPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
                targetPos = component.el.parentNode.object3D.worldToLocal(targetPos);
                let angle = Math.atan2(targetPos.x - component.el.object3D.position.x, targetPos.z - component.el.object3D.position.z);

                component.el.object3D.position.setFromMatrixPosition(hitMatrix);
                component.el.object3D.rotation.set(0, angle, 0);
                component.el.emit('updatepositionbyhittest');

            }

        }

    });

    AFRAME.registerComponent('reticle', {

        schema: {
            targetEl: {
                type: 'selector',
                default: null
            }
        },
        init: function() {

            console.log('RETICLE INIT.');

            this.el.setObject3D('ring', this.system.getRing());
            this.el.setObject3D('icon', this.system.getIcon());
            this.el.object3D.visible = false;

            this.activateReticle = this.activateReticle.bind(this);
            this.placeObject = this.placeObject.bind(this);

            this.indicatorEl = this.system.getIndicator();

            let self = this;

            this.activateReticle();
            this.el.addEventListener('updatepositionbyhittest', function _onFirstHit() {

                if (!self.el.is('stabilized')) {

                    self.el.addState('stabilized');
                    self.indicatorEl.classList.add('a-hidden');
                    self.system.uiManager.updateARControl(self.activateReticle, function _placeObjectStartGame() {

                        self.placeObject();
                        // self.system.uiManager.clearARControl();
                        self.system.uiManager.updateARControl(self.activateReticle, self.placeObject);
                        self.system.networkManager.emit('nonPlayingEvent', {
                            event_name: 'model_ready'
                        });

                    });

                }

                self.el.removeEventListener('updatepositionbyhittest', _onFirstHit);

            });

        },
        tick: function(time, timeDelta) {

            if (this.system.session === undefined || !this.el.is('activated')) {

                return true;

            }

            if (!this.el.is('stabilized') && this.indicatorEl.classList.contains('a-hidden')) {

                this.indicatorEl.classList.remove('a-hidden');

            }

            this.system.updatePositionByHitTest(this);

        },
        tock: function(time, timeDelta) {

            this.el.sceneEl.renderer.shadowMap.needsUpdate = false;

        },
        remove: function() {

            delete this.indicatorEl;

        },
        activateReticle: function() {

            this.el.addState('activated');
            this.el.object3D.visible = true;

        },
        placeObject: function() {

            this.data.targetEl.object3D.position.copy(this.el.object3D.position);
            this.data.targetEl.object3D.visible = true;

            let bbox = new THREE.Box3().setFromObject(this.data.targetEl.object3D);
            let width = bbox.max.x - bbox.min.x;
            let depth = bbox.max.z - bbox.min.z;

            if (width < depth) {

                this.data.targetEl.object3D.scale.set(1 / depth, 1 / depth, 1 / depth);

            } else {

                this.data.targetEl.object3D.scale.set(1 / width, 1 / width, 1 / width);

            }
            this.data.targetEl.object3D.scale.multiplyScalar(MAX_REALITY_SIZE);

            let arShadowMesh = this.system.el.object3D.children.find(c => c.name === 'arShadowMesh');
            arShadowMesh.position.setY(this.el.object3D.position.y);
            this.system.el.renderer.shadowMap.needsUpdate = true;

            this.el.removeState('activated');
            this.el.object3D.visible = false;

        }

    });

})();
