const { formatNumber } = require('../lib/functions');
const { getUser, removeItem, updateUser } = require('../lib/database');

module.exports = {
    command: ['inventory', 'inv', 'bag'],
    description: 'View and manage your inventory',
    example: '.inventory [use|equip] [item]',
    tags: ['rpg'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            
            // Check if user is registered
            if (!user.registered) {
                return m.reply('❌ You need to register first! Use: .register <name>');
            }

            const args = m.text.split(' ');
            const action = args[1]?.toLowerCase();
            const itemName = args.slice(2).join(' ').toLowerCase();

            // Handle actions
            if (action === 'use' && itemName) {
                return await useItem(m, user, itemName);
            } else if (action === 'equip' && itemName) {
                return await equipItem(m, user, itemName);
            }

            // Show inventory
            if (user.inventory.length === 0) {
                return m.reply('🎒 Your inventory is empty!\n\n💡 Go on adventures or visit the shop to get items.');
            }

            let inventoryText = '╭─────[ 🎒 *INVENTORY* ]─────\n';
            
            // Group items by type
            const itemsByType = {
                weapons: [],
                armor: [],
                consumables: [],
                materials: [],
                other: []
            };

            user.inventory.forEach(invItem => {
                const item = global.db.rpg.items[invItem.id];
                if (item) {
                    const category = getItemCategory(item.type);
                    itemsByType[category].push({
                        ...item,
                        id: invItem.id,
                        quantity: invItem.quantity
                    });
                }
            });

            // Display items by category
            Object.entries(itemsByType).forEach(([category, items]) => {
                if (items.length > 0) {
                    const categoryIcon = getCategoryIcon(category);
                    inventoryText += `│\n│ ${categoryIcon} *${category.toUpperCase()}:*\n`;
                    
                    items.forEach(item => {
                        const equipped = isEquipped(user, item.id) ? ' 🔸' : '';
                        inventoryText += `│ • ${item.name} x${item.quantity}${equipped}\n`;
                        
                        if (item.damage) inventoryText += `│   ⚔️ Damage: +${item.damage}\n`;
                        if (item.defense) inventoryText += `│   🛡️ Defense: +${item.defense}\n`;
                        if (item.heal) inventoryText += `│   ❤️ Heals: ${item.heal} HP\n`;
                        if (item.mana) inventoryText += `│   💙 Restores: ${item.mana} MP\n`;
                        if (item.price) inventoryText += `│   💰 Value: ${formatNumber(item.price)} coins\n`;
                    });
                }
            });

            inventoryText += '╰──────────────────────────\n\n';
            inventoryText += '💡 *Usage:*\n';
            inventoryText += `• ${global.prefix}inv use <item> - Use consumable\n`;
            inventoryText += `• ${global.prefix}inv equip <item> - Equip weapon/armor\n`;

            await m.reply(inventoryText);

        } catch (error) {
            console.error('Error in inventory command:', error);
            await m.reply('❌ Error displaying inventory!');
        }
    }
};

async function useItem(m, user, itemName) {
    try {
        // Find item in inventory
        const invItem = user.inventory.find(item => {
            const gameItem = global.db.rpg.items[item.id];
            return gameItem && gameItem.name.toLowerCase().includes(itemName);
        });

        if (!invItem) {
            return m.reply('❌ Item not found in your inventory!');
        }

        const item = global.db.rpg.items[invItem.id];
        
        // Check if item is consumable
        if (item.type !== 'consumable') {
            return m.reply('❌ This item cannot be used! Try equipping it instead.');
        }

        // Use the item
        let resultText = `✅ You used **${item.name}**!\n\n`;
        
        if (item.heal) {
            const healAmount = Math.min(item.heal, 100 - user.health);
            user.health += healAmount;
            resultText += `❤️ Restored ${healAmount} health\n`;
        }
        
        if (item.mana) {
            const maxMana = 50 + (user.level * 5);
            const manaAmount = Math.min(item.mana, maxMana - user.mana);
            user.mana += manaAmount;
            resultText += `💙 Restored ${manaAmount} mana\n`;
        }
        
        if (item.energy) {
            const energyAmount = Math.min(item.energy, 100 - user.energy);
            user.energy += energyAmount;
            resultText += `⚡ Restored ${energyAmount} energy\n`;
        }

        // Remove item from inventory
        removeItem(m.sender, invItem.id, 1);
        user.stats.itemsUsed++;

        resultText += `\n❤️ Health: ${user.health}/100`;
        resultText += `\n💙 Mana: ${user.mana}/${50 + (user.level * 5)}`;
        resultText += `\n⚡ Energy: ${user.energy}/100`;

        await m.reply(resultText);

    } catch (error) {
        console.error('Error using item:', error);
        await m.reply('❌ Error using item!');
    }
}

async function equipItem(m, user, itemName) {
    try {
        // Find item in inventory
        const invItem = user.inventory.find(item => {
            const gameItem = global.db.rpg.items[item.id];
            return gameItem && gameItem.name.toLowerCase().includes(itemName);
        });

        if (!invItem) {
            return m.reply('❌ Item not found in your inventory!');
        }

        const item = global.db.rpg.items[invItem.id];
        
        // Check if item is equippable
        if (!['weapon', 'armor', 'accessory'].includes(item.type)) {
            return m.reply('❌ This item cannot be equipped!');
        }

        // Unequip current item of the same type
        if (user.equipment[item.type]) {
            const currentItem = global.db.rpg.items[user.equipment[item.type]];
            await m.reply(`🔄 Unequipped **${currentItem?.name || 'Unknown'}**`);
        }

        // Equip new item
        user.equipment[item.type] = invItem.id;
        
        let resultText = `✅ Equipped **${item.name}**!\n\n`;
        
        if (item.damage) resultText += `⚔️ Attack increased by ${item.damage}\n`;
        if (item.defense) resultText += `🛡️ Defense increased by ${item.defense}\n`;
        if (item.agility) resultText += `💨 Agility increased by ${item.agility}\n`;
        if (item.intelligence) resultText += `🧠 Intelligence increased by ${item.intelligence}\n`;

        await m.reply(resultText);

    } catch (error) {
        console.error('Error equipping item:', error);
        await m.reply('❌ Error equipping item!');
    }
}

function getItemCategory(type) {
    switch (type) {
        case 'weapon': return 'weapons';
        case 'armor': return 'armor';
        case 'consumable': return 'consumables';
        case 'material': return 'materials';
        default: return 'other';
    }
}

function getCategoryIcon(category) {
    const icons = {
        weapons: '⚔️',
        armor: '🛡️',
        consumables: '💊',
        materials: '🔮',
        other: '📦'
    };
    return icons[category] || '📦';
}

function isEquipped(user, itemId) {
    return Object.values(user.equipment).includes(itemId);
}
