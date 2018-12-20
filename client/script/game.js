/*
 * DEPEDENCY:
 *	aframe.js
 *	pathfinding-browser.js
 *	socket.js
 *	network.js.
 *	gameManager.js
 */
(() => {
	const CONFIG_DIR = './renderer/maps/demo.json';

	AFRAME.registerSystem('tdar-game', {
		schema: {
			mode: {
				type: 'string',
				default: 'multi-player',
				oneOf: ['single-player', 'multi-player']
			},
			ar: {
				type: 'boolean',
				default: false,
			}
		},
		init: function() {
			let self = this;
			let gameManager = this.gameManager = new GameManager(this.el, CONFIG_DIR, this.data.ar ? 'ar': 'vr');
			let networkManager = this.networkManager = new NetworkManager(this.el, this.data.mode);
			let uiManager = this.uiManager = new UIManager(this.el);

			networkManager.addEventListener('client_start_game', this.onStartGame.bind(this));
			networkManager.addEventListener('playingEvent', this.onExecute.bind(this));
			gameManager.loadConfig();
		},
		onStartGame: function() {
			//console.warn('Client start game.');

			// Insert cursor under camera.
			let cursor = document.createElement('a-entity');
			cursor.setAttribute('cursor', {
				fuse: false
			});
			cursor.setAttribute('position', '0 0 -0.1');
			cursor.setAttribute('geometry', 'primitive: ring; radiusInner: 0.002; radiusOuter: 0.003');
			cursor.setAttribute('material', 'color: black; shader: flat');
			cursor.setAttribute('raycaster', 'objects: [data-raycastable]');
			document.querySelector('[camera]').appendChild(cursor);

			this.gameManager.dynamicScene.play();
		},
		onExecute: function(content) {
			//console.warn('Receive event from server, name: ' + content['event_name']);

			switch (content['event_name']) {
				case 'enemy_get_damaged':
					if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null)
						this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('be-attacked', {
							damage: content['damage']
						});
					break;
				case 'castle_get_damaged':

					break;
				case 'create_tower_success':

					break;
				case 'tower_get_damaged':

					break;
				case 'wave_spawner_create_enemy':
					if (this.gameManager.dynamicScene.querySelector('#' + content['id']) != null) {
						//console.log(content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle');

						this.gameManager.dynamicScene.querySelector('#' + content['id']).emit('spawn_enemy', {
							id: content['enemy_id'],
							faction: content['ws_faction'],
							healthPoint: 600,
							speed: 8,
							targetCastle: content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle'
						});
					}
					break;
			}
		}
	});
})();
