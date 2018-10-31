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

        var testEl = document.createElement('a-entity');
        testEl.setAttribute('wave-spawner', {});
        sceneEl.appendChild(testEl);
    });
})();