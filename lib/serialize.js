const { getContentType, downloadContentFromMessage, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { parseArgs, isOwner, isGroupAdmin, isBotAdmin } = require('./functions');
const config = require('../config');

function serialize(conn, m) {
    if (!m) return null;

    // Basic message properties
    m.conn = conn;
    m.key = m.key || {};
    m.id = m.key.id;
    m.chat = m.key.remoteJid;
    m.sender = m.key.participant || m.key.remoteJid;
    m.fromMe = m.key.fromMe;

    // Message type and content
    m.mtype = getContentType(m.message);
    m.msg = m.message[m.mtype] || {};
    m.body = m.msg.text || m.msg.caption || m.message.conversation || '';
    m.text = m.body;

    // Additional properties
    m.quoted = m.msg.contextInfo?.quotedMessage ? {
        key: {
            id: m.msg.contextInfo.stanzaId,
            remoteJid: m.chat,
            participant: m.msg.contextInfo.participant || m.sender
        },
        message: m.msg.contextInfo.quotedMessage,
        sender: m.msg.contextInfo.participant || m.sender
    } : null;

    // Group information
    m.isGroup = m.chat.endsWith('@g.us');
    m.groupMetadata = null;
    m.groupName = '';
    m.groupDesc = '';
    m.groupMembers = [];
    m.isAdmin = false;
    m.isBotAdmin = false;

    if (m.isGroup) {
        try {
            m.groupMetadata = conn.chats[m.chat] || {};
            m.groupName = m.groupMetadata.subject || '';
            m.groupDesc = m.groupMetadata.desc || '';
            m.groupMembers = m.groupMetadata.participants || [];
            m.isAdmin = isGroupAdmin(m.sender, m.chat, conn);
            m.isBotAdmin = isBotAdmin(m.chat, conn);
        } catch (error) {
            console.error('Error getting group metadata:', error);
        }
    }

    // User information
    m.pushName = m.msg.pushName || conn.getName(m.sender) || 'User';
    m.isOwner = isOwner(m.sender);

    // Command parsing
    if (m.body.startsWith(config.prefix)) {
        const parsed = parseArgs(m.body, config.prefix);
        m.command = parsed.command;
        m.args = parsed.args;
        m.text = parsed.text;
        m.isCommand = true;
    } else {
        m.command = '';
        m.args = [];
        m.isCommand = false;
    }

    // Media handling
    m.isMedia = false;
    m.mediaType = null;
    m.mediaBuffer = null;

    if (m.mtype === 'imageMessage' || m.mtype === 'videoMessage' || 
        m.mtype === 'audioMessage' || m.mtype === 'documentMessage' ||
        m.mtype === 'stickerMessage') {
        m.isMedia = true;
        m.mediaType = m.mtype;
    }

    // Download media function
    m.download = async () => {
        try {
            if (!m.isMedia) return null;
            const buffer = await downloadContentFromMessage(m.msg, m.mtype.replace('Message', ''));
            const chunks = [];
            for await (const chunk of buffer) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    };

    // Reply function
    m.reply = async (text, options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { text }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error replying:', error);
            return null;
        }
    };

    // React function
    m.react = async (emoji) => {
        try {
            return await conn.sendMessage(m.chat, {
                react: {
                    text: emoji,
                    key: m.key
                }
            });
        } catch (error) {
            console.error('Error reacting:', error);
            return null;
        }
    };

    // Delete message function
    m.delete = async () => {
        try {
            return await conn.sendMessage(m.chat, { delete: m.key });
        } catch (error) {
            console.error('Error deleting message:', error);
            return null;
        }
    };

    // Forward message function
    m.forward = async (jid, options = {}) => {
        try {
            return await conn.sendMessage(jid, m.message, { ...options });
        } catch (error) {
            console.error('Error forwarding message:', error);
            return null;
        }
    };

    // Copy message function
    m.copy = () => {
        return generateWAMessageFromContent(m.chat, m.message, {
            userJid: conn.user.id,
            quoted: m.quoted
        });
    };

    // Send media functions
    m.sendImage = async (buffer, caption = '', options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { 
                image: buffer, 
                caption 
            }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error sending image:', error);
            return null;
        }
    };

    m.sendVideo = async (buffer, caption = '', options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { 
                video: buffer, 
                caption 
            }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error sending video:', error);
            return null;
        }
    };

    m.sendAudio = async (buffer, options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mp4' 
            }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error sending audio:', error);
            return null;
        }
    };

    m.sendSticker = async (buffer, options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { 
                sticker: buffer 
            }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error sending sticker:', error);
            return null;
        }
    };

    m.sendDocument = async (buffer, filename, mimetype, options = {}) => {
        try {
            return await conn.sendMessage(m.chat, { 
                document: buffer, 
                fileName: filename, 
                mimetype 
            }, { quoted: m, ...options });
        } catch (error) {
            console.error('Error sending document:', error);
            return null;
        }
    };

    // Mention functions
    m.mentionedJid = m.msg.contextInfo?.mentionedJid || [];
    m.mentions = m.mentionedJid;

    // Check if message mentions someone
    m.isMention = (jid) => {
        return m.mentionedJid.includes(jid);
    };

    // Get mentioned users
    m.getMentions = () => {
        return m.mentionedJid.map(jid => ({
            jid,
            name: conn.getName(jid)
        }));
    };

    return m;
}

module.exports = { serialize };
