const { formatCurrency, formatNumber } = require('../lib/functions');
const { getUser, addCoins, removeCoins } = require('../lib/database');

module.exports = {
    command: ['transfer', 'pay', 'send'],
    description: 'Transfer coins to another user',
    example: '.transfer @user 1000',
    tags: ['economy'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            const args = m.text.split(' ');
            let target = null;
            let amount = 0;

            // Parse command arguments
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
                amount = parseInt(args[0]) || parseInt(args[1]) || 0;
            } else {
                return m.reply('❌ Please mention a user to transfer coins to!\n\n📝 Example: `.transfer @user 1000`');
            }

            // Validate amount
            if (amount <= 0) {
                return m.reply('❌ Please specify a valid amount to transfer!\n\n📝 Example: `.transfer @user 1000`');
            }

            if (amount < 10) {
                return m.reply('❌ Minimum transfer amount is 10 coins!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot transfer coins to yourself!');
            }

            // Check if target user exists and is registered
            const targetUser = getUser(target);
            if (!targetUser.registered) {
                return m.reply('❌ The target user is not registered yet! They need to use `.register <name>` first.');
            }

            // Calculate transfer fee
            const transferFee = Math.ceil(amount * global.config.economy.transferFee);
            const totalCost = amount + transferFee;

            // Check if sender has enough coins
            if (user.coins < totalCost) {
                return m.reply(`❌ Insufficient coins!\n\n💰 *Transfer:* ${formatCurrency(amount)}\n💸 *Fee:* ${formatCurrency(transferFee)} (${(global.config.economy.transferFee * 100).toFixed(1)}%)\n📊 *Total needed:* ${formatCurrency(totalCost)}\n💳 *You have:* ${formatCurrency(user.coins)}\n💸 *Missing:* ${formatCurrency(totalCost - user.coins)}`);
            }

            // Perform transfer
            removeCoins(m.sender, totalCost);
            addCoins(target, amount);

            // Update stats
            user.stats.coinsSpent += totalCost;
            targetUser.stats.coinsEarned += amount;

            // Prepare transfer confirmation
            const senderName = user.name;
            const targetName = targetUser.name;

            let transferText = `💸 *Transfer Successful!*\n\n`;
            transferText += `👤 *From:* ${senderName}\n`;
            transferText += `👤 *To:* ${targetName}\n`;
            transferText += `💰 *Amount:* ${formatCurrency(amount)}\n`;
            transferText += `💸 *Fee:* ${formatCurrency(transferFee)} (${(global.config.economy.transferFee * 100).toFixed(1)}%)\n`;
            transferText += `📊 *Total deducted:* ${formatCurrency(totalCost)}\n\n`;
            transferText += `💳 *Your new balance:* ${formatCurrency(user.coins)}\n`;
            transferText += `💳 *${targetName}'s new balance:* ${formatCurrency(targetUser.coins)}`;

            await m.reply(transferText);

            // Send notification to recipient
            try {
                const notificationText = `💰 *You received a transfer!*\n\n` +
                    `👤 *From:* ${senderName}\n` +
                    `💰 *Amount:* ${formatCurrency(amount)}\n` +
                    `💳 *Your new balance:* ${formatCurrency(targetUser.coins)}\n\n` +
                    `📝 *Note:* Coins were transferred via ${global.botName}`;

                await conn.sendMessage(target, { text: notificationText });
            } catch (notificationError) {
                // Notification failed, but transfer was successful
                console.log('Failed to send transfer notification:', notificationError);
            }

        } catch (error) {
            console.error('Error in transfer command:', error);
            await m.reply('❌ Error processing transfer!');
        }
    }
};
