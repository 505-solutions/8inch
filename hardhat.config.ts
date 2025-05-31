import { HardhatUserConfig } from 'hardhat/types';
import { config as dotEnvConfig } from 'dotenv';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';

dotEnvConfig();

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [{
            version: '0.8.20', settings: {
                optimizer: {
                    enabled: true
                },
                evmVersion: 'shanghai',
                viaIR: true
            }
        }]
    },
    networks: {
        hardhat: {
            forking: {
                enabled: true,
                url: process.env.NODE_URL,
                blockNumber: 19990037

            },
            chainId: 1,
        },
        localhost: {}
    }
};

export default config;
