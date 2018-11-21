(() => {
    AFRAME.registerSystem('bullet', {
        init: function() {
            this.errElementList = [];
        },
        tick: function() {
            if (this.errElementList && this.errElementList.length) {
                this.errElementList.forEach(errEl => {
                    errEl.parentNode.removeChild(errEl);
                });
                this.errElementList.splice(0, this.errElementList.length);
                //console.warn('Clear up bugged bullets.');
            }
        },
        addToErrList: function(el) {
            this.errElementList.push(el);
        }
    });

    AFRAME.registerComponent('bullet', {
        schema: {
            damagePoint: {
                type: 'number',
                default: 1
            },
            maxRange: {
                type: 'number',
                default: 1
            },
            speed: {
                type: 'number',
                default: 20
            },
            target: {
                type: 'selector',
                default: null
            }
        },
        init: function() {
            if (!this._isTargetExist()) {
                //console.warn('Target does not exist.');
                this.system.addToErrList(this.el);
            } else {
                this.el.setAttribute('geometry', {
                    primitive: 'sphere',
                    radius: 0.1,
                    segmentsHeight: 4,
                    segmentsWidth: 4
                });
                this.el.setAttribute('moveontrace', {
                    maxRange: this.data.maxRange,
                    speed: this.data.speed,
                    target: '#' + this.data.target.getAttribute('id')
                });
                this.el.addEventListener('reached-target', this._onAttack.bind(this));
            }
        },
        remove: function() {
            this.el.removeEventListener('reached-target', this._onAttack.bind(this));
        },
        _onAttack: function() {
            if (this._isTargetExist()) {

                this.data.target.emit('be-attacked', {//向data.target發送be-attacked
                    damage: this.data.damagePoint
                });
            }
            this.el.parentNode.removeChild(this.el);
        },
        _isTargetExist: function() {
            if (this.data.target == null)
                return false;
            return this.el.sceneEl.querySelector('#' + this.data.target.id);
        }
    });
})();
