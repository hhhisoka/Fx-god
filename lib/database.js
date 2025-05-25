const fs = require('fs');
const path = require('path');
const config = require('../config');

// Database path
const dbPath = path.join(__dirname, '..', config.database.path);

// Initialize global database
global.db = {
    users: {},
    groups: {},
    settings: {},
    economy: {},
    rpg: {
        items: {},
        monsters: {},
        quests: {},
        shops: {}
    },
    stats: {
        commands: {},
        messages: 0,
        users: 0,
        groups: 0
    }
};

// Default RPG data
const defaultRPGData = {
    items: {
        'wooden_sword': {
            name: 'Wooden Sword',
            type: 'weapon',
            damage: 5,
            price: 100,
            description: 'A basic wooden sword for beginners'
        },
        'iron_sword': {
            name: 'Iron Sword',
            type: 'weapon',
            damage: 15,
            price: 500,
            description: 'A sturdy iron sword'
        },
        'steel_sword': {
            name: 'Steel Sword',
            type: 'weapon',
            damage: 25,
            price: 1500,
            description: 'A sharp steel sword'
        },
        'health_potion': {
            name: 'Health Potion',
            type: 'consumable',
            heal: 50,
            price: 50,
            description: 'Restores 50 HP'
        },
        'mana_potion': {
            name: 'Mana Potion',
            type: 'consumable',
            mana: 30,
            price: 40,
            description: 'Restores 30 MP'
        },
        'leather_armor': {
            name: 'Leather Armor',
            type: 'armor',
            defense: 5,
            price: 200,
            description: 'Basic leather protection'
        },
        'iron_armor': {
            name: 'Iron Armor',
            type: 'armor',
            defense: 15,
            price: 800,
            description: 'Strong iron protection'
        }
    },
    monsters: {
        'goblin': {
            name: 'Goblin',
            level: 1,
            health: 30,
            damage: 8,
            defense: 2,
            exp: 25,
            coins: 15,
            drops: ['health_potion']
        },
        'orc': {
            name: 'Orc',
            level: 5,
            health: 80,
            damage: 20,
            defense: 8,
            exp: 75,
            coins: 50,
            drops: ['iron_sword', 'health_potion']
        },
        'dragon': {
            name: 'Dragon',
            level: 20,
            health: 500,
            damage: 100,
            defense: 50,
            exp: 1000,
            coins: 500,
            drops: ['steel_sword', 'iron_armor']
        }
    },
    quests: {
        'first_steps': {
            name: 'First Steps',
            description: 'Kill 5 goblins',
            type: 'kill',
            target: 'goblin',
            amount: 5,
            reward: {
                exp: 100,
                coins: 200,
                items: ['wooden_sword']
            }
        },
        'goblin_slayer': {
            name: 'Goblin Slayer',
            description: 'Kill 10 goblins',
            type: 'kill',
            target: 'goblin',
            amount: 10,
            requirement: 'first_steps',
            reward: {
                exp: 250,
                coins: 500,
                items: ['iron_sword']
            }
        }
    }
};

// Load database from file
function loadDatabase() {
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            const parsedData = JSON.parse(data);
            
            // Merge with default structure
            global.db = {
                users: parsedData.users || {},
                groups: parsedData.groups || {},
                settings: parsedData.settings || {},
                economy: parsedData.economy || {},
                rpg: {
                    ...defaultRPGData,
                    ...parsedData.rpg
                },
                stats: {
                    commands: {},
                    messages: 0,
                    users: 0,
                    groups: 0,
                    ...parsedData.stats
                }
            };
            
            console.log('📊 Database loaded successfully');
        } else {
            // Initialize with default data
            global.db.rpg = defaultRPGData;
            saveDatabase();
            console.log('📊 New database created');
        }
    } catch (error) {
        console.error('❌ Error loading database:', error);
        global.db.rpg = defaultRPGData;
    }
}

// Save database to file
function saveDatabase() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
        console.log('💾 Database saved');
    } catch (error) {
        console.error('❌ Error saving database:', error);
    }
}

// Auto-save database periodically
if (config.database.autoSave) {
    setInterval(() => {
        saveDatabase();
    }, config.database.saveInterval);
}

// User management functions
function getUser(userId) {
    if (!global.db.users[userId]) {
        global.db.users[userId] = {
            name: 'User',
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
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            quests: [],
            achievements: [],
            stats: {
                monstersKilled: {},
                questsCompleted: 0,
                battlesWon: 0,
                battlesLost: 0,
                itemsUsed: 0,
                coinsSpent: 0,
                coinsEarned: 0
            },
            lastDaily: 0,
            lastWork: 0,
            lastAdventure: 0,
            lastBattle: 0,
            registered: false,
            banned: false,
            premium: false,
            premiumTime: 0,
            warnings: 0,
            joinedAt: Date.now()
        };
    }
    return global.db.users[userId];
}

function updateUser(userId, data) {
    const user = getUser(userId);
    Object.assign(user, data);
    return user;
}

// Group management functions
function getGroup(groupId) {
    if (!global.db.groups[groupId]) {
        global.db.groups[groupId] = {
            name: 'Group',
            desc: '',
            welcome: true,
            antilink: false,
            antispam: false,
            mute: false,
            nsfw: false,
            economy: true,
            rpg: true,
            warnings: {},
            settings: {},
            createdAt: Date.now()
        };
    }
    return global.db.groups[groupId];
}

function updateGroup(groupId, data) {
    const group = getGroup(groupId);
    Object.assign(group, data);
    return group;
}

// RPG functions
function addItem(userId, itemId, quantity = 1) {
    const user = getUser(userId);
    const existingItem = user.inventory.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        user.inventory.push({ id: itemId, quantity });
    }
}

function removeItem(userId, itemId, quantity = 1) {
    const user = getUser(userId);
    const itemIndex = user.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return false;
    
    user.inventory[itemIndex].quantity -= quantity;
    if (user.inventory[itemIndex].quantity <= 0) {
        user.inventory.splice(itemIndex, 1);
    }
    
    return true;
}

function hasItem(userId, itemId, quantity = 1) {
    const user = getUser(userId);
    const item = user.inventory.find(item => item.id === itemId);
    return item && item.quantity >= quantity;
}

function addExp(userId, amount) {
    const user = getUser(userId);
    user.exp += amount;
    
    // Check for level up
    const requiredExp = user.level * config.rpg.expPerLevel;
    if (user.exp >= requiredExp && user.level < config.rpg.maxLevel) {
        user.level++;
        user.exp -= requiredExp;
        
        // Level up bonuses
        user.strength += 2;
        user.defense += 2;
        user.agility += 2;
        user.intelligence += 2;
        user.health = 100; // Full heal on level up
        user.mana = 50 + (user.level * 5);
        
        return true; // Level up occurred
    }
    
    return false;
}

function addCoins(userId, amount) {
    const user = getUser(userId);
    user.coins += amount;
    user.stats.coinsEarned += amount;
}

function removeCoins(userId, amount) {
    const user = getUser(userId);
    if (user.coins >= amount) {
        user.coins -= amount;
        user.stats.coinsSpent += amount;
        return true;
    }
    return false;
}

module.exports = {
    loadDatabase,
    saveDatabase,
    getUser,
    updateUser,
    getGroup,
    updateGroup,
    addItem,
    removeItem,
    hasItem,
    addExp,
    addCoins,
    removeCoins
};
