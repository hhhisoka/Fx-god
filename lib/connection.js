const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function startConnection() {
    try {
        // Ensure session directory exists
        const sessionPath = path.join(__dirname, '..', config.session.path);
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        // Get latest Baileys version
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🔗 Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        // Load authentication state
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        // Create socket connection
        const conn = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ['anren/FX-GOD', 'Chrome', '1.0.0'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            getMessage: async (key) => {
                return { conversation: 'Hello' };
            },
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: 30000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            emitOwnEvents: true,
            fireInitQueries: true,
            maxMsgRetryCount: 5,
            msgRetryCounterMap: {},
            retryRequestDelayMs: 250,
            userDevicesCache: {},
        });

        // Save credentials on update
        conn.ev.on('creds.update', saveCreds);

        // Handle pairing code
        if (!conn.authState.creds.registered) {
            const phoneNumber = process.env.PHONE_NUMBER;
            if (phoneNumber) {
                setTimeout(async () => {
                    try {
                        const code = await conn.requestPairingCode(phoneNumber);
                        console.log(`🔐 Your pairing code: ${code}`);
                    } catch (error) {
                        console.error('Error requesting pairing code:', error);
                    }
                }, 3000);
            }
        }

        // Connection event handlers
        conn.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                console.log('📱 QR Code generated! Scan with WhatsApp to connect.');
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Connection closed:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(() => {
                        startConnection();
                    }, 5000);
                }
            } else if (connection === 'open') {
                console.log('✅ Successfully connected to WhatsApp!');
                console.log(`📱 Bot Number: ${conn.user.id}`);
                console.log(`👤 Bot Name: ${conn.user.name || config.botName}`);
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...');
            }
        });

        // Message handling
        conn.ev.on('messages.upsert', ({ messages, type }) => {
            if (type !== 'notify') return;
            
            for (const message of messages) {
                if (message.key.fromMe) continue;
                if (!message.message) continue;
                
                // Store message for potential replies
                conn.lastMessages = conn.lastMessages || {};
                conn.lastMessages[message.key.remoteJid] = message;
            }
        });

        // Group participant updates
        conn.ev.on('group-participants.update', ({ id, participants, action }) => {
            console.log(`👥 Group ${id}: ${action} ${participants.length} participant(s)`);
        });

        // Extend conn with custom methods
        conn.getName = (jid) => {
            return conn.contacts[jid]?.name || conn.contacts[jid]?.verifiedName || jid.split('@')[0];
        };

        conn.sendText = async (jid, text, quoted = null) => {
            return await conn.sendMessage(jid, { text }, { quoted });
        };

        conn.sendImage = async (jid, buffer, caption = '', quoted = null) => {
            return await conn.sendMessage(jid, { image: buffer, caption }, { quoted });
        };

        conn.sendVideo = async (jid, buffer, caption = '', quoted = null) => {
            return await conn.sendMessage(jid, { video: buffer, caption }, { quoted });
        };

        conn.sendAudio = async (jid, buffer, quoted = null) => {
            return await conn.sendMessage(jid, { audio: buffer, mimetype: 'audio/mp4' }, { quoted });
        };

        conn.sendSticker = async (jid, buffer, quoted = null) => {
            return await conn.sendMessage(jid, { sticker: buffer }, { quoted });
        };

        conn.sendDocument = async (jid, buffer, filename, mimetype, quoted = null) => {
            return await conn.sendMessage(jid, { 
                document: buffer, 
                fileName: filename, 
                mimetype 
            }, { quoted });
        };

        conn.reply = async (jid, text, quoted = null) => {
            return await conn.sendMessage(jid, { text }, { quoted });
        };

        return conn;

    } catch (error) {
        console.error('❌ Error starting connection:', error);
        throw error;
    }
}

module.exports = { startConnection };
