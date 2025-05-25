const { random, pickRandom } = require('../lib/functions');
const { getUser, addCoins, removeCoins } = require('../lib/database');

module.exports = {
    command: ['game', 'play', 'guess', 'rps'],
    description: 'Play various games',
    example: '.game rps rock',
    tags: ['entertainment'],

    handler: async (conn, m) => {
        try {
            const user = getUser(m.sender);
            const args = m.text.split(' ');
            const gameType = args[0]?.toLowerCase();
            
            if (!gameType) {
                const gameList = `🎮 *Available Games:*\n\n` +
                    `🪨 \`.game rps <choice>\` - Rock Paper Scissors\n` +
                    `🎲 \`.game dice [bet]\` - Dice roll\n` +
                    `🔢 \`.game number\` - Guess the number\n` +
                    `🎯 \`.game coin [bet]\` - Coin flip\n` +
                    `🃏 \`.game slots [bet]\` - Slot machine\n\n` +
                    `💰 You have ${user.coins} coins`;
                
                return m.reply(gameList);
            }

            switch (gameType) {
                case 'rps':
                case 'rockpaperscissors':
                    return await playRockPaperScissors(m, user, args[1]);
                    
                case 'dice':
                    return await playDice(m, user, parseInt(args[1]) || 0);
                    
                case 'number':
                case 'guess':
                    return await playGuessNumber(m, user);
                    
                case 'coin':
                case 'flip':
                    return await playCoinFlip(m, user, parseInt(args[1]) || 0);
                    
                case 'slots':
                case 'slot':
                    return await playSlots(m, user, parseInt(args[1]) || 0);
                    
                default:
                    return m.reply('❌ Unknown game! Use `.game` to see available games.');
            }

        } catch (error) {
            console.error('Error in game command:', error);
            await m.reply('❌ Error starting game!');
        }
    }
};

async function playRockPaperScissors(m, user, playerChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    if (!playerChoice || !choices.includes(playerChoice.toLowerCase())) {
        return m.reply('🪨📄✂️ *Rock Paper Scissors*\n\nChoose: rock, paper, or scissors\n\n📝 Example: `.game rps rock`');
    }
    
    const player = playerChoice.toLowerCase();
    const bot = pickRandom(choices);
    
    let result = '';
    let outcome = '';
    
    if (player === bot) {
        result = 'draw';
        outcome = "🤝 It's a draw!";
    } else if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'paper' && bot === 'rock') ||
        (player === 'scissors' && bot === 'paper')
    ) {
        result = 'win';
        outcome = '🎉 You win!';
        addCoins(m.sender, 50);
    } else {
        result = 'lose';
        outcome = '😔 You lose!';
    }
    
    const gameText = `🪨📄✂️ *Rock Paper Scissors*\n\n` +
        `👤 You: ${emojis[player]} ${player}\n` +
        `🤖 Bot: ${emojis[bot]} ${bot}\n\n` +
        `${outcome}\n` +
        `${result === 'win' ? '💰 +50 coins' : ''}`;
    
    await m.reply(gameText);
}

