import { getGroup, updateGroup } from '../lib/database.js';

export default {
    command: ['antilink'],
    description: 'Auto-delete messages containing links',
    example: 'Auto-trigger when links are detected',
    tags: ['group'],
    group: true,
    
    // Auto-trigger function for link detection
    before: async (conn, m) => {
        if (!m.isGroup) return;
        
        const groupData = getGroup(m.chat);
        if (!groupData.antilink) return;
        
        // Check if message contains links
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
        const hasLink = linkRegex.test(m.text || '');
        
        if (hasLink && !m.isAdmin && !m.isOwner) {
            try {
                // Delete the message
                await conn.sendMessage(m.chat, { delete: m.key });
                
                // Send warning
                const warningText = `🚫 *Lien détecté !*\n\n` +
                    `👤 *Utilisateur:* @${m.sender.split('@')[0]}\n` +
                    `⚠️ *Action:* Message supprimé\n\n` +
                    `📋 *Raison:* Les liens ne sont pas autorisés dans ce groupe\n` +
                    `💡 *Info:* Contactez un administrateur pour plus d'informations`;
                
                await conn.sendMessage(m.chat, { 
                    text: warningText,
                    mentions: [m.sender]
                });
                
                console.log(`🚫 Link deleted from ${m.sender} in group ${m.chat}`);
                return true; // Stop further processing
                
            } catch (error) {
                console.error('Error in antilink:', error);
            }
        }
        
        return false;
    },

    handler: async (conn, m) => {
        try {
            return m.reply(`🔗 *Système Anti-Link*\n\n` +
                `📋 *Description:* Protection automatique contre les liens\n` +
                `⚙️ *Configuration:* Utilisez \`.gsettings antilink on/off\`\n` +
                `🛡️ *Protection:* Messages avec liens supprimés automatiquement\n` +
                `👑 *Exemption:* Administrateurs et propriétaire du bot\n\n` +
                `💡 *Types de liens détectés:*\n` +
                `• Liens HTTP/HTTPS\n` +
                `• Liens WWW\n` +
                `• Domaines avec extensions\n` +
                `• Liens WhatsApp\n` +
                `• Liens de réseaux sociaux`);
        } catch (error) {
            console.error('Error in antilink command:', error);
            await m.reply('❌ Erreur lors de l\'affichage des informations anti-link !');
        }
    }
};