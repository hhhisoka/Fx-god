module.exports = {
    // Bot configuration
    botName: 'anren/FX-GOD',
    prefix: '.',
    
    // Owner configuration
    owner: [
        '2250101676111', // Replace with actual owner numbers
    ],
    
    // API Keys (from environment variables)
    apiKeys: {
        openai: process.env.OPENAI_API_KEY || '',
        weather: process.env.WEATHER_API_KEY || '',
        translate: process.env.TRANSLATE_API_KEY || '',
        youtube: process.env.YOUTUBE_API_KEY || '',
        spotify: process.env.SPOTIFY_API_KEY || '',
    },
    
    // Database configuration
    database: {
        path: './database.json',
        autoSave: true,
        saveInterval: 300000 // 5 minutes
    },
    
    // Session configuration
    session: {
        sessionId: process.env.SESSION_ID || 'anren-fx-god',
        path: './session'
    },
    
    // RPG configuration
    rpg: {
        maxLevel: 100,
        expPerLevel: 1000,
        maxEnergy: 100,
        energyRegenRate: 1, // per minute
        maxHealth: 100,
        maxMana: 100,
        adventureCooldown: 300000, // 5 minutes
        battleCooldown: 60000, // 1 minute
        dailyReward: {
            coins: 1000,
            exp: 500
        },
        workReward: {
            min: 100,
            max: 500,
            cooldown: 3600000 // 1 hour
        }
    },
    
    // Economy configuration
    economy: {
        dailyAmount: 1000,
        workMin: 100,
        workMax: 500,
        transferFee: 0.05, // 5%
        bankInterest: 0.01 // 1% daily
    },
    
    // Moderation configuration
    moderation: {
        maxWarnings: 3,
        muteTime: 3600000, // 1 hour
        antispamLimit: 5,
        antispamTime: 10000 // 10 seconds
    },
    
    // Group settings
    groups: {
        defaultWelcome: true,
        defaultAntilink: false,
        defaultAntispam: false,
        defaultEconomy: true,
        defaultRpg: true
    },
    
    // Bot responses
    messages: {
        wait: '⏳ Please wait...',
        error: '❌ An error occurred!',
        success: '✅ Success!',
        notFound: '❌ Not found!',
        noPermission: '❌ You don\'t have permission to use this command!',
        ownerOnly: '❌ This command is only for bot owners!',
        groupOnly: '❌ This command can only be used in groups!',
        privateOnly: '❌ This command can only be used in private chat!',
        adminOnly: '❌ This command is only for group admins!',
        botAdminNeeded: '❌ Bot needs to be admin to use this command!',
        premiumOnly: '❌ This command is only for premium users!',
        registered: '✅ You are now registered!',
        alreadyRegistered: '❌ You are already registered!',
        notRegistered: '❌ You need to register first! Use: .register <name>',
        cooldown: '⏰ Command is on cooldown! Wait {time} more.',
        insufficientCoins: '❌ You don\'t have enough coins!',
        insufficientLevel: '❌ Your level is too low for this action!',
        banned: '❌ You are banned from using this bot!'
    },
    
    // External APIs
    apis: {
        weather: 'https://api.openweathermap.org/data/2.5/weather',
        translate: 'https://api.mymemory.translated.net/get',
        meme: 'https://api.imgflip.com/get_memes',
        joke: 'https://official-joke-api.appspot.com/random_joke',
        quote: 'https://api.quotable.io/random',
        anime: 'https://api.jikan.moe/v4',
        shorturl: 'https://tinyurl.com/api-create.php'
    },
    
    // Bot limits
    limits: {
        downloadSize: 50 * 1024 * 1024, // 50MB
        stickerSize: 10 * 1024 * 1024, // 10MB
        messageLength: 4096,
        captionLength: 1024
    }
};
