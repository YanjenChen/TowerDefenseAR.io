(() => {
    AFRAME.registerComponent('moveontrace', {
        schema: {
            algorithm: {
                type: 'string',
                default: 'world-position',
                oneOf: ['world-position', 'local-position']
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
            },
            timeRatio: {
                type: 'number',
                default: 0.001
            }
        },
        init: function() {
            this.timeCounter = 0;
            this.completeDist = 0;
            this.updatePosition = (this.data.algorithm == 'world-position') ? this._traceOnWorldPosition.bind(this) : this._traceOnLocalPosition.bind(this);
        },
        tick: function(time, timeDelta) {
            if (this.data.target) {
                this.timeCounter += (timeDelta * this.data.timeRatio);
                if (this.timeCounter * this.data.speed <= this.data.maxRange) {
                    this.updatePosition(timeDelta);
                } else {
                    this.el.parentNode.removeChild(this.el);
                }
            } else {
                this.el.parentNode.removeChild(this.el);
            }
        },
        remove: function() {
            delete this.timeCounter;
            delete this.completeDist;
            delete this.updatePosition;
        },
        _traceOnLocalPosition: function(timeDelta) {
            console.warn('Utility not implement yet.');
            /*
            direction = this.data.target.object3D.position.sub(this.el.object3D.position).normalize();
            p = this.el.object3D.position.add(direction.multiplyScalar(timeDelta * this.data.timeRatio * this.data.speed));
            this.el.setAttribute('position', p);
            */
        },
        _traceOnWorldPosition: function(timeDelta) {
            direction = this.data.target.object3D.getWorldPosition().sub(this.el.object3D.getWorldPosition()).normalize();
            p = this.el.object3D.getWorldPosition().add(direction.multiplyScalar(timeDelta * this.data.timeRatio * this.data.speed));
            this.el.setAttribute('position', p);
        }
    });
})();