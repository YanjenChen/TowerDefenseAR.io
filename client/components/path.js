(() => {
    AFRAME.registerComponent('path-point', {
        //dependencies: ['position'],
        schema: {},
        init: function() {
            this.el.addEventListener('componentchanged', this.changeHandler.bind(this));
            this.el.emit('path-point-change');
        },
        changeHandler: function(evt) {
            if (evt.detail.name == 'position')
                this.el.emit('path-point-change');
        }
    });

    AFRAME.registerComponent('path', {
        //dependencies: ['path-point'],
        schema: {},
        init: function() {
            this.pathPoints = null;
            this.lines = [];
            this.el.addEventListener('path-point-change', this.update.bind(this));
        },
        update: function(oldData) {
            this.points = Array.from(this.el.querySelectorAll("[path-point]"));
            if (this.points.length <= 1) {
                console.warn("At least 2 curve-points needed to draw a path");
            } else {
                var pointsArray = this.points.map((point) => {
                    if (point.x !== undefined && point.y !== undefined && point.z !== undefined)
                        return point;
                    //return point.object3D.getWorldPosition();
                    return point.object3D.getWorldPosition();
                });
                this.pathPoints = pointsArray;

                this.lines = [];
                for (i = 0; i < this.pathPoints.length - 1; i++) {
                    this.lines.push(new THREE['LineCurve3'](this.pathPoints[i], this.pathPoints[i + 1]));
                }
            }
        }
    });

    AFRAME.registerComponent('moveonpath', {
        //dependencies: ['path'],
        schema: {
            path: {
                type: 'selector',
                default: null
            },
            timeRatio: {
                type: 'number',
                default: 0.001
            },
            speed: {
                type: 'number',
                default: 1
            }
        },
        init: function() {
            this.lines = this.data.path.components['path'].lines;
            this.linesLength = this.lines.map(line => line.getLength());
            this.currentLine = 0;
            this.timeCounter = 0;
            this.completeDist = 0;
        },
        tick: function(time, timeDelta) {
            if (!this.el.is('endofpath')) {
                this.timeCounter += (timeDelta * this.data.timeRatio);

                if (this.timeCounter * this.data.speed - this.completeDist >= this.linesLength[this.currentLine]) {
                    this.completeDist += this.linesLength[this.currentLine];
                    this.currentLine++;
                }
                if (this.currentLine >= this.lines.length) {
                    this.el.addState('endofpath');
                    this.el.emit('movingended');
                } else {
                    var p = this.lines[this.currentLine].getPoint((this.data.speed * this.timeCounter - this.completeDist) / this.lines[this.currentLine].getLength());
                    this.el.setAttribute('position', p);
                }
            }
        }
    });
})();