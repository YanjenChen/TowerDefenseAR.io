(() => {
	const PARTICLE_NUM = 100;
	const PARTICLE_SPEED = 0.02;
	var DIRS = [];
	for (i = 0; i < PARTICLE_NUM; i++) {
		DIRS.push({
			x: (Math.random() * PARTICLE_SPEED) - (PARTICLE_SPEED / 2),
			y: (Math.random() * PARTICLE_SPEED) - (PARTICLE_SPEED / 2),
			z: (Math.random() * PARTICLE_SPEED) - (PARTICLE_SPEED / 2)
		});
	}

	AFRAME.registerComponent('explosion', {
		schema: {
			animationTime: {
				type: 'number',
				default: 2000
			}
		},
		init: function() {
			this.timeCounter = 0;

			let geometry = new THREE.Geometry();
			for (i = 0; i < PARTICLE_NUM; i++) {
				//let vertex = this.el.object3D.position.clone();
				let vertex = new THREE.Vector3();
				geometry.vertices.push(vertex);
			}
			let material = new THREE.PointsMaterial({
				size: 0.1,
				color: 0x8b0000,
				transparent: true,
				opacity: 0.7
			});

			this.particles = new THREE.Points(geometry, material);

			this.el.setObject3D('particles', this.particles);
		},
		tick: function(time, timeDelta) {
			this.timeCounter += timeDelta;

			for (i = 0; i < PARTICLE_NUM; i++) {
				let particle = this.particles.geometry.vertices[i];
				particle.y += DIRS[i].y;
				particle.x += DIRS[i].x;
				particle.z += DIRS[i].z;
			}
			this.particles.geometry.verticesNeedUpdate = true;

			if (this.timeCounter >= this.data.animationTime)
				this.el.parentNode.removeChild(this.el);
		},
		remove: function() {
			this.el.removeObject3D('particles', this.particles);

			delete this.timeCounter;
			delete this.particles;
		}
	});
})();
