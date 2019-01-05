(() => {
    'use strict';

    const PROCESS_TIME = 1000;

    const COMPONENT_NAME = 'tower-base';
    const COMPONENT_PREFIX = 'tower-base-'
    const FACTION_RED_PREFIX = 'RED-';
    const FACTION_BLACK_PREFIX = 'BLACK-';
    const GAME_SYS_NAME = 'tdar-game';
    const TYPE_LASER = 'laser';
    const TYPE_CATAPULT = 'catapult';
    const TYPE_GOLDMINE = 'goldMine';

    const KEYS = [
        FACTION_RED_PREFIX + TYPE_LASER,
        FACTION_RED_PREFIX + TYPE_CATAPULT,
        FACTION_RED_PREFIX + TYPE_GOLDMINE,
        FACTION_BLACK_PREFIX + TYPE_LASER,
        FACTION_BLACK_PREFIX + TYPE_CATAPULT,
        FACTION_BLACK_PREFIX + TYPE_GOLDMINE
    ];

    AFRAME.registerSystem(COMPONENT_NAME, {

        init: function() {

            let self = this;

            this.el.addEventListener('gamemodelloaded', function _init() {

                self.cashManager = self.el.systems[GAME_SYS_NAME].cashManager;
                self.gameManager = self.el.systems[GAME_SYS_NAME].gameManager;
                self.networkManager = self.el.systems[GAME_SYS_NAME].networkManager;
                self.uiManager = self.el.systems[GAME_SYS_NAME].uiManager;
                self.Utils = self.gameManager.Utils;

                self.el.removeEventListener('gamemodelloaded', _init);

            });

        }

    });

    AFRAME.registerComponent(COMPONENT_NAME, {
        schema: {},
        init: function() {

            this.el.addState('empty');

            this.requestTower = this.requestTower.bind(this);
            this.requestLaser = this.requestLaser.bind(this);
            this.requestCatapult = this.requestCatapult.bind(this);
            this.requestGoldmine = this.requestGoldmine.bind(this);
            this.createTower = this.createTower.bind(this);
            this.requestUpgrade = this.requestUpgrade.bind(this);
            this.upgradeTower = this.upgradeTower.bind(this);
            this.requestRemove = this.requestRemove.bind(this);
            this.removeTower = this.removeTower.bind(this);
            this.getUIsets = this.getUIsets.bind(this);

            this.timeCounter = 0;
            this.currentOwner = null;
            this.isTowerBase = true;

            this.el.addEventListener('create-tower', this.createTower);
            this.el.addEventListener('upgrade-tower', this.upgradeTower);
            this.el.addEventListener('remove-tower', this.removeTower);

        },
        tick: function(time, timeDelta) {

            if (this.el.is('processing')) {

                this.timeCounter += timeDelta;
                if (this.timeCounter >= PROCESS_TIME) {

                    this.el.removeState('processing');
                    this.system.gameManager.gridEl.components['grid'].onEndProcess();
                    this.timeCounter = 0;

                }

            }

        },
        remove: function() {

            delete this.timeCounter;
            delete this.currentOwner;

            this.el.removeEventListener('create-tower', this.createTower);
            this.el.removeEventListener('upgrade-tower', this.upgradeTower);
            this.el.removeEventListener('remove-tower', this.removeTower);

        },
        requestTower: function(type) {

            if (!(type === TYPE_LASER || type == TYPE_CATAPULT || type == TYPE_GOLDMINE)) {

                console.warn('Request tower receive unknown type: ', type);
                return true;

            }
            if (!this.el.id) {

                console.warn('Towerbase does not have id.');
                return true;

            }

            this.system.networkManager.emit('playingEvent', {
                event_name: 'request_create_tower',
                id: this.el.id,
                faction: this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction,
                type: type,
                amount: this.system.gameManager.settings.tower[type][0].cost,
                ampamount: this.system.gameManager.settings.tower[type][0].amplifyAmount
            });

            this.system.uiManager.updateObjectControl([]);

        },
        requestLaser: function() {

            this.requestTower(TYPE_LASER);

        },
        requestCatapult: function() {

            this.requestTower(TYPE_CATAPULT);

        },
        requestGoldmine: function() {

            this.requestTower(TYPE_GOLDMINE);

        },
        createTower: function(evt) {

            this.el.setAttribute('tower', {
                faction: evt.detail.faction,
                type: evt.detail.type,
                tier: 0
            });
            this.el.removeState('empty');
            this.el.addState('processing');
            this.currentOwner = evt.detail.faction;

            this.system.gameManager.updateGameGridByModel(
                this.el.object3D.position,
                evt.detail.faction + '-tower-' + evt.detail.type,
                false
            );

            this.el.sceneEl.emit('systemupdatepath', {
                faction: evt.detail.faction
            });

            this.system.cashManager.requestUpdateCash(evt.detail.amount, evt.detail.faction, true);
            this.system.cashManager.updateMoneyAmplifer(evt.detail.ampamount, evt.detail.faction);

        },
        requestUpgrade: function() {

            if (!this.el.id) {

                console.warn('Towerbase does not have id.');
                return true;

            }

            let type = this.el.components['tower'].data.type;
            let tier = this.el.components['tower'].data.tier + 1;

            this.system.networkManager.emit('playingEvent', {
                event_name: 'request_upgrade_tower',
                id: this.el.id,
                faction: this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction,
                amount: this.system.gameManager.settings.tower[type][tier].cost
            });

            this.system.uiManager.updateObjectControl([]);

        },
        upgradeTower: function(evt) {

            this.el.addState('processing');
            this.el.components['tower'].upgradeTier();
            this.system.cashManager.requestUpdateCash(evt.detail.amount, evt.detail.faction, true);
            // this.system.cashManager.updateMoneyAmplifer(evt.detail.ampamount, evt.detail.faction);

        },
        requestRemove: function() {

            if (!this.el.id) {

                console.warn('Towerbase does not have id.');
                return true;

            }

            this.system.networkManager.emit('playingEvent', {
                event_name: 'request_remove_tower',
                faction: this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction,
                id: this.el.id,
                ampamount: this.system.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier].amplifyAmount,
                amount: this.system.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier].cost
            });

            this.currentOwner = null;
            this.system.uiManager.updateObjectControl([]);

        },
        removeTower: function(evt) {

            this.system.cashManager.updateMoneyAmplifer(evt.detail.ampamount * -1, evt.detail.faction);
            this.system.cashManager.requestUpdateCash(Math.round(evt.detail.amount * -0.35), evt.detail.faction, true);

            this.system.gameManager.updateGameGridByModel(
                this.el.object3D.position,
                evt.detail.faction + '-tower-' + this.el.components.tower.data.type,
                true
            );

            this.el.removeAttribute('tower');
            this.el.addState('empty');
            this.el.addState('processing');

            this.el.sceneEl.emit('systemupdatepath', {
                faction: evt.detail.faction
            });

        },
        getUIsets: function() {

            if (this.el.is('processing')) {

                return [];

            }

            let currentMoney = this.system.cashManager.currentMoney[this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction];
            let uisets;

            if (this.el.is('empty')) {

                let lasercost = this.system.gameManager.settings.tower[TYPE_LASER][0].cost * -1;
                let missilecost = this.system.gameManager.settings.tower[TYPE_CATAPULT][0].cost * -1;
                let goldminecost = this.system.gameManager.settings.tower[TYPE_GOLDMINE][0].cost * -1;

                uisets = [{
                    callback: currentMoney >= lasercost ? this.requestLaser : null,
                    icon: 'beam',
                    header: 'Beam',
                    cost: lasercost,
                    disable: currentMoney >= lasercost ? false : true
                }, {
                    callback: currentMoney >= missilecost ? this.requestCatapult : null,
                    icon: 'rocket',
                    header: 'Catapult',
                    cost: missilecost,
                    disable: currentMoney >= missilecost ? false : true
                }, {
                    callback: currentMoney >= goldminecost ? this.requestGoldmine : null,
                    icon: 'gold',
                    header: 'GoldMine',
                    cost: goldminecost,
                    disable: currentMoney >= goldminecost ? false : true
                }];

            } else if (this.currentOwner !== this.el.sceneEl.systems[GAME_SYS_NAME].data.userFaction) {

                uisets = [];

            } else if (this.el.components['tower'].isMaxTier()) {

                let removemoney = Math.round(this.system.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier].cost * -0.35);

                uisets = [{
                    callback: this.requestRemove,
                    icon: 'money-bag',
                    header: 'Sell',
                    cost: removemoney
                }];

            } else {

                let upgradecost = this.system.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier + 1].cost * -1;
                let uptier = this.el.components['tower'].data.tier + 2;
                let removemoney = Math.round(this.system.gameManager.settings.tower[this.el.components['tower'].data.type][this.el.components['tower'].data.tier].cost * -0.35);

                uisets = [{
                    callback: this.requestRemove,
                    icon: 'money-bag',
                    header: 'Sell',
                    cost: removemoney
                }, {
                    callback: currentMoney >= upgradecost ? this.requestUpgrade : null,
                    icon: 'upgrade',
                    header: 'Up(' + uptier.toString() + ')',
                    cost: upgradecost,
                    disable: currentMoney >= upgradecost ? false : true
                }];

            }
            return uisets;

        }

    });
})();
//line 72 add cost 84, 175
