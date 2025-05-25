const { formatTime, formatNumber, getRuntime } = require('../lib/functions');
const config = require('../config');

module.exports = {
    command: ['menu', 'help', 'commands'],
    description: 'Show bot menu and commands',
    example: '.menu',
    tags: ['main'],
    run: false,

    handler: async (conn, m) => {
        try {
            const user = global.db.users[m.sender];
            const runtime = getRuntime();
            const totalUsers = Object.keys(global.db.users).length;
            const totalGroups = Object.keys(global.db.groups).length;

            let menuText = `
╭─────────────────────╮
│  🤖 *${global.botName}*  │
╰─────────────────────╯

👋 *Hello ${user.name || m.pushName}!*

📊 *Bot Statistics:*
⏰ Runtime: ${formatTime(runtime)}
👥 Users: ${formatNumber(totalUsers)}
🏘️ Groups: ${formatNumber(totalGroups)}
📱 Version: ${global.botVersion}

💫 *Your Profile:*
🆔 Level: ${user.level}
⭐ EXP: ${formatNumber(user.exp)}
💰 Coins: ${formatNumber(user.coins)}
❤️ Health: ${user.health}/100
💙 Mana: ${user.mana}/${50 + (user.level * 5)}
⚡ Energy: ${user.energy}/100

╭─────[ 🎮 *RPG COMMANDS* ]─────
│ 📊 ${config.prefix}profile - View your profile
│ 🗡️ ${config.prefix}adventure - Go on adventure
│ ⚔️ ${config.prefix}battle - Battle monsters
│ 🎒 ${config.prefix}inventory - View inventory
│ 🛒 ${config.prefix}shop - Visit shop
│ 📜 ${config.prefix}quests - View quests
╰──────────────────────────

╭─────[ 🛠️ *UTILITY* ]─────
│ 🏷️ ${config.prefix}sticker - Create sticker
│ 📥 ${config.prefix}download - Download media
│ 🔄 ${config.prefix}convert - Convert files
│ 🔍 ${config.prefix}search - Search anything
│ 🌐 ${config.prefix}translate - Translate text
│ ⛅ ${config.prefix}weather - Check weather
╰──────────────────────────

╭─────[ 🎯 *ENTERTAINMENT* ]─────
│ 😂 ${config.prefix}meme - Random memes
│ 🎮 ${config.prefix}game - Play games
│ 💭 ${config.prefix}quote - Inspirational quotes
│ 🤣 ${config.prefix}joke - Random jokes
│ 🍿 ${config.prefix}anime - Anime info
│ 🎵 ${config.prefix}music - Music search
╰──────────────────────────

╭─────[ 👑 *MODERATION* ]─────
│ 👢 ${config.prefix}kick - Kick member
│ 🔨 ${config.prefix}ban - Ban member
│ ⚠️ ${config.prefix}warn - Warn member
│ 🔇 ${config.prefix}mute - Mute member
│ ⬆️ ${config.prefix}promote - Promote to admin
│ ⬇️ ${config.prefix}demote - Remove admin
╰──────────────────────────

╭─────[ 💰 *ECONOMY* ]─────
│ 💳 ${config.prefix}balance - Check balance
│ 🎁 ${config.prefix}daily - Daily reward
│ 💼 ${config.prefix}work - Work for money
│ 💸 ${config.prefix}transfer - Transfer coins
╰──────────────────────────

╭─────[ 🤖 *AI* ]─────
│ 💬 ${config.prefix}chat - Chat with AI
│ 🖼️ ${config.prefix}imagine - Generate images
╰──────────────────────────

╭─────[ 🎪 *FUN* ]─────
│ 💕 ${config.prefix}love - Love calculator
│ 🎯 ${config.prefix}dare - Truth or dare
│ 🤔 ${config.prefix}truth - Truth questions
│ 🚢 ${config.prefix}ship - Ship users
╰──────────────────────────

╭─────[ ℹ️ *INFO* ]─────
│ 🏓 ${config.prefix}ping - Check ping
│ 🏃 ${config.prefix}speed - Speed test
│ ⏱️ ${config.prefix}runtime - Bot uptime
│ 👨‍💻 ${config.prefix}creator - Creator info
╰──────────────────────────

╭─────[ 🔧 *TOOLS* ]─────
│ 📱 ${config.prefix}qr - Generate QR code
│ 🔗 ${config.prefix}shorturl - Shorten URL
╰──────────────────────────

*💡 Tip:* Use *${config.prefix}help <command>* for detailed info about a command.

*🔗 Links:*
• GitHub: Coming soon...
• Support: Contact owner

*Created with ❤️ by anren*
`.trim();

            await m.reply(menuText);

        } catch (error) {
            console.error('Error in menu command:', error);
            await m.reply('❌ Error displaying menu!');
        }
    }
};
