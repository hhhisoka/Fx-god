const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

// Format time
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Random number between min and max
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random element from array
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Shuffle array
function shuffle(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Check if user is owner
function isOwner(jid) {
    return config.owner.includes(jid);
}

// Check if user is premium
function isPremium(jid) {
    const user = global.db.users[jid];
    if (!user) return false;
    return user.premium && user.premiumTime > Date.now();
}

// Check cooldown
function checkCooldown(userId, command, cooldownTime) {
    const user = global.db.users[userId];
    if (!user.cooldowns) user.cooldowns = {};
    
    const lastUsed = user.cooldowns[command] || 0;
    const now = Date.now();
    const timeLeft = (lastUsed + cooldownTime) - now;
    
    if (timeLeft > 0) {
        return { onCooldown: true, timeLeft };
    }
    
    user.cooldowns[command] = now;
    return { onCooldown: false, timeLeft: 0 };
}

// Get level from exp
function getLevelFromExp(exp) {
    return Math.floor(Math.sqrt(exp / config.rpg.expPerLevel)) + 1;
}

// Get exp needed for level
function getExpForLevel(level) {
    return (level - 1) ** 2 * config.rpg.expPerLevel;
}

// Calculate damage in battle
function calculateDamage(attacker, defender) {
    const baseDamage = attacker.strength || 10;
    const defense = defender.defense || 5;
    const randomFactor = random(80, 120) / 100; // 80% to 120%
    
    let damage = Math.floor((baseDamage - defense / 2) * randomFactor);
    return Math.max(damage, 1); // Minimum 1 damage
}

// Check if user can afford something
function canAfford(userId, cost) {
    const user = global.db.users[userId];
    return user && user.coins >= cost;
}

// Download file from URL
async function downloadFile(url, maxSize = config.limits.downloadSize) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            maxContentLength: maxSize,
            timeout: 30000
        });
        
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

// Get file extension from URL
function getFileExtension(url) {
    return path.extname(new URL(url).pathname).toLowerCase();
}

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Clean text (remove special characters)
function cleanText(text) {
    return text.replace(/[^\w\s]/gi, '').trim();
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Convert seconds to readable time
function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Get runtime
function getRuntime() {
    return process.uptime() * 1000; // Convert to milliseconds
}

// Check if group admin
function isGroupAdmin(jid, groupId, conn) {
    try {
        const groupMetadata = conn.groupMetadata[groupId];
        if (!groupMetadata) return false;
        
        const participant = groupMetadata.participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        return false;
    }
}

// Check if bot is admin
function isBotAdmin(groupId, conn) {
    try {
        const groupMetadata = conn.groupMetadata[groupId];
        if (!groupMetadata) return false;
        
        const botJid = conn.user.id;
        const participant = groupMetadata.participants.find(p => p.id === botJid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        return false;
    }
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate random string
function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Convert bytes to human readable
function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Get file size
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// Parse command arguments
function parseArgs(text, prefix) {
    const args = text.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    return { command, args, text: args.join(' ') };
}

// Check if text contains link
function containsLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
}

// Extract mentions from text
function extractMentions(text) {
    const mentionRegex = /@(\d+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1] + '@s.whatsapp.net');
    }
    
    return mentions;
}

// Format currency
function formatCurrency(amount) {
    return `💰 ${formatNumber(amount)} coins`;
}

// Get progress bar
function getProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.floor(percentage * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
    formatTime,
    formatNumber,
    random,
    pickRandom,
    shuffle,
    isOwner,
    isPremium,
    checkCooldown,
    getLevelFromExp,
    getExpForLevel,
    calculateDamage,
    canAfford,
    downloadFile,
    getFileExtension,
    isValidUrl,
    cleanText,
    capitalize,
    secondsToTime,
    getRuntime,
    isGroupAdmin,
    isBotAdmin,
    sleep,
    generateRandomString,
    bytesToSize,
    getFileSize,
    parseArgs,
    containsLink,
    extractMentions,
    formatCurrency,
    getProgressBar
};
