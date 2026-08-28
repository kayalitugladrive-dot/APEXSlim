/**
 * Portfolio risk models evaluated each engine tick (paper).
 * - collective_amortization: scale-in against the losing side to lower average cost
 * - position_hedging: open opposite size to lock floating loss
 */
export function evaluateRisk(bot, mark, position) {
	const model = bot.riskModel || { type: 'none' };
	if (!position || mark == null) return { action: 'HOLD', reason: 'no position' };

	const dir = position.side === 'LONG' || position.side === 'BUY' ? 1 : -1;
	const pnlPct = ((mark - position.entryPrice) / position.entryPrice) * dir * 100;
	const adverse = pnlPct < 0;

	if (model.type === 'collective_amortization' && adverse && Math.abs(pnlPct) >= (model.triggerPct || 1)) {
		const addQty = Number(position.quantity) * (model.stepPct || 0.25);
		const newAvg = (position.entryPrice * position.quantity + mark * addQty) / (position.quantity + addQty);
		return {
			action: 'AMORTIZE',
			addQty,
			newAvg,
			pnlPct,
			note: `Collective amortization: add ${addQty} @ ${mark} → avg ${newAvg.toFixed(4)}`,
		};
	}

	if (model.type === 'position_hedging' && adverse && Math.abs(pnlPct) >= (model.triggerPct || 1.5)) {
		const hedgeQty = Number(position.quantity) * (model.hedgeRatio || 1);
		const hedgeSide = dir > 0 ? 'SHORT' : 'LONG';
		return {
			action: 'HEDGE',
			hedgeSide,
			hedgeQty,
			pnlPct,
			note: `Hedge lock: open ${hedgeSide} ${hedgeQty} @ ${mark} (ratio ${model.hedgeRatio || 1})`,
		};
	}

	return { action: 'HOLD', pnlPct, note: 'Within risk budget' };
}
