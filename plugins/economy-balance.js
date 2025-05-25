const { formatNumber, formatCurrency } = require('../lib/functions');
const { getUser } = require('../lib/database');

module.exports = {
    command: ['balance', 'bal', 'money', 'coins'],
    description: 'Check your coin balance',
    example: '.balance [@user]',
    tags: ['economy'],

    handler: async (conn, m) => {
        try {
            // Determine target user
            let target = m.sender;
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            }

            const user = getUser(target);
            const isOwnBalance = target === m.sender;

            // Check if user is registered
            if (!user.registered) {
                if (isOwnBalance) {
                    return m.reply('❌ You need to register first! Use: .register <name>');
                } else {
                    return m.reply('❌ That user is not registered yet!');
                }
            }

            const userName = isOwnBalance ? 'Your' : `${user.name}'s`;
            
            let balanceText = `💰 *${userName} Balance*\n\n`;
            balanceText += `💳 *Coins:* ${formatCurrency(user.coins)}\n`;
            balanceText += `🆔 *Level:* ${user.level}\n`;
            balanceText += `⭐ *EXP:* ${formatNumber(user.exp)}\n\n`;
            
            // Show recent transactions or earning suggestions
            if (isOwnBalance) {
                balanceText += `💡 *Earn more coins:*\n`;
                balanceText += `🎁 \`.daily\` - Daily reward\n`;
                balanceText += `💼 \`.work\` - Work for coins\n`;
                balanceText += `🎮 \`.game\` - Play games\n`;
                balanceText += `🏕️ \`.adventure\` - Go on adventures\n`;
                balanceText += `⚔️ \`.battle\` - Battle monsters\n\n`;
                
                balanceText += `💸 *Spend coins:*\n`;
                balanceText += `🛒 \`.shop\` - Buy items\n`;
                balanceText += `💱 \`.transfer\` - Send to friends`;
            }

            await m.reply(balanceText);

        } catch (error) {
            console.error('Error in balance command:', error);
            await m.reply('❌ Error checking balance!');
        }
    }
};
