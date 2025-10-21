
const crypto = require('crypto');

function generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

module.exports = { generateNonce };
