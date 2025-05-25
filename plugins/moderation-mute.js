const { getGroup, updateGroup } = require('../lib/database');

module.exports = {
    command: ['mute', 'silence'],
    description: 'Mute a user temporarily',
    example: '.mute @user [duration_minutes] [reason]',
    tags: ['moderation'],
    group: true,
    admin: true,

    handler: async (conn, m) => {
        try {
            let target = null;
            let duration = 60; // Default 60 minutes
            let reason = 'No reason provided';
            
            const args = m.text.split(' ');
            
            // Get target from mentions or quoted message
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
                if (args[0] && !isNaN(args[0])) {
                    duration = parseInt(args[0]);
                    reason = args.slice(1).join(' ') || reason;
                } else {
                    reason = args.join(' ') || reason;
                }
            } else if (m.quoted) {
                target = m.quoted.sender;
                if (args[0] && !isNaN(args[0])) {
                    duration = parseInt(args[0]);
                    reason = args.slice(1).join(' ') || reason;
                } else {
                    reason = args.join(' ') || reason;
                }
            } else {
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.mute @user 30 spamming`\n⏱️ Duration in minutes (default: 60)');
            }

            // Validate duration
            if (duration < 1 || duration > 1440) { // Max 24 hours
                return m.reply('❌ Invalid duration! Must be between 1 and 1440 minutes (24 hours).');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I cannot mute myself!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot mute yourself!');
            }

            // Check if target is an owner
            if (global.config.owner.includes(target)) {
                return m.reply('❌ Cannot mute bot owner!');
            }

            try {
                const groupData = getGroup(m.chat);
                
                // Initialize mute system
                if (!groupData.mutedUsers) groupData.mutedUsers = {};
                
                // Calculate mute end time
                const muteEnd = Date.now() + (duration * 60 * 1000);
                
                // Add to muted list
                groupData.mutedUsers[target] = {
                    mutedBy: m.sender,
                    reason: reason,
                    muteStart: Date.now(),
                    muteEnd: muteEnd,
                    duration: duration
                };

                const userName = conn.getName(target);
                const endTime = new Date(muteEnd).toLocaleString();
                
                let muteText = `🔇 *User Muted*\n\n`;
                muteText += `👤 *User:* ${userName}\n`;
                muteText += `📝 *Reason:* ${reason}\n`;
                muteText += `👮 *Muted by:* ${conn.getName(m.sender)}\n`;
                muteText += `⏱️ *Duration:* ${duration} minutes\n`;
                muteText += `📅 *Until:* ${endTime}\n\n`;
                muteText += `🔇 This user cannot send messages until the mute expires.`;
                
                await m.reply(muteText);
                
                // Set auto-unmute timer
                setTimeout(() => {
                    try {
                        if (groupData.mutedUsers && groupData.mutedUsers[target]) {
                            delete groupData.mutedUsers[target];
                            conn.sendMessage(m.chat, { 
                                text: `🔊 ${userName} has been automatically unmuted.` 
                            });
                        }
                    } catch (error) {
                        console.error('Error auto-unmuting user:', error);
                    }
                }, duration * 60 * 1000);
                
                // Log the action
                console.log(`User ${m.sender} muted ${target} for ${duration} minutes in group ${m.chat}`);

            } catch (error) {
                console.error('Error muting user:', error);
                await m.reply('❌ Failed to mute user!');
            }

        } catch (error) {
            console.error('Error in mute command:', error);
            await m.reply('❌ Error processing mute command!');
        }
    }
};
