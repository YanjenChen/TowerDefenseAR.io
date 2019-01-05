(() => {

    'use strict';

    AFRAME.registerComponent('reticle', {

        schema: {
            targetEl: {
                type: 'selector',
                default: null
            },
            scaleFactor: {
                type: 'number',
                default: 0.1
            }
        },
        init: function() {

            this.targetEl = this.data.targetEl;

            let indicatorEl = this.el.sceneEl.querySelector('#stabilization');

            if (!indicatorEl) {

                indicatorEl = document.createElement('div');
                indicatorEl.setAttribute('id', 'stabilization');
                indicatorEl.classList.add('a-hidden');
                this.el.sceneEl.appendChild(indicatorEl);

            }

            this.session = null;
            this.arManager = null;
            this.frameOfReference = null;

            // load reticle object3D
            this.loader = new THREE.TextureLoader();

            let geometry = new THREE.RingGeometry(0.1, 0.11, 24, 1);
            let material = new THREE.MeshBasicMaterial({
                color: 0xffffff
            });
            // Orient the geometry so its position is flat on a horizontal surface
            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));

            this.ring = new THREE.Mesh(geometry, material);

            geometry = new THREE.PlaneBufferGeometry(0.15, 0.15);
            // Orient the geometry so its position is flat on a horizontal surface,
            // as well as rotate the image so the anchor is facing the user
            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));
            geometry.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(0)));
            material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });
            this.icon = new THREE.Mesh(geometry, material);

            // Load the anchor texture and apply it to our material
            // once loaded
            this.loader.load('renderer/assets/Anchor.png', texture => {
                this.icon.material.opacity = 1;
                this.icon.material.map = texture;

                this.el.setObject3D('ring', this.ring);
                this.el.setObject3D('icon', this.icon);
            });

            this.el.object3D.visible = false;

            // Initialize after scene enter ar mode.
            this.el.sceneEl.addEventListener('enter-ar', this.onEnterAR.bind(this));
            this.placeObject = this.placeObject.bind(this);
        },
        tick: function(time, timeDelta) {
            var self = this
            if (!this.session || self.el.is('complete'))
                return;

            let camera = this.arManager.getCamera(this.el.sceneEl.camera);

            this.raycaster = this.raycaster || new THREE.Raycaster();
            this.raycaster.setFromCamera({
                x: 0,
                y: 0
            }, camera);
            let ray = this.raycaster.ray;

            let origin = new Float32Array(ray.origin.toArray());
            let direction = new Float32Array(ray.direction.toArray());
            this.session.requestHitTest(origin, direction, this.frameOfReference).then(function(hits) {
                if (hits.length) {
                    let hit = hits[0];
                    let hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);

                    // Now apply the position from the hitMatrix onto our model
                    self.el.object3D.position.setFromMatrixPosition(hitMatrix);

                    let targetPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
                    targetPos = self.el.parentNode.object3D.worldToLocal(targetPos);
                    let angle = Math.atan2(targetPos.x - self.el.object3D.position.x, targetPos.z - self.el.object3D.position.z);
                    self.el.object3D.rotation.set(0, angle, 0);


                    if (!self.el.is('stabilized')) {
                        self.el.object3D.visible = true;
                        self.el.addState('stabilized');
                        self.el.sceneEl.querySelector('#stabilization').classList.add('a-hidden');

                        // Place targetEl if specified.
                        if (self.targetEl !== null) {
                            self.el.sceneEl.systems['tdar-game-ui'].displayUIs([{
                                callback: self.placeObject,
                                icon: 'hammer'
                            }]);
                        }
                    }
                }
            });
        },
        tock: function(time, timeDelta) {
            this.el.sceneEl.renderer.shadowMap.needsUpdate = false;
        },
        remove: function() {
            delete this.session;
            delete this.arManager;
            delete this.frameOfReference;
            this.el.sceneEl.removeEventListener('enter-ar', this.onEnterAR.bind(this));
        },
        onEnterAR: function() {
            this.arManager = this.el.sceneEl.renderer.xr;
            this.session = this.el.sceneEl.xrSession;
            this.frameOfReference = this.el.sceneEl.frameOfReference;
            this.el.sceneEl.querySelector('#stabilization').classList.remove('a-hidden');
        },
        // Testing function, should be delete.
        placeObject: function() {
            var self = this;
            if (!this.session)
                return;

            let camera = self.arManager.getCamera(self.el.sceneEl.camera);

            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({
                x: 0,
                y: 0
            }, camera);
            let ray = raycaster.ray;

            let origin = new Float32Array(ray.origin.toArray());
            let direction = new Float32Array(ray.direction.toArray());
            self.session.requestHitTest(origin, direction, self.frameOfReference).then(function(hits) {
                if (hits.length) {
                    let hit = hits[0];
                    let hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);

                    self.targetEl.object3D.position.setFromMatrixPosition(hitMatrix);

                    let targetPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
                    targetPos = self.targetEl.parentNode.object3D.worldToLocal(targetPos);
                    let angle = Math.atan2(targetPos.x - self.targetEl.object3D.position.x, targetPos.z - self.targetEl.object3D.position.z);
                    self.targetEl.object3D.rotation.set(0, angle, 0);

                    let arShadowMesh = self.el.sceneEl.object3D.children.find(c => c.name === 'arShadowMesh');
                    arShadowMesh.position.y = self.targetEl.object3D.position.y;

                    self.targetEl.object3D.scale.set(self.data.scaleFactor, self.data.scaleFactor, self.data.scaleFactor);
                    self.targetEl.object3D.visible = true;
                    self.el.sceneEl.renderer.shadowMap.needsUpdate = true;
                    self.el.sceneEl.emit('placed_target_to_ar');

                    self.el.object3D.visible = false;
                    self.el.addState('complete');
                }
            });
        }
    });
})();
