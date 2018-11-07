(() => {
    var sceneEl = document.querySelector('a-scene');
    jQuery.getJSON('renderer/maps/demo.json', (map) => {
        /* CURVE LOADER */
        map.factions.forEach(faction => {
            faction.enemyPath.forEach(path => {
                var curveEl = document.createElement('a-entity');
                curveEl.setAttribute('path', {});
                curveEl.setAttribute('id', faction.name + 'faction' + path.type + 'path');
                path.points.forEach((point) => {
                    var pointEl = document.createElement('a-entity');
                    pointEl.setAttribute('path-point', {});
                    pointEl.setAttribute('position', point);
                    curveEl.appendChild(pointEl);
                });

                // ONLY USE IN DEVELOPER TESTING
                curveEl.setAttribute('draw-path', {
                    path: '#' + faction.name + 'faction' + path.type + 'path'
                });
                ////////////////////////////////

                sceneEl.appendChild(curveEl);
            });
        });

        /*
        var testCastle = document.createElement('a-entity');
        testCastle.setAttribute('ply-model', {
            src: 'url(renderer/assets/tower.ply)'
        });
        testCastle.setAttribute('position', '-6 1.6 -6');
        testCastle.setAttribute('scale', '0.025 0.025 0.025');
        testCastle.setAttribute('rotation', '-90 0 0');
        sceneEl.appendChild(testCastle);
		*/

        var testTower1 = document.createElement('a-entity');
        testTower1.setAttribute('geometry', {
            primitive: 'box',
            width: 0.5,
            height: 0.5,
            depth: 2
        });
        testTower1.setAttribute('position', '-3 0 0');
        testTower1.setAttribute('tower', {
            dps: 10,
            faction: 'B',
            range: 10
        });
        sceneEl.appendChild(testTower1);

        var testTower2 = document.createElement('a-entity');
        testTower2.setAttribute('geometry', {
            primitive: 'box',
            width: 0.5,
            height: 0.5,
            depth: 2
        });
        testTower2.setAttribute('position', '9 0 0');
        testTower2.setAttribute('tower', {
            dps: 20,
            faction: 'A',
            range: 5
        });
        sceneEl.appendChild(testTower2);

        var testWavespawner1 = document.createElement('a-entity');
        testWavespawner1.setAttribute('wave-spawner', {
            amount: 5,
            duration: 5000,
            faction: 'A',
            timeOffSet: 300
        });
        sceneEl.appendChild(testWavespawner1);

        var testWavespawner2 = document.createElement('a-entity');
        testWavespawner2.setAttribute('wave-spawner', {
            amount: 5,
            duration: 6000,
            faction: 'B',
            timeOffSet: 300
        });
        sceneEl.appendChild(testWavespawner2);

    });
})();