export default {
    command: ['autoreadstatus', 'autoread'],
    description: 'Auto-read WhatsApp status updates',
    example: '.autoreadstatus',
    tags: ['owner'],
    owner: true,
    
    // Auto-trigger function for status updates
    before: async (conn, m) => {
        try {
            // Check if it's a status update
            if (m.key && m.key.remoteJid === 'status@broadcast') {
                // Mark status as read
                await conn.readMessages([m.key]);
                console.log(`📖 Auto-read status from ${m.key.participant || 'unknown'}`);
                return false;
            }
            return false;
        } catch (error) {
            console.error('Error in autoread status:', error);
            return false;
        }
    },

    handler: async (conn, m) => {
        try {
            const currentStatus = global.config.autoReadStatus || false;
            
            return m.reply(`📖 *Lecture Automatique des Statuts*\n\n` +
                `📊 *Statut actuel:* ${currentStatus ? '✅ Activé' : '❌ Désactivé'}\n` +
                `📋 *Description:* Lecture automatique de tous les statuts WhatsApp\n` +
                `🔄 *Fonctionnement:* Le bot lit automatiquement les statuts sans interaction\n\n` +
                `💡 *Avantages:*\n` +
                `• Lecture discrète des statuts\n` +
                `• Pas de notification à l'expéditeur\n` +
                `• Suivi automatique des mises à jour\n\n` +
                `⚙️ *Configuration:* Modifiez config.js pour activer/désactiver`);
        } catch (error) {
            console.error('Error in autoread status command:', error);
            await m.reply('❌ Erreur lors de l\'affichage des informations de lecture automatique !');
        }
    }
};