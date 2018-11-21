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

        //Rendering castle1
        /*var castle1 = document.createElement('a-entity');
        castle1.setAttribute('geometry',{
          primitive: 'box',
          width:0.5,
          height:0.5,
          depth: 3

        });
        castle1.setAttribute('position', '7 0 7');
        castle1.setAttribute('castle', {
          faction:'castleA'
          healthPoint: 3
        });
        sceneEl.appendChild(castle1);*/

        //Rendering castle2
        var castle2 = document.createElement('a-entity');
        castle2.setAttribute('geometry',{
          primitive: 'box',
          width:0.5,
          height:3,
          depth: 0.5

        });
        castle2.setAttribute('position', '-7 0 -7');
        castle2.setAttribute('castle', {
          faction:'B',
          healthPoint: 6
        });
        castle2.setAttribute('id', 'CastleB');
        sceneEl.appendChild(castle2);

        //Rendering Defence Tower
        /*var testTower1 = document.createElement('a-entity');
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
        sceneEl.appendChild(testTower1);*/

      /* var testTower2 = document.createElement('a-entity');
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
        sceneEl.appendChild(testTower2);*/

        var testWavespawner1 = document.createElement('a-entity');
        testWavespawner1.setAttribute('wave-spawner', {
            amount: 6,
            duration: 5000,
            faction: 'A',
            timeOffSet: 300
        });
        sceneEl.appendChild(testWavespawner1);

      /* var testWavespawner2 = document.createElement('a-entity');
        testWavespawner2.setAttribute('wave-spawner', {
            amount: 1,
            duration: 6000,
            faction: 'B',
            timeOffSet: 300
        });
        sceneEl.appendChild(testWavespawner2);*/

    });
})();
