$(document).ready(function() {
	$.getJSON('/map.json', function(map) {
		var enviroment = document.querySelector('#enviroment');
		for (i = 0; i < map.rangeX; i++) {
			for (j = 0; j < map.rangeZ; j++) {
				if (map.map[i][j] == 0) {
					continue;
				}

				var entity = document.createElement('a-gltf-model');
				entity.setAttribute('src', '#' + map.componenets[map.map[i][j]].tag);
				entity.setAttribute('position', getRenderCoordnate(map, [i + 0.5, j + 0.5]));
				entity.setAttribute('scale', '1 1 1');
				enviroment.appendChild(entity);

				/*
				$('#enviroment').add('a-gltf-model').attr({
					src: '#' + map.componenets[map.map[i][j]].tag,
					position: getRenderCoordnate(map, [i, j]),
					scale: '1 1 1'
				});
				*/
			}
		}
	});
});

function getRenderCoordnate(map, coord) {
	// shift map coordinate to enviroment coordinate
	return (coord[0] - map.rangeX / 2).toString() + ' 0 ' + (coord[1] - map.rangeZ / 2).toString();
};
