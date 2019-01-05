(() => {
    const PROCESS_TIME = 1000;

    AFRAME.registerComponent('tower-base', {
        schema: {
            // Notice: Tower base do not own by faction.
        },
        init: function() {

            this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
            this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
            this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;
            this.cashManager = this.el.sceneEl.systems['tdar-game'].cashManager;


            this.el.addState('empty');


            this.requestTower = this.requestTower.bind(this);
            this.requestLaser = this.requestLaser.bind(this);
            this.requestMissile = this.requestMissile.bind(this);
            this.requestGoldmine=this.requestGoldmine.bind(this);
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
                    this.gameManager.gridEl.components['grid'].onTowerEndProcess(this);
                    this.timeCounter = 0;
                }
            }
        },
        remove: function() {
            delete this.gameManager;
            delete this.networkManager;
            delete this.uiManager;
            delete this.cashManager;

            delete this.timeCounter;

            this.el.removeEventListener('create-tower', this.createTower);
            this.el.removeEventListener('upgrade-tower', this.upgradeTower);
            this.el.removeEventListener('remove-tower', this.removeTower);
        },
        requestTower: function(type) {
            if (!(type == 'laser' || type == 'missile'|| type=='goldmine')) {
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
                type: type,
                amount:this.gameManager.settings.tower[type][0].cost,
                ampamount:this.gameManager.settings.tower[type][0].amplifyAmount
            });

            this.uiManager.updateObjectControl([]);
        },
        requestLaser: function() {
            this.requestTower('laser');
        },
        requestMissile: function() {
            this.requestTower('missile');
        },
        requestGoldmine:function(){
          this.requestTower('goldmine');
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
                id: this.el.id,
                faction:this.el.sceneEl.systems['tdar-game'].data.userFaction,
                amount:this.gameManager.settings.tower[this.el.components['tower'].data.type][0].cost
            });

            this.uiManager.updateObjectControl([]);
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
                id: this.el.id,
                ampamount:this.gameManager.settings.tower[this.el.components['tower'].data.type][0].amplifyAmount,
                amount:this.gameManager.settings.tower[this.el.components['tower'].data.type][0].cost
            });

            this.uiManager.updateObjectControl([]);
        },
        removeTower: function(evt) {
            this.el.removeAttribute('tower');
            this.el.addState('empty');
            this.el.addState('processing');


            this.gameManager.updateGameGridByModel(
                this.el.object3D.position,
                this.gameManager.settings.tower.common.mesh,
                true
            );


            this.el.sceneEl.emit('systemupdatepath', {
                faction: evt.detail.faction
            });
        },
        getUIsets: function() {
            if (this.el.is('processing'))
                return [];

            let currentMoney = this.cashManager.currentMoney[this.el.sceneEl.systems['tdar-game'].data.userFaction];
            let uisets;
            if (this.el.is('empty')) {
              let lasercost= this.gameManager.settings.tower['laser'][0].cost*-1;
              let missilecost= this.gameManager.settings.tower['missile'][0].cost*-1;
              let goldminecost= this.gameManager.settings.tower['goldmine'][0].cost*-1;
                uisets = [{
                    callback: currentMoney >= lasercost ? this.requestLaser : null,
                    icon: 'beam',
                    header: 'Beam',
                    cost:lasercost,
                    disable:currentMoney >= lasercost ? false : true
                }, {
                    callback: currentMoney >= missilecost ? this.requestMissile : null,
                    icon: 'rocket',
                    header: 'Missile',
                    cost:missilecost,
                    disable:currentMoney >= missilecost ? false : true

                }, {
                    callback: currentMoney >= goldminecost ?this.requestGoldmine : null,
                    icon: 'gold',
                    header: 'Goldmine',
                    cost:goldminecost,
                    disable:currentMoney >= goldminecost ? false : true

                }];
            } else if (this.el.components['tower'].isMaxTier()) {
                uisets = [{
                    callback: this.requestRemove,
                    icon: 'demolish',
                    header: 'Remove',
                    cost:0
                }];
            } else {
              let upgradecost=this.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier +1].cost*-1;
              let uptier=this.el.components['tower'].data.tier+2;
              let removemoney=Math.round(this.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier].cost*-0.35);
                uisets = [{
                    callback: this.requestRemove,
                    icon: 'money-bag',
                    header: 'Sell',
                    cost:'$'+removemoney
                }, {
                    callback: currentMoney >= upgradecost? this.requestUpgrade : null,
                    icon: 'upgrade',
                    header: 'Up('+uptier+')',
                    cost:upgradecost,
                    disable:currentMoney >= upgradecost ? false : true
                }];
            }
            return uisets;
        }
    });
})();
//line 72 add cost 84, 175
