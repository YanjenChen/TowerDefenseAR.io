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
            // Prevent double emit click event bug on mouse.
            if (this.el.is('processing'))
                return;

            let self = this;
            if (this.el.is('empty')) {
                this.towerEl = document.createElement('a-entity');
                this.towerEl.setAttribute('tower', {
                    dps: 4,
                    faction: this.data.faction,
                    range: 10
                });
                this.el.appendChild(this.towerEl);

                // Prevent double emit click event bug on mouse.
                this.el.addState('processing');
                setTimeout(function() {
                    self.el.removeState('empty');
                    self.el.removeState('processing');
                }, 500);
            } else {
                this.towerEl.parentNode.removeChild(this.towerEl);
                this.towerEl = undefined;

                // Prevent double emit click event bug on mouse.
                this.el.addState('processing');
                setTimeout(function() {
                    self.el.addState('empty');
                    self.el.removeState('processing');
                }, 500);
            }
        }
    });
})();
