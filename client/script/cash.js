AFRAME.registerSystem('cash', {
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
        this.updatemoney = this.updatemoney.bind(this);
        this.moneyA = 0;
        this.moneyB = 0;
        this.cashrateA = 1;
        this.cashrateB = 1;
        this.timecounter = 0;
        // this.el.addEventListener('buildtower', this.updatemoney);
        // this.el.addEventListener('wavecost', this.updatemoney);
        this.el.addEventListener('enemydestroy', this.updatemoney);
        this.updateUI = this.el.systems['tdar-game-ui'].updateMoneyPoint;
        this.updateUI(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
        // console.log("cash init");
        // Called on scene initialization.
    },
    tick: function(time, timedelta) {
        this.timecounter += timedelta;
        if (this.timecounter >= this.data.incrementalDuration) {
            this.moneyA += this.cashrateA;
            this.moneyB += this.cashrateB;
            this.timecounter -= this.data.incrementalDuration;
            // console.log("MoneyA: " + this.moneyA);
            // console.log("MoneyB: " + this.moneyB);
            this.updateUI(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
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
        this.updateUI(this.data.userFaction == 'A' ? this.moneyA: this.moneyB);
    }
    // Other handlers and methods.
});
