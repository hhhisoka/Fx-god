const { getUser, getGroup, updateGroup } = require('../lib/database');

module.exports = {
    command: ['warn', 'warning'],
    description: 'Warn a user for inappropriate behavior',
    example: '.warn @user [reason]',
    tags: ['moderation'],
    group: true,
    admin: true,

    handler: async (conn, m) => {
        try {
            let target = null;
            let reason = 'No reason provided';
            
            // Get target from mentions or quoted message
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
                reason = m.text || reason;
            } else if (m.quoted) {
                target = m.quoted.sender;
                reason = m.text || reason;
            } else {
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.warn @user inappropriate behavior`');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I cannot warn myself!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot warn yourself!');
            }

            // Check if target is an owner
            if (global.config.owner.includes(target)) {
                return m.reply('❌ Cannot warn bot owner!');
            }

            try {
                const groupData = getGroup(m.chat);
                const targetUser = getUser(target);
                
                // Initialize warning system
                if (!groupData.warnings) groupData.warnings = {};
                if (!groupData.warnings[target]) groupData.warnings[target] = [];
                
                // Add warning
                const warning = {
                    reason: reason,
                    warnedBy: m.sender,
                    timestamp: Date.now()
                };
                
                groupData.warnings[target].push(warning);
                const warningCount = groupData.warnings[target].length;
                const maxWarnings = global.config.moderation.maxWarnings;

                const userName = conn.getName(target);
                let warnText = `⚠️ *User Warning*\n\n`;
                warnText += `👤 *User:* ${userName}\n`;
                warnText += `📝 *Reason:* ${reason}\n`;
                warnText += `👮 *Warned by:* ${conn.getName(m.sender)}\n`;
                warnText += `⚠️ *Warning:* ${warningCount}/${maxWarnings}\n`;
                warnText += `📅 *Date:* ${new Date().toLocaleString()}\n\n`;

                // Check if user should be kicked/banned
                if (warningCount >= maxWarnings) {
                    try {
                        // Auto-kick user if max warnings reached
                        await conn.groupParticipantsUpdate(m.chat, [target], 'remove');
                        warnText += `🚫 *User has been automatically kicked for reaching maximum warnings!*`;
                        
                        // Clear warnings after kick
                        delete groupData.warnings[target];
                    } catch (kickError) {
                        warnText += `❌ *Failed to auto-kick user. Please remove manually.*`;
                    }
                } else {
                    const remaining = maxWarnings - warningCount;
                    warnText += `💡 *${remaining} more warning(s) until automatic kick.*`;
                }
                
                await m.reply(warnText);
                
                // Also send a private message to the warned user
                try {
                    const privateWarnText = `⚠️ *You have been warned in ${groupData.name}*\n\n` +
                        `📝 *Reason:* ${reason}\n` +
                        `⚠️ *Warning:* ${warningCount}/${maxWarnings}\n` +
                        `💡 *Please follow group rules to avoid further warnings.*`;
                    
                    await conn.sendMessage(target, { text: privateWarnText });
                } catch (privateError) {
                    // Private message failed, ignore
                }
                
                // Log the action
                console.log(`User ${m.sender} warned ${target} in group ${m.chat} for: ${reason}`);

            } catch (error) {
                console.error('Error warning user:', error);
                await m.reply('❌ Failed to warn user!');
            }

        } catch (error) {
            console.error('Error in warn command:', error);
            await m.reply('❌ Error processing warn command!');
        }
    }
};
