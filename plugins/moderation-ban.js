const { getUser, getGroup, updateGroup } = require('../lib/database');

module.exports = {
    command: ['ban', 'block'],
    description: 'Ban a user from using bot commands',
    example: '.ban @user [reason]',
    tags: ['moderation'],
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
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.ban @user spamming`');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I cannot ban myself!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot ban yourself!');
            }

            // Check if target is an owner
            if (global.config.owner.includes(target)) {
                return m.reply('❌ Cannot ban bot owner!');
            }

            // Check if target is already banned
            const targetUser = getUser(target);
            if (targetUser.banned) {
                return m.reply('❌ User is already banned!');
            }

            try {
                // Ban the user
                targetUser.banned = true;
                targetUser.banReason = reason;
                targetUser.bannedBy = m.sender;
                targetUser.bannedAt = Date.now();

                // If in group, also add to group ban list
                if (m.isGroup) {
                    const groupData = getGroup(m.chat);
                    if (!groupData.bannedUsers) groupData.bannedUsers = [];
                    if (!groupData.bannedUsers.includes(target)) {
                        groupData.bannedUsers.push(target);
                    }
                }

                const userName = conn.getName(target);
                let banText = `🚫 *User Banned*\n\n`;
                banText += `👤 *User:* ${userName}\n`;
                banText += `📝 *Reason:* ${reason}\n`;
                banText += `👮 *Banned by:* ${conn.getName(m.sender)}\n`;
                banText += `📅 *Date:* ${new Date().toLocaleString()}\n\n`;
                banText += `⚠️ This user can no longer use bot commands.`;
                
                await m.reply(banText);
                
                // Log the action
                console.log(`User ${m.sender} banned ${target} for: ${reason}`);

            } catch (error) {
                console.error('Error banning user:', error);
                await m.reply('❌ Failed to ban user!');
            }

        } catch (error) {
            console.error('Error in ban command:', error);
            await m.reply('❌ Error processing ban command!');
        }
    }
};
