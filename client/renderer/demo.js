(() => {
	var sceneEl = document.querySelector('a-scene');
	//var sceneEl = document.querySelector('#scene');

	jQuery.getJSON('renderer/maps/demo.json', (map) => {
		/* CURVE LOADER */
		map.enemyPath.forEach((path) => {
			var curveEl = document.createElement('a-entity');
			curveEl.setAttribute('curve', {
				type: 'Line'
			});
			curveEl.setAttribute('id', path.type + '-path');
			path.points.forEach((point) => {
				var pointEl = document.createElement('a-curve-point');
				pointEl.setAttribute('position', point);
				curveEl.appendChild(pointEl);
			});
			sceneEl.appendChild(curveEl);
		});

		var testCastle = document.createElement('a-entity');
		testCastle.setAttribute('ply-model', {
			src: 'url(renderer/assets/tower.ply)'
		});
		testCastle.setAttribute('position', '-6 1.6 -6');
		testCastle.setAttribute('scale', '0.025 0.025 0.025');
		testCastle.setAttribute('rotation', '-90 0 0');
		sceneEl.appendChild(testCastle);

		var testTower1 = document.createElement('a-entity');
		testTower1.setAttribute('geometry', {
			primitive: 'box',
			depth: 2
		});
		testTower1.setAttribute('position', '-3 0 0');
		testTower1.setAttribute('tower', {
			range: 10
		});
		sceneEl.appendChild(testTower1);

		var testTower2 = document.createElement('a-entity');
		testTower2.setAttribute('geometry', {
			primitive: 'box',
			depth: 2
		});
		testTower2.setAttribute('position', '3 0 -7');
		testTower2.setAttribute('tower', {
			range: 5
		});
		sceneEl.appendChild(testTower2);

		var testEl = document.createElement('a-entity');
		testEl.setAttribute('wave-spawner', {});
		sceneEl.appendChild(testEl);
	});
})();
