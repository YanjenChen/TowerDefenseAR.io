class ServerSimulator {
	constructor(sceneEl) {
		/*
		 * FUNCTION API SPEC
		 *  sceneEl: DOM node point to <a-scene> element.
		 *
		 * CLASS PROPERTY
		 *  enemyCounter: enemy counter for enemy id creation.
		 *  sceneEl: DOM node point to <a-scene> element.
		 */

		this.enemyCounter = 0;
		this.sceneEl = sceneEl;
	}
	emit(evtName, detail) {
		switch (evtName) {
			case 'nonPlayingEvent':
				switch (detail.event_name) {
					case 'model_ready':
						this.sceneEl.emit('client_start_game');
						break;
					default:
						console.warn('Server simulator receved unexpected detail.event_name: ', detail.event_name);
				}
				break;
			case 'playingEvent':
				switch (detail.event_name) {
					case 'enemy_be_attacked':
						detail.event_name = 'enemy_get_damaged';
						break;
					case 'castle_be_attacked':
						detail.event_name = 'castle_get_damaged';
						break;
					case 'request_create_tower':
						detail.event_name = 'create_tower_success';
						break;
					case 'tower_be_attacked':
						detail.event_name = 'tower_get_damaged';
						break;
					case 'wave_spawner_request_spawn_enemy':
						detail.event_name = 'wave_spawner_create_enemy';
						detail.enemy_id = 'enemy-' + this.enemyCounter.toString();
						this.enemyCounter++;
						break;
					case 'request_update_cash':
						detail.event_name = 'execute_update_cash';
						break
					default:
						console.warn('Server simulator receved unexpected detail.event_name: ', detail.event_name);
				}
				this.sceneEl.emit('playingEvent', detail);
				break;
			default:
				console.warn('Server simulator receved unexpected evtName: ', evtName);
		}
	}
}
