(() => {
    const MAX_UI = 3;
    const MAX_WAVE_DISPLAY = 6;

    AFRAME.registerSystem('tdar-game-ui', {
        schema: {
            primary: {
                type: 'boolean',
                default: false
            }
        },
        init: function() {
            this.createWaveMonitor = this.createWaveMonitor.bind(this);
            this.createStatusMonitor = this.createStatusMonitor.bind(this);
            this.createWaveSpawnerControl = this.createWaveSpawnerControl.bind(this);
            this.createObjectControl = this.createObjectControl.bind(this);


            this.waveMonitorEl = this.createWaveMonitor();
            this.statusMonitorEl = this.createStatusMonitor();
            this.waveSpawnerControlEl = this.createWaveSpawnerControl();
            this.objectControlEl = this.createObjectControl();

            this.waveSpawnerControlCallbacks = [];
            this.objectControlCallbacks = [];
            for (i = 0; i < MAX_UI; i++) {
                this.waveSpawnerControlCallbacks.push(null);
                this.objectControlCallbacks.push(null);
            }


            this.updateWaveTimer = this.updateWaveTimer.bind(this);
            this.updateWaveContent = this.updateWaveContent.bind(this);
            this.updateMoneyPoint = this.updateMoneyPoint.bind(this);
            this.updateHealthPoint = this.updateHealthPoint.bind(this);
            this.updateWaveSpawnerControl = this.updateWaveSpawnerControl.bind(this);
            this.clearWaveSpawnerControl = this.clearWaveSpawnerControl.bind(this);
            this.updateObjectControl = this.updateObjectControl.bind(this);
            this.clearObjectControl = this.clearObjectControl.bind(this);
        },
        createWaveMonitor: function() {
            let wrapper = document.createElement('div');
            wrapper.classList.add('tdar-ui-container', 'top', 'left');

            let waveMonitor = document.createElement('div');
            waveMonitor.classList.add('wrapper', 'verticle-grid', 'stripe');
            waveMonitor.setAttribute('id', 'wave-monitor');
            waveMonitor.insertAdjacentHTML('beforeend', '<div class="content text-center"><h1 class="primary">NEXT WAVE: <span id="wave-timer">00:00</span></h1></div>');

            let waveContentWrapper = document.createElement('div');
            waveContentWrapper.classList.add('content', 'block');
            let waveContent = document.createElement('div');
            waveContent.classList.add('wrapper', 'horizontal-grid');
            waveContent.setAttribute('id', 'wave-content');
            for (i = 0; i < MAX_WAVE_DISPLAY; i++) {
                let item = document.createElement('div');
                item.classList.add('icon');
                waveContent.appendChild(item);
            }

            waveContentWrapper.appendChild(waveContent);
            waveMonitor.appendChild(waveContentWrapper);
            wrapper.appendChild(waveMonitor);
            this.el.appendChild(wrapper);

            return waveMonitor;
        },
        createStatusMonitor: function() {
            let wrapper = document.createElement('div');
            wrapper.classList.add('tdar-ui-container', 'top', 'right');

            let statusMonitor = document.createElement('div');
            statusMonitor.classList.add('wrapper', 'verticle-grid', 'stripe');
            statusMonitor.setAttribute('id', 'status-monitor');
            statusMonitor.insertAdjacentHTML('beforeend', '<div class="content icon-header primary"><div class="icon two-coins"></div><h1 class="inverted"><span id="money-point">-</span></h1></div><div class="content icon-header"><div class="icon life-bar"></div><h1 class="inverted"><span id="health-point">-</span></h1></div>');

            wrapper.appendChild(statusMonitor);
            this.el.appendChild(wrapper);

            return statusMonitor;
        },
        createWaveSpawnerControl: function() {
            let wrapper = document.createElement('div');
            wrapper.classList.add('tdar-ui-container', 'bottom', 'left');

            let waveSpawnerControl = document.createElement('div');
            waveSpawnerControl.classList.add('wrapper', 'horizontal-grid');
            waveSpawnerControl.setAttribute('id', 'wavespawner-control');

            for (i = 0; i < MAX_UI; i++) {
                waveSpawnerControl.insertAdjacentHTML('beforeend', '<div class="tdar-button"><div class="button-icon"></div><h3 class="header">-</h3><div class="content icon-header"><div class="icon two-coins"></div><h3 class="inverted"><span class="cost">-</span></h3></div></div>');
            }

            wrapper.appendChild(waveSpawnerControl);
            this.el.appendChild(wrapper);

            return waveSpawnerControl;
        },
        createObjectControl: function() {
            let wrapper = document.createElement('div');
            wrapper.classList.add('tdar-ui-container', 'bottom', 'right');

            let objectControl = document.createElement('div');
            objectControl.classList.add('wrapper', 'horizontal-grid');
            objectControl.setAttribute('id', 'object-control');

            for (i = 0; i < MAX_UI; i++) {
                objectControl.insertAdjacentHTML('beforeend', '<div class="tdar-button"><div class="button-icon"></div><h3 class="header">-</h3><div class="content icon-header"><div class="icon two-coins"></div><h3 class="inverted"><span class="cost">-</span></h3></div></div>');
            }

            wrapper.appendChild(objectControl);
            this.el.appendChild(wrapper);

            return objectControl;
        },
        updateWaveTimer: function(time) {
            /*
             *   SPEC:
             *       (int) time: indicate time to next wave in ms.
             */
            let waveTimerEl = this.waveMonitorEl.querySelector('#wave-timer');
            let mm = Math.floor(time / 60000);
            let ss = Math.floor((time % 60000) / 1000);
            waveTimerEl.innerHTML = mm.toString() + ':' + ss.toString();
        },
        updateWaveContent: function(contents) {
            /*
             *   SPEC:
             *       (array of string) contents: set of icons indicate wave content.
             */
            let waveContentEl = this.waveMonitorEl.querySelector('#wave-content');
            let iconEls = Array.from(waveContentEl.querySelectorAll('.icon'));
            iconEls.forEach(iconEl => {
                iconEl.className = '';
                iconEl.classList.add('icon');
            });

            if (contents) {
                for (i = 0; i < contents.length; i++) {
                    iconEls[i].classList.add(contents[i]);
                }
            }
        },
        updateMoneyPoint: function(amount) {
            /*
             *   SPEC:
             *       (int) amount: amount of current player's money.
             */
            let moneyPointEl = this.statusMonitorEl.querySelector('#money-point');
            moneyPointEl.innerHTML = amount.toString();
        },
        updateHealthPoint: function(amount) {
            /*
             *   SPEC:
             *       (int) amount: amount of current player's health point.
             */
            let healthPointEl = this.statusMonitorEl.querySelector('#health-point');
            healthPointEl.innerHTML = amount.toString();
        },
        updateWaveSpawnerControl: function() {
            console.warn('WORK IN PROGRESS, THIS FUNCTION IS NOT WORKING');
        },
        clearWaveSpawnerControl: function() {
            console.warn('WORK IN PROGRESS, THIS FUNCTION IS NOT WORKING');
        },
        updateObjectControl: function(settings) {
            /*
             *   SPEC:
             *       (array of object) settings: settings of buttons.
             *          (object) = {icon: (string), header: (string), cost: (number), disable: {boolen}, callback: (function)}
             */
            if (settings.length >= MAX_UI) {
                console.warn('UI AMOUNT MUST LOWER THEN ', MAX_UI);
                return;
            }

            var self = this;
            this.clearObjectControl(function() {
                let buttonEls = Array.from(self.objectControlEl.querySelectorAll('.tdar-button'));
                for (i = 0; i < settings.length; i++) {
                    let setting = settings[i];
                    let buttonEl = buttonEls[i];

                    if (setting.disable) {
                        buttonEl.classList.add('disable');
                    } else {
                        if (setting.icon)
                            buttonEl.classList.add(setting.icon);
                        if (setting.header)
                            buttonEl.querySelector('.header').innerHTML = setting.header;
                        if (setting.cost)
                            buttonEl.querySelector('.cost').innerHTML = setting.cost;
                        buttonEl.addEventListener('click', setting.callback);
                        self.objectControlCallbacks[i] = setting.callback;
                    }
                }
            });
        },
        clearObjectControl: function(callback) {
            let buttonEls = Array.from(this.objectControlEl.querySelectorAll('.tdar-button'));
            for (i = 0; i < MAX_UI; i++) {
                let buttonEl = buttonEls[i];
                buttonEl.className = '';
                buttonEl.classList.add('tdar-button');
                buttonEl.querySelector('.header').innerHTML = '-';
                buttonEl.querySelector('.cost').innerHTML = '-';
                buttonEl.removeEventListener('click', this.objectControlCallbacks[i]);
                this.objectControlCallbacks[i] = null;
            }

            if (callback)
                callback();
        }
    });
})();
