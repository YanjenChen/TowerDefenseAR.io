(() => {
    AFRAME.registerComponent('path-point', {
        schema: {},
        init: function() {
            this.el.addEventListener('componentchanged', this._changeHandler.bind(this));
            this.el.emit('path-point-change');
        },
        remove: function() {
            this.el.removeEventListener('componentchanged', this._changeHandler.bind(this));
        },
        _changeHandler: function(evt) {
            if (evt.detail.name == 'position')
                this.el.emit('path-point-change');
        }
    });

    AFRAME.registerComponent('path', {
        schema: {},
        init: function() {
            this.pathPoints = null;
            this.lines = [];
            this.el.addEventListener('path-point-change', this.update.bind(this));
        },
        remove: function() {
            delete this.pathPoints;
            delete this.lines;
            this.el.removeEventListener('path-point-change', this.update.bind(this));
        },
        update: function(oldData) {
            this.points = Array.from(this.el.querySelectorAll("[path-point]"));
            if (this.points.length <= 1) {
                console.warn("At least 2 curve-points needed to draw a path");
            } else {
                this.pathPoints = this.points.map((point) => {
                    /*
                    if (point.x !== undefined && point.y !== undefined && point.z !== undefined)
                        return point;
                    */
                    return point.object3D.getWorldPosition();
                    //return this.el.parentNode.object3D.worldToLocal(point.object3D.getWorldPosition());
                });

                this.lines = [];
                for (i = 0; i < this.pathPoints.length - 1; i++) {
                    this.lines.push(new THREE['LineCurve3'](this.pathPoints[i], this.pathPoints[i + 1]));
                }
            }

            delete this.points;
            this.el.emit('path-updated');
        }
    });

    AFRAME.registerComponent('moveonpath', {
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
                default: 5
            }
        },
        init: function() {
            this.lines = this.data.path.components['path'].lines;
            this.linesLength = this.lines.map(line => line.getLength());
            this.currentLine = 0;
            this.timeCounter = 0;
            this.completeDist = 0;

            this._lookAtDirection();
        },
        remove: function() {
            delete this.lines;
            delete this.linesLength;
            delete this.currentLine;
            delete this.timeCounter;
            delete this.completeDist;
        },
        tick: function(time, timeDelta) {
            if (!this.el.is('endofpath')) {
                this.timeCounter += (timeDelta * this.data.timeRatio);

                if (this.timeCounter * this.data.speed - this.completeDist >= this.linesLength[this.currentLine]) {
                    this.completeDist += this.linesLength[this.currentLine];
                    this.currentLine++;
                    this._lookAtDirection();
                }
                if (this.currentLine >= this.lines.length) {
                    this.el.addState('endofpath');
                    this.el.emit('movingended');
                } else {
                    var p = this.lines[this.currentLine].getPoint((this.data.speed * this.timeCounter - this.completeDist) / this.lines[this.currentLine].getLength());
                    p = this.data.path.parentNode.object3D.localToWorld(p);
                    this.el.setAttribute('position', this.el.parentNode.object3D.worldToLocal(p));
                }
            }
        },
        _lookAtDirection: function() {
            // Look at moving direction.
            if (this.currentLine < this.lines.length) {
                p1 = this.lines[this.currentLine].v1.clone();
                p2 = this.lines[this.currentLine].v2.clone();
                d = p2.sub(p1).normalize();
                d = this.data.path.parentNode.object3D.localToWorld(d);
                this.el.object3D.lookAt(this.el.parentNode.object3D.worldToLocal(d));
            }
        }
    });

    AFRAME.registerComponent('draw-path', {
        schema: {
            path: {
                type: 'selector',
                default: null
            }
        },
        init: function() {
            this.data.path.addEventListener('path-updated', this.update.bind(this));
        },
        update: function() {
            var mesh = this.el.getOrCreateObject3D('mesh', THREE.Line);

            lineMaterial = mesh.material ? mesh.material : new THREE.LineBasicMaterial({
                color: "#ff0000"
            });

            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices = [];

            this.data.path.components['path'].lines.forEach(line => {
                lineGeometry.vertices = lineGeometry.vertices.concat(line.getPoints());
            });

            this.el.setObject3D('mesh', new THREE.Line(lineGeometry, lineMaterial));
        },
        remove: function() {
            this.data.path.removeEventListener('path-updated', this.update.bind(this));
            this.el.getObject3D('mesh').geometry = new THREE.Geometry();
        }
    });
})();