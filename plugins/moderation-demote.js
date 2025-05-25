module.exports = {
    command: ['demote', 'unadmin'],
    description: 'Demote an admin to member',
    example: '.demote @user',
    tags: ['moderation'],
    group: true,
    admin: true,
    botAdmin: true,

    handler: async (conn, m) => {
        try {
            let target = null;
            
            // Get target from mentions or quoted message
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (m.quoted) {
                target = m.quoted.sender;
            } else {
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.demote @user`');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I cannot demote myself!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot demote yourself!');
            }

            // Check if target is an owner
            if (global.config.owner.includes(target)) {
                return m.reply('❌ Cannot demote bot owner!');
            }

            try {
                // Get group metadata to check current status
                const groupMetadata = await conn.groupMetadata(m.chat);
                const participant = groupMetadata.participants.find(p => p.id === target);
                
                if (!participant) {
                    return m.reply('❌ User is not in this group!');
                }

                // Check if user is an admin
                if (participant.admin !== 'admin' && participant.admin !== 'superadmin') {
                    return m.reply('❌ User is not an admin!');
                }

                // Check if trying to demote a superadmin (group creator)
                if (participant.admin === 'superadmin') {
                    return m.reply('❌ Cannot demote the group creator!');
                }

                // Demote the user
                await conn.groupParticipantsUpdate(m.chat, [target], 'demote');
                
                const userName = conn.getName(target);
                let demoteText = `📉 *User Demoted*\n\n`;
                demoteText += `👤 *User:* ${userName}\n`;
                demoteText += `📈 *Status:* Admin → Member\n`;
                demoteText += `👮 *Demoted by:* ${conn.getName(m.sender)}\n`;
                demoteText += `📅 *Date:* ${new Date().toLocaleString()}\n\n`;
                demoteText += `ℹ️ User is now a regular member.`;
                
                await m.reply(demoteText);
                
                // Send notification to the demoted user
                try {
                    const privateText = `📉 *Admin Status Removed*\n\n` +
                        `Your admin privileges have been removed from *${groupMetadata.subject}*.\n\n` +
                        `👤 You are now a regular member.\n` +
                        `💡 Contact group admins if you have questions.`;
                    
                    await conn.sendMessage(target, { text: privateText });
                } catch (privateError) {
                    // Private message failed, ignore
                }
                
                // Log the action
                console.log(`User ${m.sender} demoted ${target} from admin in group ${m.chat}`);

            } catch (error) {
                console.error('Error demoting user:', error);
                await m.reply('❌ Failed to demote user! Make sure I have admin privileges and the user is in the group.');
            }

        } catch (error) {
            console.error('Error in demote command:', error);
            await m.reply('❌ Error processing demote command!');
        }
    }
};
