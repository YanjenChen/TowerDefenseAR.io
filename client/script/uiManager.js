const MAX_UI = 4;
const MAX_WAVE_DISPLAY = 6;

class UIManager {
    constructor(sceneEl) {
        /*
         * FUNCTION API SPEC
         *  sceneEl: DOM node point to <a-scene> element.
         *
         * CLASS PROPERTY
         *  sceneEl: DOM node point to <a-scene> element.
         */

        // Need define first.
        this.sceneEl = sceneEl;

        this.objectControlCallbacks = [];
        this.objectControlEl = this.createObjectControl();
        this.statusMonitorEl = this.createStatusMonitor();
        // this.waveMonitorEl = this.createWaveMonitor();
        // this.waveSpawnerControlCallbacks = [];
        // this.waveSpawnerControlEl = this.createWaveSpawnerControl();
        this.arControlCallback = {
            onTouchStart: null,
            onTouchEnd: null
        };
        this.arControlEl = this.createARControl();

        for (let i = 0; i < MAX_UI; i++) {
            //this.waveSpawnerControlCallbacks.push(null);
            this.objectControlCallbacks.push(null);
        }
    }
    /*
	createWaveMonitor() {
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
		this.sceneEl.appendChild(wrapper);

		return waveMonitor;
	}
    */
    createStatusMonitor() {
        let wrapper = document.createElement('div');
        wrapper.classList.add('tdar-ui-container', 'top', 'left');

        let statusMonitor = document.createElement('div');
        statusMonitor.classList.add('wrapper', 'verticle-grid', 'stripe');
        statusMonitor.setAttribute('id', 'status-monitor');
        statusMonitor.insertAdjacentHTML('beforeend', '<div class="content icon-header primary"><div class="icon two-coins"></div><h1 class="inverted"><span id="money-point">-</span></h1></div><div class="content icon-header"><div class="icon life-bar"></div><h1 class="inverted"><span id="health-point">-</span></h1></div>');

        wrapper.appendChild(statusMonitor);
        this.sceneEl.appendChild(wrapper);

        return statusMonitor;
    }
    /*
	createWaveSpawnerControl() {
		let wrapper = document.createElement('div');
		wrapper.classList.add('tdar-ui-container', 'bottom', 'left');

		let waveSpawnerControl = document.createElement('div');
		waveSpawnerControl.classList.add('wrapper', 'horizontal-grid');
		waveSpawnerControl.setAttribute('id', 'wavespawner-control');

		for (i = 0; i < MAX_UI; i++) {
			waveSpawnerControl.insertAdjacentHTML('beforeend', '<div class="tdar-button"><div class="button-icon"></div><h3 class="header">-</h3><div class="content icon-header"><div class="icon two-coins"></div><h3 class="inverted"><span class="cost">-</span></h3></div></div>');
		}

		wrapper.appendChild(waveSpawnerControl);
		this.sceneEl.appendChild(wrapper);

		return waveSpawnerControl;
	}
    */
    createObjectControl() {
        let wrapper = document.createElement('div');
        wrapper.classList.add('tdar-ui-container', 'bottom', 'center');

        let objectControl = document.createElement('div');
        objectControl.classList.add('wrapper', 'horizontal-grid');
        objectControl.setAttribute('id', 'object-control');

        for (i = 0; i < MAX_UI; i++) {
            objectControl.insertAdjacentHTML('beforeend', '<div class="tdar-button"><div class="button-icon"></div><h3 class="header">-</h3><div class="content icon-header"><div class="icon two-coins"></div><h3 class="inverted"><span class="cost">-</span></h3></div></div>');
        }

        wrapper.appendChild(objectControl);
        this.sceneEl.appendChild(wrapper);

        return objectControl;
    }
    createARControl() {
        let wrapper = document.createElement('div');
        wrapper.classList.add('tdar-ui-container', 'top', 'right');

        let arControl = document.createElement('div');
        arControl.classList.add('wrapper', 'horizontal-grid');
        arControl.setAttribute('id', 'ar-control');

        arControl.insertAdjacentHTML('beforeend', '<div class="tdar-button anchor"><div class="button-icon"></div></div>');

        wrapper.appendChild(arControl);
        this.sceneEl.appendChild(wrapper);

        return arControl;
    }
    updateWaveTimer(time) {
        /*
         *   SPEC:
         *       (int) time: indicate time to next wave in ms.
         */
        let waveTimerEl = this.waveMonitorEl.querySelector('#wave-timer');
        let mm = Math.floor(time / 60000);
        let ss = Math.floor((time % 60000) / 1000);
        waveTimerEl.innerHTML = mm.toString() + ':' + ss.toString();
    }
    updateWaveContent(contents) {
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
    }
    updateMoneyPoint(amount) {
        /*
         *   SPEC:
         *       (int) amount: amount of current player's money.
         */
        let moneyPointEl = this.statusMonitorEl.querySelector('#money-point');
        moneyPointEl.innerHTML = amount.toString();
    }
    updateHealthPoint(amount) {
        /*
         *   SPEC:
         *       (int) amount: amount of current player's health point.
         */
        let healthPointEl = this.statusMonitorEl.querySelector('#health-point');
        healthPointEl.innerHTML = amount.toString();
    }
    updateWaveSpawnerControl() {
        console.warn('WORK IN PROGRESS, THIS FUNCTION IS NOT WORKING');
    }
    clearWaveSpawnerControl() {
        console.warn('WORK IN PROGRESS, THIS FUNCTION IS NOT WORKING');
    }
    updateObjectControl(settings) {
        /*
         *   SPEC:
         *       (array of object) settings: settings of buttons.
         *          (object) = {icon: (string), header: (string), cost: (number), disable: {boolen}, callback: (function)}
         */
        if (settings.length > MAX_UI) {
            console.warn('UI AMOUNT MUST LOWER THEN ', MAX_UI);
            return;
        }

        var self = this;
        this.clearObjectControl(function() {
            let buttonEls = Array.from(self.objectControlEl.querySelectorAll('.tdar-button'));
            for (i = 0; i < settings.length; i++) {
                let setting = settings[i];
                let buttonEl = buttonEls[i];

                buttonEl.classList.remove('hide');

                if (setting.disable)
                    buttonEl.classList.add('disable');
                if (setting.icon)
                    buttonEl.classList.add(setting.icon);
                if (setting.header)
                    buttonEl.querySelector('.header').innerHTML = setting.header;
                if (setting.cost !== undefined)
                    buttonEl.querySelector('.cost').innerHTML = setting.cost;
                if (setting.callback !== null) {
                    buttonEl.addEventListener('click', setting.callback);
                    self.objectControlCallbacks[i] = setting.callback;
                }
            }
        });
    }
    clearObjectControl(callback) {
        let buttonEls = Array.from(this.objectControlEl.querySelectorAll('.tdar-button'));
        for (i = 0; i < MAX_UI; i++) {
            let buttonEl = buttonEls[i];
            buttonEl.className = '';
            buttonEl.classList.add('tdar-button');
            buttonEl.classList.add('hide');
            buttonEl.querySelector('.header').innerHTML = '-';
            buttonEl.querySelector('.cost').innerHTML = '-';
            buttonEl.removeEventListener('click', this.objectControlCallbacks[i]);
            this.objectControlCallbacks[i] = null;
        }

        if (callback)
            callback();
    }
    updateARControl(onTouchStart, onTouchEnd) {
        /*
         *   SPEC:
         *       (function) onTouchStart: callback on touchstart.
         *       (function) onTouchEnd: callback on touchend.
         */
        var self = this;
        this.clearObjectControl(function() {

            self.arControlEl.addEventListener('touchstart', onTouchStart);
            self.arControlEl.addEventListener('touchend', onTouchEnd);
            self.arControlCallback.onTouchStart = onTouchStart;
            self.arControlCallback.onTouchEnd = onTouchEnd;

        });
    }
    clearARControl(callback) {

        this.arControlEl.removeEventListener('touchstart', this.arControlCallback.onTouchStart);
        this.arControlEl.removeEventListener('touchend', this.arControlCallback.onTouchEnd);
        this.arControlCallback.onTouchStart = null;
        this.arControlCallback.onTouchEnd = null;

        if (callback)
            callback();

    }
}
