(() => {
    AFRAME.registerComponent('moveontrace', {
        schema: {
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
            triggerRange: {
                type: 'number',
                default: 0.08
            },
            timeRatio: {
                type: 'number',
                default: 0.001
            }
        },
        init: function() {
            if (!this._isTargetExist())
                console.warn('Target does not exist.');

            this.timeCounter = 0;
            this.completeDist = 0;
        },
        tick: function(time, timeDelta) {
            if (this._isTargetExist()) {
                this.timeCounter += (timeDelta * this.data.timeRatio);
                if (this.timeCounter * this.data.speed <= this.data.maxRange) {
                    p1 = this.el.object3D.position;
                    p2 = this.el.parentNode.object3D.worldToLocal(this.data.target.object3D.getWorldPosition());
                    rDelta = p1.distanceTo(p2);

                    if (rDelta < this.data.triggerRange) {
                        this.el.emit('reached-target');
                    } else {
                        direction = p2.sub(p1).normalize();
                        p = p1.add(direction.multiplyScalar(timeDelta * this.data.timeRatio * this.data.speed));
                        this.el.setAttribute('position', p);
                    }
                } else {
                    //console.log('Element out of range.');
                    //console.warn('Element out of range.');

                    this.el.parentNode.removeChild(this.el);
                }
            } else {
                //console.log('Element lost target.');

                this.el.parentNode.removeChild(this.el);
            }
        },
        remove: function() {
            delete this.timeCounter;
            delete this.completeDist;
        },
        _isTargetExist: function() {
            if (this.data.target == null)
                return false;
            return this.el.sceneEl.querySelector('#' + this.data.target.id);
        }
    });
})();
