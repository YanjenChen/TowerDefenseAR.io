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
			//this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
			//this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
			//this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

			let geometry = new THREE.Geometry();
			let material = new THREE.LineBasicMaterial({ color: 0x546269 });
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
			material = new THREE.MeshBasicMaterial({ color: 0x5c6b73 });
			this.el.setObject3D('plane', new THREE.Mesh(geometry, material));

			geometry = new THREE.PlaneGeometry(HOVER_REGION, HOVER_REGION);
			geometry.rotateX(-Math.PI / 2);
			material = new THREE.MeshBasicMaterial({ color: 0x6a787f });
			let reticle = this.reticle = new THREE.Mesh(geometry, material);
			reticle.position.setY(0.005);
			reticle.visible = false;
			this.el.setObject3D('reticle', reticle);

			this.el.addEventListener('raycaster-intersected', this.onRaycasterIntersected.bind(this));

			this.getIntersection = null;
			this.prevCheckTime = 0;
		},
		tick: function(time, timeDelta) {
			if (this.el.is('cursor-hovered') && time - this.prevCheckTime > this.data.interval) {
				if (!this.getIntersection)
					return;

				let p = this.getIntersection(this.el).point.clone();
				this.el.object3D.worldToLocal(p);
				this.reticle.position.setX(Math.floor(p.x + 0.5));
                this.reticle.position.setZ(Math.floor(p.z + 0.5));
                this.reticle.visible = true;

				this.prevCheckTime = time;
			}
		},
		onRaycasterIntersected: function(evt) {
			this.getIntersection = evt.detail.getIntersection;
		}
	});
})();
