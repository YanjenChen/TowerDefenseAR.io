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
                    case 'request_upgrade_tower':
                        detail.event_name = 'do_tower_upgrade';
                        break;
                    case 'request_remove_tower':
                        detail.event_name = 'do_tower_remove';
                        break;
                    case 'tower_request_update_target':
                        detail.event_name = 'tower_execute_update_target';
                        break;
                    case 'tower_be_attacked':
                        detail.event_name = 'tower_get_damaged';
                        break;
                    case 'wave_spawner_request_spawn_enemy':
                        detail.event_name = 'wave_spawner_create_enemy';
                        detail.healthPoint = Math.ceil(detail.time / 60000) * 100;
                        detail.enemy_id = this.enemyCounter;
                        detail.reward = Math.ceil(detail.time / 60000) * 5;
                        detail.targetCastle = detail.ws_faction == 'RED' ? '#BLACK-castle' : '#RED-castle';
                        this.enemyCounter++;
                        break;
                    case 'spawner_request_set_autospawn':
                        detail.event_name = 'spawner_execute_set_autospawn';
                        break;
                    case 'spawner_request_remove_autospawn':
                        detail.event_name = 'spawner_execute_remove_autospawn';
                        break;
                    case 'spawner_request_addto_spawnbuffer':
                        detail.event_name = 'spawner_execute_addto_spawnbuffer';
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
