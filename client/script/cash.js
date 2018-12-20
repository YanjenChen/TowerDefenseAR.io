AFRAME.registerComponent('cash', {
    schema: {
        userFaction: {
            type: 'string',
            default: 'A',
            oneOf: ['A', 'B']
        },
        incrementalDuration: {
            type: 'number',
            default: 10000
        }
    }, // System schema. Parses into `this.data`.
    init: function() {
        this.gameManager = this.el.sceneEl.systems['tdar-game'].gameManager;
        this.networkManager = this.el.sceneEl.systems['tdar-game'].networkManager;
        this.uiManager = this.el.sceneEl.systems['tdar-game'].uiManager;

        this.updatemoney = this.updatemoney.bind(this);
        this.moneyA = 0;
        this.moneyB = 0;
        this.cashrateA = 1;
        this.cashrateB = 1;
        this.timecounter = 0;

        this.el.addEventListener('enemydestroy', this.updatemoney);
        this.uiManager.updateMoneyPoint(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
    },
    tick: function(time, timedelta) {
        this.timecounter += timedelta;
        if (this.timecounter >= this.data.incrementalDuration) {
            this.moneyA += this.cashrateA;
            this.moneyB += this.cashrateB;
            this.timecounter -= this.data.incrementalDuration;
            this.uiManager.updateMoneyPoint(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
        }
    },
    remove: function() {
        this.updatemoney = this.updatemoney.bind(this);
        delete this.moneyA;
        delete this.moneyB;
        delete this.cashrateA;
        delete this.cashrateB;
        delete this.timeCounter;
        delete this.el.addEventListener('buildtower', this.updatemoney)
        delete this.el.addEventListener('wavecost', this.updatemoney)
        delete this.el.addEventListener('enemydestroy', this.updatemoney)
    },
    updatemoney: function(event) {
        if (event.detail.faction == 'A') {
            this.moneyB += event.detail.cost;
            // console.log("updatemoneyB: " + this.moneyB);
        } else {
            this.moneyA += event.detail.cost;
            // console.log("updatemoneyA: " + this.moneyA);
        }
        this.uiManager.updateMoneyPoint(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
    }
    // Other handlers and methods.
});
