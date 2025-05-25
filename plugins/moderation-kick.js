module.exports = {
    command: ['kick', 'remove'],
    description: 'Kick a member from the group',
    example: '.kick @user',
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
                return m.reply('❌ Please mention a user or reply to their message!\n\n📝 Example: `.kick @user`');
            }

            // Check if target is the bot itself
            if (target === conn.user.id) {
                return m.reply('❌ I cannot kick myself!');
            }

            // Check if target is the sender
            if (target === m.sender) {
                return m.reply('❌ You cannot kick yourself! Use `.leave` if you want to exit the group.');
            }

            // Check if target is an owner
            if (global.config.owner.includes(target)) {
                return m.reply('❌ Cannot kick bot owner!');
            }

            try {
                // Get group metadata to check if target is in group
                const groupMetadata = await conn.groupMetadata(m.chat);
                const participant = groupMetadata.participants.find(p => p.id === target);
                
                if (!participant) {
                    return m.reply('❌ User is not in this group!');
                }

                // Check if target is an admin
                if (participant.admin === 'admin' || participant.admin === 'superadmin') {
                    return m.reply('❌ Cannot kick group admins!');
                }

                // Kick the user
                await conn.groupParticipantsUpdate(m.chat, [target], 'remove');
                
                const userName = conn.getName(target);
                await m.reply(`✅ Successfully kicked ${userName} from the group!`);
                
                // Log the action
                console.log(`User ${m.sender} kicked ${target} from group ${m.chat}`);

            } catch (error) {
                console.error('Error kicking user:', error);
                await m.reply('❌ Failed to kick user! Make sure I have admin privileges and the user is in the group.');
            }

        } catch (error) {
            console.error('Error in kick command:', error);
            await m.reply('❌ Error processing kick command!');
        }
    }
};
