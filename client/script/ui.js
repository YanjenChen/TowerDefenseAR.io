(() => {
	AFRAME.registerSystem('tdar-game-ui', {
		schema: {},
		init: function() {
            this.buttonEl = document.createElement('div');
            this.imgEl = document.createElement('img');

            this.buttonEl.setAttribute('class', 'tdar-ui-button');

            this.el.addEventListener('displayUi', this.onDisplayUi.bind(this));
		},
        onDisplayUi: function(evt) {

        }
	});
})();
