module.exports = {
    command: ['promote', 'admin'],
    description: 'Promote a member to admin',
    example: '.promote @user',
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
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.promote @user`');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I am already an admin!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot promote yourself!');
            }

            try {
                // Get group metadata to check current status
                const groupMetadata = await conn.groupMetadata(m.chat);
                const participant = groupMetadata.participants.find(p => p.id === target);
                
                if (!participant) {
                    return m.reply('❌ User is not in this group!');
                }

                // Check if user is already an admin
                if (participant.admin === 'admin' || participant.admin === 'superadmin') {
                    return m.reply('❌ User is already an admin!');
                }

                // Promote the user
                await conn.groupParticipantsUpdate(m.chat, [target], 'promote');
                
                const userName = conn.getName(target);
                let promoteText = `👑 *User Promoted*\n\n`;
                promoteText += `👤 *User:* ${userName}\n`;
                promoteText += `📈 *Status:* Member → Admin\n`;
                promoteText += `👮 *Promoted by:* ${conn.getName(m.sender)}\n`;
                promoteText += `📅 *Date:* ${new Date().toLocaleString()}\n\n`;
                promoteText += `🎉 Congratulations on becoming an admin!`;
                
                await m.reply(promoteText);
                
                // Send congratulatory message to the promoted user
                try {
                    const privateText = `🎉 *Congratulations!*\n\n` +
                        `You have been promoted to admin in *${groupMetadata.subject}*!\n\n` +
                        `👑 Use your admin powers responsibly.\n` +
                        `📋 Type \`.help\` to see moderation commands.`;
                    
                    await conn.sendMessage(target, { text: privateText });
                } catch (privateError) {
                    // Private message failed, ignore
                }
                
                // Log the action
                console.log(`User ${m.sender} promoted ${target} to admin in group ${m.chat}`);

            } catch (error) {
                console.error('Error promoting user:', error);
                await m.reply('❌ Failed to promote user! Make sure I have admin privileges and the user is in the group.');
            }

        } catch (error) {
            console.error('Error in promote command:', error);
            await m.reply('❌ Error processing promote command!');
        }
    }
};
