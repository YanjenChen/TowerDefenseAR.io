(() => {
    var sceneEl = document.querySelector('a-scene');
    jQuery.getJSON('renderer/maps/demo.json', (map) => {
        /* CURVE LOADER */
        map.enemyPath.forEach((path) => {
            var curveEl = document.createElement('a-curve');
            curveEl.setAttribute('id', path.type + '-path');
            path.points.forEach((point) => {
                var pointEl = document.createElement('a-curve-point');
                pointEl.setAttribute('position', point);
                curveEl.appendChild(pointEl);
            });
            sceneEl.appendChild(curveEl);
        });

        var testTower = document.createElement('a-entity');
        testTower.setAttribute('ply-model', {
            src: 'url(renderer/assets/tower.ply)'
        });
        testTower.setAttribute('position', '-6 1.6 -6');
        testTower.setAttribute('scale', '0.025 0.025 0.025');
        testTower.setAttribute('rotation', '-90 0 0');
        testTower.setAttribute('tower', {});
        sceneEl.appendChild(testTower);

        var testEl = document.createElement('a-entity');
        testEl.setAttribute('wave-spawner', {});
        sceneEl.appendChild(testEl);
    });
})();