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
			this.gameManager = new GameManager(this.el, CONFIG_DIR, 'ar');
			this.gameLoader.loadMap(null, function() {
				self.assetsEl = document.querySelector('a-assets');
				self.map = self.gameLoader.getMap();
				self.settings = self.gameLoader.getSettings();

				switch (self.data.mode) {
					case 'single-player':
						self.ENEMY_COUNTER = 0;

						if (self.data.ar) {
							self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
							self.el.addEventListener('placed_target_to_ar', self.onStabilized.bind(self));
						} else {
							self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
							self.el.addEventListener('gameloadscene', self.onStabilized.bind(self));
						}
						self.el.addEventListener('start_game', self.onStartGame.bind(self));
						//console.warn("AFRAME Init");

						self.el.addEventListener('broadcast', self.onBroadcast.bind(self)); // Listen local event.
						self.el.addEventListener('executeRequest', self.onExecute.bind(self)); // Listen server broadcast.
						break;
					case 'multi-player':
						self.socket = SOCKET;
						self.room_id = jQuery("#room_id").val();
						self.user = jQuery("#user").val();
						self.user_faction = jQuery("#user_faction").val() == '1' ? 'A' : 'B';
						//console.log("game.js initialized. ROOM_ID: " + ROOM_ID + ", USER: " + USER);

						self.assetsEl.addEventListener('loaded', self.onAssetsLoaded.bind(self));
						self.el.addEventListener('gameloadscene', self.onStabilized.bind(self));
						self.socket.on('client_start_game', self.onStartGame.bind(self));
						//console.warn("AFRAME Init");

						self.el.addEventListener('broadcast', self.onBroadcast.bind(self)); // Listen local event.
						self.socket.on('playingEvent', self.onExecute.bind(self)); // Listen server broadcast.
						break;
					default:
						console.warn('GAME MODE ERROR.');
				}
			});
		},
		onAssetsLoaded: function() {
			this.gameLoader.loadScene();
		},
		onStabilized: function() {
			//console.warn('Assets successful loaded.');
			this.sceneEntity = document.querySelector('#tdar-dynamic-scene');
			switch (this.data.mode) {
				case 'single-player':
					if (!this.el.is('tdar-game-running'))
						this.el.emit('start_game');
					break;
				case 'multi-player':
					this.socket.emit("nonPlayingEvent", {
						room_id: this.room_id,
						event_name: 'model_ready',
						user: this.user
					});
					break;
				default:
					console.warn('GAME MODE ERROR.');
			}
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

			this.gameLoader.getDynamicScene().play();
		},
		onBroadcast: function(evt) {
			switch (this.data.mode) {
				case 'single-player':
					// Client simulate multi player server behavior.
					var content = evt.detail;

					switch (evt.detail.event_name) {
						case 'enemy_be_attacked':
							content.event_name = 'enemy_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'castle_be_attacked':
							content.event_name = 'castle_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'request_create_tower':
							content.event_name = 'create_tower_success';
							this.el.emit('executeRequest', content);
							break;
						case 'tower_be_attacked':
							content.event_name = 'tower_get_damaged';
							this.el.emit('executeRequest', content);
							break;
						case 'wave_spawner_request_spawn_enemy':
							content.event_name = 'wave_spawner_create_enemy';
							content.enemy_id = 'enemy-' + this.ENEMY_COUNTER.toString();
							this.ENEMY_COUNTER++;
							this.el.emit('executeRequest', content);
							break;
					}
					break;
				case 'multi-player':
					var content = evt.detail;
					content.room_id = this.room_id;
					content.user = this.user;
					this.socket.emit('playingEvent', content);
					//console.warn('Emit event to server, name: ' + content['event_name']);
					break;
				default:
					console.warn('GAME MODE ERROR.');
			}
		},
		onExecute: function(content) {
			if (this.data.mode == 'single-player')
				content = content.detail;
			//console.warn('Receive event from server, name: ' + content['event_name']);

			switch (content['event_name']) {
				case 'enemy_get_damaged':
					if (document.querySelector('#' + content['id']) != null)
						document.querySelector('#' + content['id']).emit('be-attacked', {
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
					if (document.querySelector('#' + content['id']) != null) {
						//console.log(content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle');

						document.querySelector('#' + content['id']).emit('spawn_enemy', {
							id: content['enemy_id'],
							faction: content['ws_faction'],
							healthPoint: 600,
							speed: 0.03,
							targetCastle: content['ws_faction'] == 'A' ? '#faction-B-castle' : '#faction-A-castle'
						});
					}
					break;
			}
		}
	});
})();
