export default {
    command: ['alwaysonline', 'online'],
    description: 'Keep bot always online or offline',
    example: '.alwaysonline',
    tags: ['owner'],
    owner: true,
    
    // Auto-trigger function to maintain online status
    before: async (conn, m) => {
        try {
            if (global.config.alwaysOnline) {
                // Update presence to online
                await conn.sendPresenceUpdate('available', m.chat);
            } else if (global.config.alwaysOffline) {
                // Update presence to offline
                await conn.sendPresenceUpdate('unavailable', m.chat);
            }
            return false;
        } catch (error) {
            console.error('Error in always online/offline:', error);
            return false;
        }
    },

    handler: async (conn, m) => {
        try {
            const args = m.text.split(' ');
            const action = args[0]?.toLowerCase();
            
            if (!action) {
                const onlineStatus = global.config.alwaysOnline ? '✅ Activé' : '❌ Désactivé';
                const offlineStatus = global.config.alwaysOffline ? '✅ Activé' : '❌ Désactivé';
                
                return m.reply(`🟢 *Gestion du Statut de Présence*\n\n` +
                    `📊 *Statut Actuel:*\n` +
                    `🟢 Toujours en ligne: ${onlineStatus}\n` +
                    `🔴 Toujours hors ligne: ${offlineStatus}\n\n` +
                    `🛠️ *Commandes:*\n` +
                    `• \`.alwaysonline on\` - Toujours en ligne\n` +
                    `• \`.alwaysonline off\` - Mode normal\n` +
                    `• \`.alwaysonline offline\` - Toujours hors ligne\n\n` +
                    `💡 *Info:* Ces paramètres affectent votre visibilité sur WhatsApp`);
            }
            
            switch (action) {
                case 'on':
                case 'enable':
                    global.config.alwaysOnline = true;
                    global.config.alwaysOffline = false;
                    await conn.sendPresenceUpdate('available');
                    return m.reply('🟢 Mode "Toujours en ligne" activé !\n\n✅ Le bot apparaîtra toujours comme en ligne sur WhatsApp.');
                    
                case 'off':
                case 'disable':
                    global.config.alwaysOnline = false;
                    global.config.alwaysOffline = false;
                    return m.reply('⚪ Mode présence normale activé !\n\n📱 Le bot utilisera le statut de présence normal.');
                    
                case 'offline':
                    global.config.alwaysOnline = false;
                    global.config.alwaysOffline = true;
                    await conn.sendPresenceUpdate('unavailable');
                    return m.reply('🔴 Mode "Toujours hors ligne" activé !\n\n✅ Le bot apparaîtra toujours comme hors ligne sur WhatsApp.');
                    
                default:
                    return m.reply('❌ Action non reconnue !\n\n📝 Utilisez: on, off, ou offline');
            }
            
        } catch (error) {
            console.error('Error in always online command:', error);
            await m.reply('❌ Erreur lors de la gestion du statut de présence !');
        }
    }
};