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
            this.towerEl = undefined;

            this.el.addState('empty');

            this.el.addEventListener('click', this.onClick.bind(this));
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
        onClick: function(evt) {
            if (this.el.is('empty')) {
                this.towerEl = document.createElement('a-entity');
                this.towerEl.setAttribute('tower', {
                    dps: 10,
                    faction: this.data.faction,
                    range: 10
                });
                this.el.appendChild(this.towerEl);
                this.el.removeState('empty')
            } else {
                this.towerEl.parentNode.removeChild(this.towerEl);
                this.towerEl = undefined;
                this.el.addState('empty');
            }
        }
    });
})();
