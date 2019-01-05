class CashManager {

    constructor(sceneEl) {
        /*
         * FUNCTION API SPEC
         *  sceneEl: DOM node point to <a-scene> element.
         *
         * CLASS PROPERTY
         *  amplifyAmount: (number)
         *  basicIncreaseAmount: (number)
         *  currentMoney: {A: (number), B: (number)}
         *  gameManager:
         *  incrementalDuration: (number)
         *  moneyAmplifer: {A: (number), B: (number)}
         *  networkManager:
         *  prevCheckTime: (number)
         *  sceneEl: DOM node point to <a-scene> element.
         *  uiManager:
         *  userFaction: One of ['RED', 'BLACK'].
         */

        this.sceneEl = sceneEl;
        this.gameManager = sceneEl.systems['tdar-game'].gameManager;
        this.networkManager = sceneEl.systems['tdar-game'].networkManager;
        this.uiManager = sceneEl.systems['tdar-game'].uiManager;

        this.amplifyAmount = this.gameManager.settings.cash.amplifyAmount;
        this.basicIncreaseAmount = this.gameManager.settings.cash.basicIncreaseAmount;
        this.currentMoney = {
            RED: 100,
            BLACK: 100
        };
        this.incrementalDuration = this.gameManager.settings.cash.incrementalDuration;
        this.moneyAmplifer = {
            RED: 0,
            BLACK: 0
        };
        this.prevCheckTime = 0;
        this.userFaction = sceneEl.systems['tdar-game'].data.userFaction;

        this.uiManager.updateMoneyPoint(this.currentMoney[this.userFaction]);

    }
    tick(time, timeDelta) {

        if (time - this.prevCheckTime > this.incrementalDuration) {

            this.requestUpdateCash(
                this.basicIncreaseAmount + this.moneyAmplifer.RED * this.amplifyAmount,
                'RED',
                false
            );
            this.requestUpdateCash(
                this.basicIncreaseAmount + this.moneyAmplifer.BLACK * this.amplifyAmount,
                'BLACK',
                false
            );
            this.prevCheckTime = time;

        }

    }
    requestUpdateCash(amount, faction, userEmit) {

        this.networkManager.emit('playingEvent', {
            event_name: 'request_update_cash',
            amount: amount,
            faction: faction,
            userEmit: userEmit
        });

    }
    executeUpdateCash(amount, faction) {

        this.currentMoney[faction] += amount;
        if (faction == this.userFaction) {

            this.uiManager.updateMoneyPoint(this.currentMoney[faction]);

            if (this.gameManager.gridEl) {

                this.gameManager.gridEl.components['grid'].onEndProcess();

            }

        }

    }
    updateMoneyAmplifer(ampAmount, faction) {

        this.moneyAmplifer[faction] += ampAmount;

    }

}
