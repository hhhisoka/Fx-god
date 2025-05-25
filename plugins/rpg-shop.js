const { formatNumber, canAfford } = require('../lib/functions');
const { getUser, removeCoins, addItem, hasItem } = require('../lib/database');

module.exports = {
    command: ['shop', 'store', 'buy', 'sell'],
    description: 'Visit the shop to buy and sell items',
    example: '.shop [buy|sell] [item] [quantity]',
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
            const itemName = args.slice(2, -1).join(' ').toLowerCase() || args[2]?.toLowerCase();
            const quantity = parseInt(args[args.length - 1]) || 1;

            if (action === 'buy' && itemName) {
                return await buyItem(m, user, itemName, quantity);
            } else if (action === 'sell' && itemName) {
                return await sellItem(m, user, itemName, quantity);
            }

            // Show shop
            await showShop(m, user);

        } catch (error) {
            console.error('Error in shop command:', error);
            await m.reply('❌ Error accessing shop!');
        }
    }
};

async function showShop(m, user) {
    try {
        let shopText = `
╭─────[ 🛒 *ITEM SHOP* ]─────
│ 💰 Your coins: ${formatNumber(user.coins)}
│ 
│ 🛍️ Welcome to the RPG Shop!
│ Buy items to help in your adventures.
╰──────────────────────────

╭─────[ ⚔️ *WEAPONS* ]─────`;

        // Weapons
        const weapons = Object.entries(global.db.rpg.items).filter(([id, item]) => item.type === 'weapon');
        weapons.forEach(([id, item]) => {
            const canBuy = user.coins >= item.price ? '✅' : '❌';
            shopText += `\n│ ${canBuy} **${item.name}**`;
            shopText += `\n│   💰 ${formatNumber(item.price)} coins`;
            shopText += `\n│   ⚔️ Damage: +${item.damage}`;
            shopText += `\n│   📝 ${item.description}`;
            shopText += `\n│`;
        });

        shopText += '\n╰──────────────────────────';
        shopText += '\n\n╭─────[ 🛡️ *ARMOR* ]─────';

        // Armor
        const armor = Object.entries(global.db.rpg.items).filter(([id, item]) => item.type === 'armor');
        armor.forEach(([id, item]) => {
            const canBuy = user.coins >= item.price ? '✅' : '❌';
            shopText += `\n│ ${canBuy} **${item.name}**`;
            shopText += `\n│   💰 ${formatNumber(item.price)} coins`;
            shopText += `\n│   🛡️ Defense: +${item.defense}`;
            shopText += `\n│   📝 ${item.description}`;
            shopText += `\n│`;
        });

        shopText += '\n╰──────────────────────────';
        shopText += '\n\n╭─────[ 💊 *CONSUMABLES* ]─────';

        // Consumables
        const consumables = Object.entries(global.db.rpg.items).filter(([id, item]) => item.type === 'consumable');
        consumables.forEach(([id, item]) => {
            const canBuy = user.coins >= item.price ? '✅' : '❌';
            shopText += `\n│ ${canBuy} **${item.name}**`;
            shopText += `\n│   💰 ${formatNumber(item.price)} coins`;
            if (item.heal) shopText += `\n│   ❤️ Heals: ${item.heal} HP`;
            if (item.mana) shopText += `\n│   💙 Restores: ${item.mana} MP`;
            shopText += `\n│   📝 ${item.description}`;
            shopText += `\n│`;
        });

        shopText += '\n╰──────────────────────────';
        shopText += '\n\n💡 **Usage:**';
        shopText += `\n• ${global.prefix}shop buy <item> [qty] - Buy item`;
        shopText += `\n• ${global.prefix}shop sell <item> [qty] - Sell item`;
        shopText += `\n• ${global.prefix}inventory - View your items`;

        await m.reply(shopText);

    } catch (error) {
        console.error('Error showing shop:', error);
        await m.reply('❌ Error displaying shop!');
    }
}

