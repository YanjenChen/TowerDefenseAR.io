(() => {
    AFRAME.registerComponent('tower-base', {
        schema: {
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            }
        },
        init: function() {
            this.fortBase = undefined;
            this.towerEl = undefined;

            this.el.addState('empty');

            this.onStateAdded = this.onStateAdded.bind(this);
            this.onStateRemoved = this.onStateRemoved.bind(this);
            this.createLaserTower = this.createLaserTower.bind(this);
            this.createMissileTower = this.createMissileTower.bind(this);
            this.upgradeTower = this.upgradeTower.bind(this);
            this.removeTower = this.removeTower.bind(this);
            this.getUIsets = this.getUIsets.bind(this);
            this.updateUI = this.updateUI.bind(this);

            this.el.addEventListener('stateadded', this.onStateAdded);
            this.el.addEventListener('stateremoved', this.onStateRemoved);
        },
        tick: function(time, timeDelta) {
            // ONLY USE IN DEVELOPER TESTING
            if (this.el.is('cursor-hovered'))
                this.el.setAttribute('glow', {
                    enabled: true
                });
            else
                this.el.setAttribute('glow', {
                    enabled: false
                });
            ////////////////////////////////
        },
        remove: function() {
            delete this.towerEl;

            this.el.removeEventListener('click', this.onClick.bind(this));
        },
        onStateAdded: function(evt) {
            if (evt.detail == 'cursor-hovered') {
                this.el.sceneEl.systems['tdar-game-ui'].displayUIs(this.getUIsets());
            }
        },
        createLaserTower: function() {
            this.towerEl = document.createElement('a-entity');
            this.towerEl.setAttribute('tower', {
                faction: this.data.faction,
                type: 'laser',
                tier: 0
            });
            this.el.appendChild(this.towerEl);
            this.el.removeState('empty');
            this.updateUI();
        },
        createMissileTower: function() {
            this.towerEl = document.createElement('a-entity');
            this.towerEl.setAttribute('tower', {
                faction: this.data.faction,
                type: 'missile',
                tier: 0
            });
            this.el.appendChild(this.towerEl);
            this.el.removeState('empty');
            this.updateUI();
        },
        upgradeTower: function() {
            this.towerEl.components['tower'].upgradeTier();
            this.updateUI();
        },
        removeTower: function() {
            this.towerEl.parentNode.removeChild(this.towerEl);
            this.towerEl = undefined;
            this.el.addState('empty');
            this.updateUI();
        },
        onStateRemoved: function(evt) {
            if (evt.detail == 'cursor-hovered') {
                this.el.sceneEl.systems['tdar-game-ui'].removeUIs();
            }
        },
        getUIsets: function() {
            var uisets;
            if (this.el.is('empty')) {
                uisets = [{
                    callback: this.createLaserTower,
                    icon: 'beam'
                }, {
                    callback: this.createMissileTower,
                    icon: 'rocket'
                }];
            } else if (this.towerEl.components['tower'].isMaxTier()) {
                uisets = [{
                    callback: this.removeTower,
                    icon: 'demolish'
                }];
            } else {
                uisets = [{
                    callback: this.removeTower,
                    icon: 'demolish'
                }, {
                    callback: this.upgradeTower,
                    icon: 'upgrade'
                }];
            }
            return uisets;
        },
        updateUI: function() {
            this.el.sceneEl.systems['tdar-game-ui'].removeUIs();
            var self = this;
            setTimeout(function() {
                if (self.el.is('cursor-hovered'))
                    self.el.sceneEl.systems['tdar-game-ui'].displayUIs(self.getUIsets());
            }, 1000);
        }
    });
})();
