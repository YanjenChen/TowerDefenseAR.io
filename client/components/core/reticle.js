(() => {
    AFRAME.registerComponent('reticle', {
        schema: {},
        init: function() {
            let indicatorEl = this.el.sceneEl.querySelector('#stabilization');
            if (!indicatorEl) {
                //
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
        },
        update: function(oldData) {
            /*
            if (this.el.sceneEl.is('ar-mode') && !this.session) {
                onEnterAR();
            }
            */
        },
        tick: function(time, timeDelta) {
            var self = this
            if (!this.session)
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
                    //let world_position = new THREE.Vector3().setFromMatrixPosition(hitMatrix);
                    //self.el.setAttribute('position', self.el.parentNode.object3D.worldToLocal(world_position));
                    self.el.object3D.position.setFromMatrixPosition(hitMatrix);
                    //console.log('reticle position: ', self.el.object3D.position);
                    //console.log('camera position', camera.position);
                    //console.log('camera projectionMatrix', camera.projectionMatrix);
                    //console.log('camera matrix', camera.matrix);

                    let targetPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
                    targetPos = self.el.parentNode.object3D.worldToLocal(targetPos);
                    let angle = Math.atan2(targetPos.x - self.el.object3D.position.x, targetPos.z - self.el.object3D.position.z);
                    self.el.object3D.rotation.set(0, angle, 0);


                    if (!self.el.is('stabilized')) {
                        self.el.object3D.visible = true;
                        self.el.addState('stabilized');
                        self.el.sceneEl.querySelector('#stabilization').classList.add('a-hidden');
                    }
                }
            });
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
        }
    });
})();
