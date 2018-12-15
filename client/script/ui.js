(() => {
    const MAX_UI = 3;

    AFRAME.registerSystem('tdar-game-ui', {
        schema: {
            primary: {
                type: 'boolean',
                default: false
            }
        },
        init: function() {
            this.buttons = [];

            let containerEl = document.createElement('div');
            containerEl.classList.add('tdar-ui-buttons-container');
            for (i = 0; i < MAX_UI; i++) {
                let wrapperEl = document.createElement('div');
                wrapperEl.classList.add('tdar-ui-button-wrapper');
                if (i == 0 && this.data.primary)
                    wrapperEl.classList.add('primary');
                wrapperEl.classList.add('empty');
                let buttonEl = document.createElement('div');
                buttonEl.classList.add('tdar-ui-button');
                wrapperEl.appendChild(buttonEl);
                containerEl.appendChild(wrapperEl);
                this.buttons.push(wrapperEl);
            }
            this.el.appendChild(containerEl);

            this.displayUIs = this.displayUIs.bind(this);
        },
        displayUIs: function(UIs) {
            // UIs: array contains object pair {click: function(), hover: function(), icon: string}.
            // First elemnt in array will set as primary.
            if (UIs.length >= MAX_UI) {
                console.warn('At most pass 3 UI to interface.');
                return;
            }
            if (!UIs || UIs.length == 0) {
                console.warn('At least pass 1 UI to interface.');
                return;
            }

            this.removeUIs();

            let i = 0;
            UIs.forEach(UI => {
                let buttonEl = this.buttons[i];
                buttonEl.classList.remove('empty');
                buttonEl.classList.add(UI.icon);
                buttonEl.addEventListener('click', UI.callback);
                i++;
            });
        },
        removeUIs: function() {
            for (i = 0; i < MAX_UI; i++) {
                // Clear all style and callback.
                let buttonEl = this.buttons[i];
                buttonEl.className = '';
                buttonEl.classList.add('tdar-ui-button-wrapper');
                if (i == 0 && this.data.primary)
                    buttonEl.classList.add('primary');
                buttonEl.classList.add('empty');
                let newButtonEl = buttonEl.cloneNode(true);
                buttonEl.parentNode.replaceChild(newButtonEl, buttonEl);
                this.buttons[i] = newButtonEl;
            }
        }
    });
})();
