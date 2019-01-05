(() => {

    'use strict';

    const HOVER_REGION = 2;

    const COMPONENT_NAME = 'grid';
    const COMPONENT_PREFIX = 'grid-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';

    AFRAME.registerSystem(COMPONENT_NAME, {

        init: function() {

            let self = this;

            this.el.addEventListener('gamemodelloaded', function _init() {

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        },
        getGrid: function(component) {
            /**
             *  @param {unit-component} component
             */

            let geometry = new THREE.Geometry();
            let material = new THREE.LineBasicMaterial({
                color: 0x546269
            });

            for (let i = -component.data.width / 2; i <= component.data.width / 2; i += 1) {

                geometry.vertices.push(new THREE.Vector3(i, 0.01, -component.data.depth / 2));
                geometry.vertices.push(new THREE.Vector3(i, 0.01, component.data.depth / 2));

            }
            for (let i = -component.data.depth / 2; i <= component.data.depth / 2; i += 1) {

                geometry.vertices.push(new THREE.Vector3(-component.data.width / 2, 0.01, i));
                geometry.vertices.push(new THREE.Vector3(component.data.width / 2, 0.01, i));

            }
            return new THREE.LineSegments(geometry, material);

        },
        getPlane: function(component) {
            /**
             *  @param {unit-component} component
             */

            let geometry = new THREE.PlaneGeometry(component.data.width, component.data.depth);
            let material = new THREE.MeshBasicMaterial({
                color: 0x5c6b73
            });

            geometry.rotateX(-Math.PI / 2);
            return new THREE.Mesh(geometry, material);

        },
        getReticle: function(component) {
            /**
             *  @param {unit-component} component
             */

            let geometry = new THREE.PlaneGeometry(HOVER_REGION, HOVER_REGION);
            let material = new THREE.MeshBasicMaterial({
                color: 0x6a787f
            });

            geometry.rotateX(-Math.PI / 2);

            let reticle = new THREE.Mesh(geometry, material);

            reticle.position.setY(0.005);
            reticle.visible = false;

            return reticle;

        }

    });

    AFRAME.registerComponent(COMPONENT_NAME, {

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

            this.el.setObject3D('grid', this.system.getGrid(this));
            this.el.setObject3D('plane', this.system.getPlane(this));
            this.el.setObject3D('reticle', this.system.getReticle(this));

            this.onRaycasterIntersected = this.onRaycasterIntersected.bind(this);
            this.updateUI = this.updateUI.bind(this);
            this.onEndProcess = this.onEndProcess.bind(this);

            this.reticle = this.el.getObject3D('reticle');
            this.getIntersection = null;
            this.prevCheckTime = 0;
            this.prevCoord = {
                x: null,
                y: null,
                z: null
            };
            this.intersectedPoint = new THREE.Vector3();
            this.hoveringBase = null;

            this.el.addEventListener('raycaster-intersected', this.onRaycasterIntersected);

        },
        // WARNING: Using async function to modify aframe API is an UNSTABLE trick.
        tick: async function(time, timeDelta) {

            if (time - this.prevCheckTime > this.data.interval) {

                // console.log(this.el.is('cursor-hovered'));
                if (this.el.is('cursor-hovered')) {

                    if (!this.getIntersection) {

                        return true;

                    }

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
        updateUI: async function() {

            let x = Math.floor(this.intersectedPoint.x + 0.5 + (this.data.width / 2));
            let z = Math.floor(this.intersectedPoint.z + 0.5 + (this.data.depth / 2));
            let selectedBase = this.hoveringBase = this.system.gameManager.interactiveComponents[x][z];

            if (selectedBase === undefined) {

                console.warn('TowerBases have undefined element or access wrong idex: ', x, z);

            }

            let placeable = await this.system.gameManager.areaIsPlaceable(this.reticle.position, HOVER_REGION, HOVER_REGION);

            if (placeable) {

                this.reticle.material.color.set(0x6a787f);
                this.reticle.material.needsUpdate = true;

            } else {

                this.reticle.material.color.set(0x83787F);
                this.reticle.material.needsUpdate = true;

            }

            if (selectedBase === null || selectedBase.getUIsets === undefined) {

                this.system.uiManager.updateObjectControl([]);

            } else if (!placeable && selectedBase.isTowerBase === true && selectedBase.el.is('empty')) {

                this.system.uiManager.updateObjectControl([]);

            } else {

                this.system.uiManager.updateObjectControl(selectedBase.getUIsets());

            }

        },
        onEndProcess: function(base) {

            if (base === this.hoveringBase) {

                // this.updateUI();
                this.system.uiManager.updateObjectControl(base.getUIsets());

            }

        }

    });

})();
