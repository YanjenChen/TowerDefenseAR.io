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
        schema: {
            lineType: {
                type: 'string',
                default: 'Line',
                oneOf: ['CatmullRom', 'Line']
            }
        },
        init: function() {
            this.pathPoints = null;
            if (this.data.lineType == 'Line')
                this.lines = [];
            else
                this.line = null;
            this.el.addEventListener('path-point-change', this.update.bind(this));
        },
        remove: function() {
            delete this.pathPoints;
            if (this.data.lineType == 'Line')
                delete this.lines;
            else
                delete this.line;
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
                    let p = new THREE.Vector3();
                    point.object3D.getWorldPosition(p);
                    return p;
                    //return this.el.parentNode.object3D.worldToLocal(point.object3D.getWorldPosition());
                });
                if (this.data.lineType == 'Line') {
                    delete this.lines;
                    this.lines = [];
                    for (i = 0; i < this.pathPoints.length - 1; i++) {
                        this.lines.push(new THREE['LineCurve3'](this.pathPoints[i], this.pathPoints[i + 1]));
                    }
                } else {
                    delete this.line;
                    this.line = new THREE['CatmullRomCurve3'](this.pathPoints);
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
                default: 1
            }
        },
        init: function() {
            this.lineType = this.data.path.components['path'].data.lineType;
            if (this.lineType == 'Line') {
                this.lines = this.data.path.components['path'].lines;
                this.linesLength = this.lines.map(line => line.getLength());
                this.currentLine = 0;

                this.el.object3D.position.copy(this.lines[this.currentLine].v1);
                this._lookAtDirectionLine();
            } else {
                // For CatmullRomCurve3
                this.line = this.data.path.components['path'].line;
                this.lineLength = this.line.getLength();
                // Change speed to arc speed.
                this.el.setAttribute('moveonpath', {
                    speed: this.data.speed / (2 * Math.PI)
                });
            }
            this.timeCounter = 0;
            this.completeDist = 0;
        },
        remove: function() {
            if (this.lineType == 'Line') {
                delete this.lines;
                delete this.linesLength;
                delete this.currentLine;
            } else {
                delete this.line;
                delete this.lineLength;
            }
            delete this.timeCounter;
            delete this.completeDist;
            delete this.lineType;
        },
        tick: function(time, timeDelta) {
            if (this.lineType == 'Line') {
                // For Line curve.
                if (!this.el.is('endofpath')) {
                    this.timeCounter += (timeDelta * this.data.timeRatio);

                    if (this.timeCounter * this.data.speed - this.completeDist >= this.linesLength[this.currentLine]) {
                        this.completeDist += this.linesLength[this.currentLine];
                        this.currentLine++;
                        this._lookAtDirectionLine();
                    }
                    if (this.currentLine >= this.lines.length) {
                        this.el.addState('endofpath');
                        this.el.emit('movingended');
                    } else {
                        let p = this.lines[this.currentLine].getPoint((this.data.speed * this.timeCounter - this.completeDist) / this.lines[this.currentLine].getLength());
                        p = this.data.path.parentNode.object3D.localToWorld(p);
                        this.el.object3D.position.copy(this.el.parentNode.object3D.worldToLocal(p));
                    }
                }
            } else {
                // For CatmullRomCurve3 curve.
                if (!this.el.is('endofpath')) {
                    this.timeCounter += (timeDelta * this.data.timeRatio);
                    this.completeDist += this.data.speed * this.timeCounter;

                    if (this.completeDist >= this.lineLength) {
                        this.el.addState('endofpath');
                        this.el.emit('movingended');
                    } else {
                        let p = this.line.getUtoTmapping(0, this.completeDist);
                        p = this.line.getPoint(p);
                        p = this.data.path.parentNode.object3D.localToWorld(p);
                        this.el.object3D.lookAt(p);
                        this.el.object3D.position.copy(this.el.parentNode.object3D.worldToLocal(p));
                    }
                }
            }
        },
        _lookAtDirectionLine: function() {
            // Look at moving direction.
            if (this.currentLine < this.lines.length) {
                p2 = this.lines[this.currentLine].v2.clone();
                d = this.data.path.parentNode.object3D.localToWorld(p2);
                this.el.object3D.lookAt(d);
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
            let lineMaterial = new THREE.LineBasicMaterial({});

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