async function playDice(m, user, bet) {
    if (bet < 0 || bet > user.coins) {
        return m.reply(`🎲 *Dice Game*\n\n❌ Invalid bet! You have ${user.coins} coins.\n\n📝 Example: \`.game dice 100\``);
    }
    
    if (bet === 0) {
        const dice1 = random(1, 6);
        const dice2 = random(1, 6);
        const total = dice1 + dice2;
        
        return m.reply(`🎲 *Dice Roll*\n\n🎯 Dice 1: ${dice1}\n🎯 Dice 2: ${dice2}\n\n📊 Total: ${total}\n\n💡 Add a bet to win coins!`);
    }
    
    const dice1 = random(1, 6);
    const dice2 = random(1, 6);
    const total = dice1 + dice2;
    
    let multiplier = 0;
    if (total === 7) multiplier = 3; // Triple
    else if (total >= 10) multiplier = 2; // Double
    else if (total >= 6) multiplier = 1; // Break even
    
    const winnings = bet * multiplier;
    const profit = winnings - bet;
    
    if (profit > 0) {
        addCoins(m.sender, profit);
    } else {
        removeCoins(m.sender, bet);
    }
    
    const resultText = `🎲 *Dice Game*\n\n` +
        `🎯 Dice 1: ${dice1}\n` +
        `🎯 Dice 2: ${dice2}\n` +
        `📊 Total: ${total}\n\n` +
        `💰 Bet: ${bet} coins\n` +
        `${profit > 0 ? `🎉 Won: ${winnings} coins (+${profit})` : 
          profit === 0 ? `🤝 Break even!` : 
          `😔 Lost: ${bet} coins`}\n\n` +
        `💳 Balance: ${user.coins} coins`;
    
    await m.reply(resultText);
}

async function playGuessNumber(m, user) {
    const targetNumber = random(1, 10);
    const userGuess = random(1, 10); // Simulate user guess for demo
    
    const gameText = `🔢 *Guess the Number*\n\n` +
        `🎯 Guess a number between 1-10!\n` +
        `🤖 I'm thinking of: ${targetNumber}\n` +
        `🎲 Your guess: ${userGuess}\n\n`;
    
    if (userGuess === targetNumber) {
        addCoins(m.sender, 100);
        await m.reply(gameText + '🎉 Correct! +100 coins!');
    } else {
        await m.reply(gameText + `😔 Wrong! The number was ${targetNumber}`);
    }
}

async function playCoinFlip(m, user, bet) {
    if (bet <= 0 || bet > user.coins) {
        return m.reply(`🪙 *Coin Flip*\n\n❌ Invalid bet! You have ${user.coins} coins.\n\n📝 Example: \`.game coin 50\``);
    }
    
    const userChoice = pickRandom(['heads', 'tails']);
    const result = pickRandom(['heads', 'tails']);
    const won = userChoice === result;
    
    if (won) {
        addCoins(m.sender, bet);
    } else {
        removeCoins(m.sender, bet);
    }
    
    const coinText = `🪙 *Coin Flip*\n\n` +
        `👤 Your call: ${userChoice}\n` +
        `🪙 Result: ${result}\n\n` +
        `${won ? `🎉 You win! +${bet} coins` : `😔 You lose! -${bet} coins`}\n\n` +
        `💳 Balance: ${user.coins} coins`;
    
    await m.reply(coinText);
}

async function playSlots(m, user, bet) {
    if (bet <= 0 || bet > user.coins) {
        return m.reply(`🎰 *Slot Machine*\n\n❌ Invalid bet! You have ${user.coins} coins.\n\n📝 Example: \`.game slots 100\``);
    }
    
    const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
    const slot1 = pickRandom(symbols);
    const slot2 = pickRandom(symbols);
    const slot3 = pickRandom(symbols);
    
    let multiplier = 0;
    if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === '💎') multiplier = 10;
        else if (slot1 === '⭐') multiplier = 5;
        else multiplier = 3;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        multiplier = 1.5;
    }
    
    const winnings = Math.floor(bet * multiplier);
    const profit = winnings - bet;
    
    if (profit > 0) {
        addCoins(m.sender, profit);
    } else {
        removeCoins(m.sender, bet);
    }
    
    const slotText = `🎰 *Slot Machine*\n\n` +
        `┌─────────────┐\n` +
        `│  ${slot1}  ${slot2}  ${slot3}  │\n` +
        `└─────────────┘\n\n` +
        `💰 Bet: ${bet} coins\n` +
        `${profit > 0 ? `🎉 Won: ${winnings} coins!` : `😔 Lost: ${bet} coins`}\n\n` +
        `💳 Balance: ${user.coins} coins`;
    
    await m.reply(slotText);
}
