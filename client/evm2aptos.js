const { Web3 } = require('web3');
const { solidityPackedKeccak256, randomBytes } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Constants
const SERVER_URL = 'http://localhost:3000';
const srcChainId = "ETH::1"; // Arbitrum
const dstChainId = "APTOS::1";     // Aptos
const srcTokenAddress = '0x8EB8a3b98659Cce290402893d0123abb75E3ab28'; // WETH on Ethereum
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
        const orderSecret = getRandomBytes32();
        const hashSecret = solidityPackedKeccak256(['bytes32'], [orderSecret]);

        console.log('Order secret:', orderSecret);
        console.log('Hash secret:', hashSecret);

        // Call factory contract and escrow the funds
        
        // Call the resolver to make counter deposits
        // Poll relayer when it is safe to share the secret / check the blockchain myself
        // Share secret with relayer, call the resolver
        // Withdraw for maker
        // Withdraw for taker
        
        console.log('Quote received successfully. Other methods to be implemented.');
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

main();
