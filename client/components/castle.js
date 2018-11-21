(() => {
    AFRAME.registerSystem('castle', {
        init: function() {
            this.faction = {
                A: {},
                B: {}
            };
        }
    });

    AFRAME.registerComponent('castle', {
        schema: {
            faction: {
                type: 'string',
                default: 'A',
                oneOf: ['A', 'B']
            },
            healthPoint: {
                type: "number",
                default: 100
            }
        },
        init: function() {
            this.currentHP = this.data.healthPoint;
            this.targetEl = null;
            this.el.addEventListener('castle-be-attacked', this._onBeAttacked.bind(this));
            console.log(this.currentHP);
        },

        remove: function() {
            delete this.targetEl;
            delete this.targetFac;
            delete this.duration;
            delete this.timeCounter;
            this.el.removeEventListener('castle-be-attcked', this._onBeAttacked.bind(this));
        },

        _onBeAttacked: function(evt){
          this.currentHP -= evt.detail.damage;
          console.log("CurrentHP"+this.currentHP);
          if(this.currentHP<=0){
            console.log("Gameover");
          }
        }

    });
})();