async function buyItem(m, user, itemName, quantity) {
    try {
        // Find item in shop
        const foundItem = Object.entries(global.db.rpg.items).find(([id, item]) => {
            return item.name.toLowerCase().includes(itemName) && item.price;
        });

        if (!foundItem) {
            return m.reply('❌ Item not found in shop!\n\n💡 Use `.shop` to see available items.');
        }

        const [itemId, item] = foundItem;
        const totalPrice = item.price * quantity;

        // Check if user can afford
        if (user.coins < totalPrice) {
            return m.reply(`❌ Not enough coins!\n\n💰 Need: ${formatNumber(totalPrice)} coins\n💳 You have: ${formatNumber(user.coins)} coins\n💸 Missing: ${formatNumber(totalPrice - user.coins)} coins`);
        }

        // Check quantity
        if (quantity < 1 || quantity > 99) {
            return m.reply('❌ Invalid quantity! Must be between 1 and 99.');
        }

        // Process purchase
        removeCoins(m.sender, totalPrice);
        addItem(m.sender, itemId, quantity);

        let resultText = `✅ **Purchase Successful!**\n\n`;
        resultText += `🛍️ Bought: **${item.name}** x${quantity}\n`;
        resultText += `💰 Cost: ${formatNumber(totalPrice)} coins\n`;
        resultText += `💳 Remaining: ${formatNumber(user.coins)} coins\n\n`;
        
        if (item.type === 'weapon' || item.type === 'armor') {
            resultText += `💡 Don't forget to equip your new ${item.type}!\n`;
            resultText += `Use: \`.inventory equip ${item.name}\``;
        } else if (item.type === 'consumable') {
            resultText += `💡 Use this item when needed!\n`;
            resultText += `Use: \`.inventory use ${item.name}\``;
        }

        await m.reply(resultText);

    } catch (error) {
        console.error('Error buying item:', error);
        await m.reply('❌ Error processing purchase!');
    }
}

async function sellItem(m, user, itemName, quantity) {
    try {
        // Find item in inventory
        const invItem = user.inventory.find(item => {
            const gameItem = global.db.rpg.items[item.id];
            return gameItem && gameItem.name.toLowerCase().includes(itemName);
        });

        if (!invItem) {
            return m.reply('❌ Item not found in your inventory!\n\n💡 Use `.inventory` to see your items.');
        }

        const item = global.db.rpg.items[invItem.id];
        
        // Check if item has sell price
        if (!item.price) {
            return m.reply('❌ This item cannot be sold!');
        }

        // Check quantity
        if (quantity > invItem.quantity) {
            return m.reply(`❌ You only have ${invItem.quantity} of this item!`);
        }

        if (quantity < 1) {
            return m.reply('❌ Invalid quantity! Must be at least 1.');
        }

        // Calculate sell price (50% of buy price)
        const sellPrice = Math.floor(item.price * 0.5);
        const totalEarnings = sellPrice * quantity;

        // Check if item is equipped
        const isEquipped = Object.values(user.equipment).includes(invItem.id);
        if (isEquipped && invItem.quantity === quantity) {
            return m.reply(`❌ You cannot sell your equipped ${item.name}!\n\n💡 Unequip it first or buy a replacement.`);
        }

        // Process sale
        const { removeItem } = require('../lib/database');
        removeItem(m.sender, invItem.id, quantity);
        user.coins += totalEarnings;
        user.stats.coinsEarned += totalEarnings;

        let resultText = `✅ **Sale Successful!**\n\n`;
        resultText += `💸 Sold: **${item.name}** x${quantity}\n`;
        resultText += `💰 Earned: ${formatNumber(totalEarnings)} coins\n`;
        resultText += `💳 Total: ${formatNumber(user.coins)} coins`;

        await m.reply(resultText);

    } catch (error) {
        console.error('Error selling item:', error);
        await m.reply('❌ Error processing sale!');
    }
}
