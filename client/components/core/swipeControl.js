(() => {
    /*
     *  Swipe control inspire from: https://github.com/PiusNyakoojo/SwipeControls
     */
    AFRAME.registerComponent('swipe-control', {
        schema: {
            speed: {
                type: 'number',
                default: 0.02
            },
            swipeBuffer: {
                // reduction of speed after swipe is released ( between 0 and 1 )
                type: 'number',
                default: 0.85
            },
            enabled: {
                type: 'boolean',
                default: true
            },
            invertY: {
                type: 'boolean',
                default: false
            }
        },
        init: function() {

            this.canvasEl = this.el.sceneEl.canvas;
            this.cursorDown = false;
            this.timer = null;
            this.prevCursorPos = new THREE.Vector2(0, 0);
            this.cursorPos = new THREE.Vector2(0, 0);
            this.deltaCursor = new THREE.Vector2(0, 0);

            this.updatePos = this.updatePos.bind(this);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onTouchStart = this.onTouchStart.bind(this);
            this.onTouchMove = this.onTouchMove.bind(this);
            this.onTouchEnd = this.onTouchEnd.bind(this);
            this.cursorStopped = this.cursorStopped.bind(this);

            /*
            this.canvasEl.addEventListener('contextmenu', function(evt) {
                evt.preventDefault();
            }, false);
            */
            this.canvasEl.addEventListener('mousedown', this.onMouseDown, false);
            this.canvasEl.addEventListener('touchstart', this.onTouchStart, false);
            this.canvasEl.addEventListener('touchend', this.onTouchEnd, false);
            this.canvasEl.addEventListener('touchmove', this.onTouchMove, false);

            this.updatePos();

        },
        tick: function(time, timeDelta) {

            this.updatePos();

        },
        remove: function() {

            this.canvasEl.removeEventListener('mousedown', this.onMouseDown, false);
            this.canvasEl.removeEventListener('touchstart', this.onTouchStart, false);
            this.canvasEl.removeEventListener('touchend', this.onTouchEnd, false);
            this.canvasEl.removeEventListener('touchmove', this.onTouchMove, false);

            delete this.canvasEl;
            delete this.cursorDown;
            delete this.timer;
            delete this.prevCursorPos;
            delete this.cursorPos;
            delete this.deltaCursor;

        },
        updatePos: function() {

            if (this.cursorDown) {

                this.el.object3D.position.x += this.deltaCursor.x * this.data.speed;
                this.el.object3D.position.z += this.deltaCursor.y * this.data.speed * (this.invertY ? -1 : 1);

            } else {

                if (Math.abs(0 - this.deltaCursor.x) > 0.01) {

                    this.el.object3D.position.x += this.deltaCursor.x * this.data.speed;
                    this.deltaCursor.x *= this.data.swipeBuffer;

                }
                if (Math.abs(0 - this.deltaCursor.y) > 0.01) {

                    this.el.object3D.position.z -= this.deltaCursor.y * this.data.speed;
                    this.deltaCursor.y *= this.data.swipeBuffer;

                }
            }

        },
        onMouseDown: function(evt) {

            if (!this.data.enabled)
                return;

            if (evt.button === 0) {

                this.cursorDown = true;
                this.prevCursorPos.x = evt.clientX;
                this.prevCursorPos.y = evt.clientY;

            }

            this.canvasEl.addEventListener('mousemove', this.onMouseMove, false);
            this.canvasEl.addEventListener('mouseup', this.onMouseUp, false);

        },
        onMouseUp: function(evt) {

            if (!this.data.enabled)
                return;

            if (evt.button === 0) {

                this.cursorDown = false;

            }

            this.canvasEl.removeEventListener('mousemove', this.onMouseMove, false);
            this.canvasEl.removeEventListener('mouseup', this.onMouseUp, false);

        },
        onMouseMove: function(evt) {

            if (!this.data.enabled)
                return;

            if (this.cursorDown) {

                this.cursorPos.x = evt.clientX;
                this.deltaCursor.x = this.prevCursorPos.x - this.cursorPos.x;
                this.prevCursorPos.setX(this.cursorPos.x);


                this.cursorPos.y = evt.clientY;
                this.deltaCursor.y = this.prevCursorPos.y - this.cursorPos.y;
                this.prevCursorPos.setY(this.cursorPos.y);

                clearTimeout(this.timer);

                this.timer = setTimeout(this.cursorStopped, 20);

            }

        },
        onTouchStart: function(evt) {

            if (!this.data.enabled)
                return;

            if (evt.touches.length === 1) { // one-fingered touch

                this.cursorDown = true;
                this.prevCursorPos.x = evt.touches[0].pageX;
                this.prevCursorPos.y = evt.touches[0].pageY;

            }

        },
        onTouchMove: function(evt) {

            if (!this.data.enabled)
                return;

            evt.preventDefault();
            evt.stopPropagation();

            if (this.cursorDown) {

                this.cursorPos.x = evt.touches[0].pageX;
                this.deltaCursor.x = this.prevCursorPos.x - this.cursorPos.x;
                this.prevCursorPos.setX(this.cursorPos.x);


                this.cursorPos.y = evt.touches[0].pageY;
                this.deltaCursor.y = this.prevCursorPos.y - this.cursorPos.y;
                this.prevCursorPos.setY(this.cursorPos.y);

                clearTimeout(this.timer);

                this.timer = setTimeout(this.cursorStopped, 20);

            }

        },
        onTouchEnd: function(evt) {

            if (!this.data.enabled)
                return;

            this.cursorDown = false;

        },
        cursorStopped: function(evt) {

            if (!this.data.enabled)
                return;

            if (this.cursorDown) {

                this.deltaCursor.setX(0);
                this.deltaCursor.setY(0);

            }

        }
    });
})();
