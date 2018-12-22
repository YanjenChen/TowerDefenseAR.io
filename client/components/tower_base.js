(() => {
    const PROCESS_TIME = 1000;

    AFRAME.registerComponent('tower-base', {
        schema: {
            // Notice: Tower base do not own by faction.
        },
        init: function() {
            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
            this.cashManager = this.el.sceneEl.systems['tdar-game'].cashManager;


            this.el.addState('empty');


            this.requestTower = this.requestTower.bind(this);
            this.requestLaser = this.requestLaser.bind(this);
            this.requestMissile = this.requestMissile.bind(this);
            this.createTower = this.createTower.bind(this);
            this.requestUpgrade = this.requestUpgrade.bind(this);
            this.upgradeTower = this.upgradeTower.bind(this);
            this.requestRemove = this.requestRemove.bind(this);
            this.removeTower = this.removeTower.bind(this);
            this.getUIsets = this.getUIsets.bind(this);


            this.timeCounter = 0;


            this.el.addEventListener('create-tower', this.createTower);
            this.el.addEventListener('upgrade-tower', this.upgradeTower);
            this.el.addEventListener('remove-tower', this.removeTower);
        },
        tick: function(time, timeDelta) {
            if (this.el.is('processing')) {
                this.timeCounter += timeDelta;
                if (this.timeCounter >= PROCESS_TIME) {
                    this.el.removeState('processing');
                    this.timeCounter = 0;
                }
            }
        },
        remove: function() {
            delete this.gameManager;
            delete this.networkManager;
            delete this.cashManager;

            delete this.timeCounter;

            this.el.removeEventListener('create-tower', this.createTower);
            this.el.removeEventListener('upgrade-tower', this.upgradeTower);
            this.el.removeEventListener('remove-tower', this.removeTower);
        },
        requestTower: function(type) {
            if (!(type == 'laser' || type == 'missile')) {
                console.warn('Request tower receive unknown type: ', type);
                return;
            }
            if (!this.el.id) {
                console.warn('Towerbase does not have id.');
                return;
            }

            this.networkManager.emit('playingEvent', {
                event_name: 'request_create_tower',
                id: this.el.id,
                faction: this.el.sceneEl.systems['tdar-game'].data.userFaction,
                type: type
            });
        },
        requestLaser: function() {
            this.requestTower('laser');
        },
        requestMissile: function() {
            this.requestTower('missile');
        },
        createTower: function(evt) {
            this.el.setAttribute('tower', {
                faction: evt.detail.faction,
                type: evt.detail.type,
                tier: 0
            });
            this.el.removeState('empty');
            this.el.addState('processing');

            this.gameManager.updateGameGridByModel(
                this.el.object3D.position,
                this.gameManager.settings.tower.common.mesh,
                false
            );

            this.el.sceneEl.emit('systemupdatepath', {
                faction: evt.detail.faction
            });
        },
        requestUpgrade: function() {
            if (!this.el.id) {
                console.warn('Towerbase does not have id.');
                return;
            }

            this.networkManager.emit('playingEvent', {
                event_name: 'request_upgrade_tower',
                id: this.el.id
            });
        },
        upgradeTower: function() {
            this.el.addState('processing');
            this.el.components['tower'].upgradeTier();
        },
        requestRemove: function() {
            if (!this.el.id) {
                console.warn('Towerbase does not have id.');
                return;
            }

            this.networkManager.emit('playingEvent', {
                event_name: 'request_remove_tower',
                faction: this.el.sceneEl.systems['tdar-game'].data.userFaction,
                id: this.el.id
            });
        },
        removeTower: function(evt) {
            this.el.removeAttribute('tower');
            this.el.addState('empty');
            this.el.addState('processing');


            let info = this.gameManager.object3DPrototypes[this.gameManager.settings.tower.common.mesh];
            let min = {
                x: this.el.object3D.position.x - (info.width / 2),
                y: 0,
                z: this.el.object3D.position.z - (info.depth / 2)
            };
            let max = {
                x: this.el.object3D.position.x + (info.width / 2),
                y: 0,
                z: this.el.object3D.position.z + (info.depth / 2)
            };
            this.gameManager.updateGameGridArea(min, max, true);


            this.el.sceneEl.emit('systemupdatepath', {
                faction: evt.detail.faction
            });
        },
        getUIsets: function() {
            if (this.el.is('processing'))
                return [];

            let uisets;
            if (this.el.is('empty')) {
                uisets = [{
                    callback: this.requestLaser,
                    icon: 'beam',
                    header: 'Beam'
                }, {
                    callback: this.requestMissile,
                    icon: 'rocket',
                    header: 'Missile'
                }];
            } else if (this.el.components['tower'].isMaxTier()) {
                uisets = [{
                    callback: this.requestRemove,
                    icon: 'demolish',
                    header: 'Remove'
                }];
            } else {
                uisets = [{
                    callback: this.requestRemove,
                    icon: 'demolish',
                    header: 'Remove'
                }, {
                    callback: this.requestUpgrade,
                    icon: 'upgrade',
                    header: 'Upgrade'
                }];
            }
            return uisets;
        }
    });
})();
