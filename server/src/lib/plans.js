export const PLANS = {
	FREE: {
		id: 'FREE',
		name: 'Free',
		priceTry: 0,
		days: 0,
		features: ['Paper terminal', 'API keys (encrypted)', 'Portfolio dashboard'],
	},
	PRO: {
		id: 'PRO',
		name: 'Pro',
		priceTry: 1499,
		days: 30,
		features: ['Live bots', 'AI assistant', 'Risk: amortization', 'Shopier billed'],
	},
	ELITE: {
		id: 'ELITE',
		name: 'Elite',
		priceTry: 3499,
		days: 30,
		features: ['Copy-trading', 'Position hedging', 'Priority engine slots', 'All Pro features'],
	},
};

export function licenseActive(user) {
	if (!user) return false;
	if (user.role === 'admin') return true;
	const tier = user.subscriptionTier || 'FREE';
	if (tier === 'FREE') return false;
	if (!user.licenseExpiry) return false;
	return new Date(user.licenseExpiry) > new Date();
}

export function hasTier(user, min = 'PRO') {
	const rank = { FREE: 0, PRO: 1, ELITE: 2 };
	if (!licenseActive(user) && min !== 'FREE') return false;
	return (rank[user.subscriptionTier || 'FREE'] || 0) >= (rank[min] || 0);
}
