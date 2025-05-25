const makeWASocket = require('@whiskeysockets/baileys').default;
const { 
    default: useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    proto,
    getContentType
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { loadDatabase, saveDatabase } = require('./lib/database');
const { serialize } = require('./lib/serialize');
const { startConnection } = require('./lib/connection');

// Global variables
global.db = {};
global.conn = null;
global.plugins = {};
global.config = config;

// Bot information
global.botName = 'anren/FX-GOD';
global.botVersion = '1.0.0';
global.prefix = config.prefix;
global.owner = config.owner;

// Store functionality disabled for initial setup

// Load all plugins
function loadPlugins() {
    const pluginDir = path.join(__dirname, 'plugins');
    const pluginFiles = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
    
    console.log(`📦 Loading ${pluginFiles.length} plugins...`);
    
    for (const file of pluginFiles) {
        try {
            delete require.cache[require.resolve(path.join(pluginDir, file))];
            const plugin = require(path.join(pluginDir, file));
            const pluginName = file.replace('.js', '');
            global.plugins[pluginName] = plugin;
            console.log(`✅ Loaded plugin: ${pluginName}`);
        } catch (error) {
            console.error(`❌ Error loading plugin ${file}:`, error);
        }
    }
}

// Handle incoming messages
async function handleMessage(conn, m) {
    try {
        // Serialize message
        m = serialize(conn, m);
        if (!m) return;

        // Load user data
        if (!global.db.users) global.db.users = {};
        if (!global.db.users[m.sender]) {
            global.db.users[m.sender] = {
                name: m.pushName || 'User',
                exp: 0,
                level: 1,
                coins: 1000,
                health: 100,
                mana: 50,
                energy: 100,
                strength: 10,
                defense: 10,
                agility: 10,
                intelligence: 10,
                inventory: [],
                quests: [],
                achievements: [],
                lastDaily: 0,
                lastWork: 0,
                lastAdventure: 0,
                registered: false,
                banned: false,
                premium: false,
                premiumTime: 0
            };
        }

        // Load group data if in group
        if (m.isGroup) {
            if (!global.db.groups) global.db.groups = {};
            if (!global.db.groups[m.chat]) {
                global.db.groups[m.chat] = {
                    name: (await conn.groupMetadata(m.chat)).subject,
                    desc: (await conn.groupMetadata(m.chat)).desc || '',
                    welcome: true,
                    antilink: false,
                    antispam: false,
                    mute: false,
                    nsfw: false,
                    economy: true,
                    rpg: true,
                    warnings: {}
                };
            }
        }

        // Process plugins
        for (const [name, plugin] of Object.entries(global.plugins)) {
            if (!plugin.command || !plugin.handler) continue;
            
            try {
                // Check if message matches plugin command
                const isCommand = plugin.command.some(cmd => {
                    if (typeof cmd === 'string') {
                        return m.body.toLowerCase().startsWith(global.prefix + cmd.toLowerCase());
                    } else if (cmd instanceof RegExp) {
                        return cmd.test(m.body);
                    }
                    return false;
                });

                if (isCommand) {
                    // Check permissions
                    if (plugin.owner && !global.owner.includes(m.sender)) continue;
                    if (plugin.group && !m.isGroup) continue;
                    if (plugin.private && m.isGroup) continue;
                    if (plugin.admin && m.isGroup && !m.isAdmin) continue;
                    if (plugin.botAdmin && m.isGroup && !m.isBotAdmin) continue;
                    if (plugin.premium && !global.db.users[m.sender].premium) continue;

                    // Execute plugin
                    await plugin.handler(conn, m, { args: m.args, text: m.text, command: m.command });
                    break;
                }
            } catch (error) {
                console.error(`Error in plugin ${name}:`, error);
                await m.reply(`❌ Error executing command: ${error.message}`);
            }
        }

        // Save database periodically
        if (Math.random() < 0.1) { // 10% chance to save
            saveDatabase();
        }

    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Main connection function
async function startBot() {
    try {
        console.log(`🚀 Starting ${global.botName} v${global.botVersion}...`);
        
        // Load database
        loadDatabase();
        console.log('📊 Database loaded');
        
        // Load plugins
        loadPlugins();
        
        // Start connection
        const conn = await startConnection();
        global.conn = conn;
        
        // Set up event handlers
        conn.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                for (const message of chatUpdate.messages) {
                    await handleMessage(conn, message);
                }
            } catch (error) {
                console.error('Error processing messages:', error);
            }
        });

        conn.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
                
                if (shouldReconnect) {
                    startBot();
                }
            } else if (connection === 'open') {
                console.log('✅ Bot connected successfully!');
                console.log(`📱 Bot Name: ${global.botName}`);
                console.log(`🔧 Loaded ${Object.keys(global.plugins).length} plugins`);
                console.log(`👑 Owner: ${global.owner.join(', ')}`);
            }
        });

        conn.ev.on('creds.update', () => {
            // Credentials updated, will be saved automatically by Bailey
        });

        // Handle group events
        conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
            try {
                const groupData = global.db.groups?.[id];
                if (!groupData || !groupData.welcome) return;

                for (const participant of participants) {
                    if (action === 'add') {
                        const metadata = await conn.groupMetadata(id);
                        const welcomeText = `👋 Welcome to *${metadata.subject}*!\n\n` +
                                         `🤖 I'm ${global.botName}, your assistant bot.\n` +
                                         `📝 Type *${global.prefix}menu* to see available commands.\n` +
                                         `🎮 Join the RPG adventure with *${global.prefix}profile*!`;
                        
                        await conn.sendMessage(id, { text: welcomeText }, { quoted: null });
                    }
                }
            } catch (error) {
                console.error('Error handling group event:', error);
            }
        });

        // Store management disabled for initial setup

        return conn;
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    saveDatabase();
    process.exit(0);
});

// Start the bot
startBot();
