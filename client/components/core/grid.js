(() => {
    const HOVER_REGION = 2;

    AFRAME.registerComponent('grid', {
        schema: {
            width: {
                type: 'number',
                default: 20
            },
            depth: {
                type: 'number',
                default: 20
            },
            interval: {
                type: 'number',
                default: 100
            }
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

            let geometry = new THREE.Geometry();
            let material = new THREE.LineBasicMaterial({
                color: 0x546269
            });
            for (let i = -this.data.width / 2; i <= this.data.width / 2; i += 1) {
                geometry.vertices.push(new THREE.Vector3(i, 0.01, -this.data.depth / 2));
                geometry.vertices.push(new THREE.Vector3(i, 0.01, this.data.depth / 2));
            }
            for (let i = -this.data.depth / 2; i <= this.data.depth / 2; i += 1) {
                geometry.vertices.push(new THREE.Vector3(-this.data.width / 2, 0.01, i));
                geometry.vertices.push(new THREE.Vector3(this.data.width / 2, 0.01, i));
            }
            this.el.setObject3D('grid', new THREE.LineSegments(geometry, material));

            geometry = new THREE.PlaneGeometry(this.data.width, this.data.depth);
            geometry.rotateX(-Math.PI / 2);
            material = new THREE.MeshBasicMaterial({
                color: 0x5c6b73
            });
            this.el.setObject3D('plane', new THREE.Mesh(geometry, material));

            geometry = new THREE.PlaneGeometry(HOVER_REGION, HOVER_REGION);
            geometry.rotateX(-Math.PI / 2);
            material = new THREE.MeshBasicMaterial({
                color: 0x6a787f
            });
            let reticle = this.reticle = new THREE.Mesh(geometry, material);
            reticle.position.setY(0.005);
            reticle.visible = false;
            this.el.setObject3D('reticle', reticle);

            this.onRaycasterIntersected = this.onRaycasterIntersected.bind(this);
            this.el.addEventListener('raycaster-intersected', this.onRaycasterIntersected);

            this.getIntersection = null;
            this.prevCheckTime = 0;
            this.prevCoord = {
                x: null,
                y: null,
                z: null
            };
            this.intersectedPoint = new THREE.Vector3();

            this.hoveringBase = null;

            this.updateUI = this.updateUI.bind(this);
            this.onTowerEndProcess = this.onTowerEndProcess.bind(this);
        },
        tick: function(time, timeDelta) {
            if (time - this.prevCheckTime > this.data.interval) {
                // console.log(this.el.is('cursor-hovered'));
                if (this.el.is('cursor-hovered')) {
                    if (!this.getIntersection)
                        return;


                    this.intersectedPoint.copy(this.getIntersection(this.el).point);
                    this.el.object3D.worldToLocal(this.intersectedPoint);

                    let x = Math.floor(this.intersectedPoint.x + 0.5);
                    let z = Math.floor(this.intersectedPoint.z + 0.5);

                    if (!(x <= -this.data.width / 2 || x >= this.data.width / 2 || z <= -this.data.depth / 2 || z >= this.data.depth / 2)) {
                        this.reticle.position.setX(x);
                        this.reticle.position.setZ(z);
                        this.reticle.visible = true;

                        if (!(this.prevCoord.x == x && this.prevCoord.z == z)) {
                            this.prevCoord.x = x;
                            this.prevCoord.z = z;
                            this.updateUI();
                        }

                        if (this.gameManager.areaIsPlaceable(this.reticle.position, HOVER_REGION, HOVER_REGION, true)) {
                            this.reticle.material.color.set(0x6a787f);
                            this.reticle.material.needsUpdate = true;
                        } else {
                            this.reticle.material.color.set(0x83787F);
                            this.reticle.material.needsUpdate = true;
                        }
                    } else {
                        this.reticle.visible = false;
                    }
                } else {
                    this.reticle.visible = false;
                }
                this.prevCheckTime = time;
            }
        },
        remove: function() {
            this.el.removeObject3D('grid');
            this.el.removeObject3D('plane');
            this.el.removeObject3D('reticle');

            delete this.gameManager;
            delete this.uiManager;

            delete this.reticle;
            delete this.getIntersection;
            delete this.prevCheckTime;
            delete this.prevCoord;
            delete this.intersectedPoint;
            delete this.hoveringBase;

            this.el.removeEventListener('raycaster-intersected', this.onRaycasterIntersected);
        },
        onRaycasterIntersected: function(evt) {
            this.getIntersection = evt.detail.getIntersection;
        },
        updateUI: function() {
            let x = Math.floor(this.intersectedPoint.x + 0.5 + (this.data.width / 2));
            let z = Math.floor(this.intersectedPoint.z + 0.5 + (this.data.depth / 2));
            let selectedBase = this.hoveringBase = this.gameManager.towerBases[x][z];
            if (selectedBase === undefined)
                console.warn('TowerBases have undefined element or access wrong idex: ', x, z);
            let placeable = this.gameManager.areaIsPlaceable(this.reticle.position, HOVER_REGION, HOVER_REGION, true);
            let isEmpty = selectedBase.el.is('empty');

            if (placeable) {
                this.uiManager.updateObjectControl(selectedBase.getUIsets());
            } else if (!isEmpty) {
                this.uiManager.updateObjectControl(selectedBase.getUIsets());
            } else {
                this.uiManager.updateObjectControl([]);
            }
        },
        onTowerEndProcess: function(base) {
            if (base === this.hoveringBase)
                this.uiManager.updateObjectControl(base.getUIsets());
        }
    });
})();
