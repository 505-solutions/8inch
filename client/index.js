// use this when there is no `"type": "module"` in your package.json, i.e. you're using commonjs

const { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } = require("@1inch/cross-chain-sdk");
const env = require('dotenv');
const process = env.config().parsed;

const { Web3 } = require('web3');
const { solidityPackedKeccak256, randomBytes, Contract, Wallet, JsonRpcProvider } = require('ethers');
const axios = require('axios');

// TODO write formal bug for this function being inaccessible
function getRandomBytes32() {
    // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

const makerPrivateKey = process?.WALLET_KEY;
const makerAddress = process?.WALLET_ADDRESS;
const nodeUrl = process?.RPC_URL; // suggested for ethereum https://eth.llamarpc.com
const devPortalApiKey = process?.DEV_PORTAL_KEY;

// Validate environment variables
if (!makerPrivateKey || !makerAddress || !nodeUrl || !devPortalApiKey) {
    throw new Error("Missing required environment variables. Please check your .env file.");
}

const web3Instance = new Web3(nodeUrl);
const blockchainProvider = new PrivateKeyProviderConnector(makerPrivateKey, web3Instance);

const sdk = new SDK({
    url: 'https://api.1inch.dev/fusion-plus',
    authKey: devPortalApiKey,
    blockchainProvider
});

let srcChainId = NetworkEnum.ARBITRUM;
let dstChainId = NetworkEnum.COINBASE;
let srcTokenAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
let dstTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const approveABI = [{
    "constant": false,
    "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];

// Constants
const SERVER_URL = 'http://localhost:3000';
const amount = '1000000000000000000'; // 1 USDC (18 decimals)

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

(async () => {
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
})().catch(error => {
    console.error("Error in main execution:", error);
});