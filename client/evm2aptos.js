const { Web3 } = require('web3');
const { solidityPackedKeccak256, randomBytes } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Constants
const SERVER_URL = 'http://localhost:3000';
const srcChainId = 42161; // Arbitrum
const dstChainId = 1;     // Aptos
const srcTokenAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC on Arbitrum
const dstTokenAddress = '0x1::coin::USDC'; // USDC on Aptos
const amount = '1000000000000000000'; // 1 USDC (18 decimals)

// Helper function to get random bytes32
function getRandomBytes32() {
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

async function getQuote() {
    try {
        const response = await axios.get(`${SERVER_URL}/relayer/getQuote`, {
            params: {
                srcChainId,
                dstChainId,
                srcTokenAddress,
                dstTokenAddress,
                amount
            }
        });

        console.log('Quote received:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting quote:', error.response?.data || error.message);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        // Get quote from our server
        const quote = await getQuote();
        
        // TODO: Implement order placement
        // TODO: Implement order status checking
        // TODO: Implement secret submission
        
        console.log('Quote received successfully. Other methods to be implemented.');
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

main();
