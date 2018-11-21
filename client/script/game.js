/*** DEPEDENCY: Need to execute network.js first. ***/
(() => {
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
			switch (this.data.mode) {
				case 'single-player':
					this.ENEMY_COUNTER = -1;

					this.el.addEventListener('loaded', this.onAssetsLoaded.bind(this));
					this.el.addEventListener('start_game', this.onStartGame.bind(this));
					//console.warn("AFRAME Init");

					this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
					this.el.addEventListener('executeRequest', this.onExecute.bind(this)); // Listen server broadcast.
					break;
				case 'multi-player':
					this.socket = SOCKET;
					this.room_id = jQuery("#room_id").val();
					this.user = jQuery("#user").val();
					this.user_faction = jQuery("#user_faction").val() == '1' ? 'A' : 'B';
					//console.log("game.js initialized. ROOM_ID: " + ROOM_ID + ", USER: " + USER);

					this.el.addEventListener('loaded', this.onAssetsLoaded.bind(this));
					this.socket.on('client_start_game', this.onStartGame.bind(this));
					//console.warn("AFRAME Init");

					this.el.addEventListener('broadcast', this.onBroadcast.bind(this)); // Listen local event.
					this.socket.on('playingEvent', this.onExecute.bind(this)); // Listen server broadcast.
					break;
				default:
					console.warn('GAME MODE ERROR.');
			}

			this.sceneEntity = this.data.ar ? document.querySelector('#ar-mode-sceneEntity') : document.querySelector('a-scene');
		},
		onAssetsLoaded: function() {
			//console.warn('Assets successful loaded.');
			switch (this.data.mode) {
				case 'single-player':
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
			//console.warn('Client start game.')
			jQuery.getJSON('./renderer/maps/demo.json', (map) => {
				/* SCENE LOADER */
				map.factions.forEach(faction => {
					// load enemy path.
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

						this.sceneEntity.appendChild(curveEl);
					});

					// load tower bases.
					faction.towerBases.forEach(base => {
						baseEl = document.createElement('a-entity');
						baseEl.setAttribute('geometry', map.settings.towerBase.geometry);
						baseEl.setAttribute('material', map.settings.towerBase.material);
						baseEl.setAttribute('position', base.position);
						baseEl.setAttribute('tower-base', { faction: faction.name });
						this.sceneEntity.appendChild(baseEl);
					});

					// load wave spawner.
					waveSpawnerEl = document.createElement('a-entity');
					waveSpawnerEl.setAttribute('wave-spawner', faction.waveSpawner.schema);
					waveSpawnerEl.setAttribute('position', faction.waveSpawner.position);
					this.sceneEntity.appendChild(waveSpawnerEl);
				});

				// load tower template to mixin.
				defaultTowerMixIn = document.createElement('a-mixin');
				defaultTowerMixIn.setAttribute('geometry', map.settings.towers.default.geometry);
				console.log(map.settings.towers.default.model);
				defaultTowerMixIn.setAttribute('id', 'tower-default-mixin');
				this.el.sceneEl.querySelector('a-assets').appendChild(defaultTowerMixIn);
			});
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
					if (document.querySelector('#' + content['id']) != null)
						document.querySelector('#' + content['id']).emit('spawn_enemy', {
							id: content['enemy_id'],
							faction: content['ws_faction'],
							healthPoint: 6,
							speed: 4
						});
					break;
			}
		}
	});
})();
