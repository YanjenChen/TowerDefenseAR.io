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
		 *  userFaction: One of ['A', 'B'].
		 */

		this.sceneEl = sceneEl;
		this.gameManager = sceneEl.systems['tdar-game'].gameManager;
		this.networkManager = sceneEl.systems['tdar-game'].networkManager;
		this.uiManager = sceneEl.systems['tdar-game'].uiManager;

		this.amplifyAmount = this.gameManager.settings.cash.amplifyAmount;
		this.basicIncreaseAmount = this.gameManager.settings.cash.basicIncreaseAmount;
		this.currentMoney = {
			A: 0,
			B: 0
		};
		this.incrementalDuration = this.gameManager.settings.cash.incrementalDuration;
		this.moneyAmplifer = {
			A: 0,
			B: 0
		};
		this.prevCheckTime = 0;
		this.userFaction = sceneEl.systems['tdar-game'].data.userFaction;
	}
	tick(time, timeDelta) {
		if (time - this.prevCheckTime > this.incrementalDuration) {
			this.requestUpdateCash(
				this.basicIncreaseAmount + this.moneyAmplifer.A * this.amplifyAmount,
				'A'
			)
			this.requestUpdateCash(
				this.basicIncreaseAmount + this.moneyAmplifer.B * this.amplifyAmount,
				'B'
			)
			this.prevCheckTime = time;
		}
	}
	requestUpdateCash(amount, faction) {
		this.networkManager.emit('playingEvent', {
			event_name: 'request_update_cash',
			amount: amount,
			faction: faction
		});
	}
	executeUpdateCash(amount, faction) {
		this.currentMoney[faction] += amount;
		if (faction == this.userFaction) {
			this.uiManager.updateMoneyPoint(this.currentMoney[faction]);
		}
	}
}
