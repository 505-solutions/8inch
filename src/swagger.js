const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Fusion Resolver API',
    description: 'API for Fusion Resolver and Relayer endpoints'
  },
  host: 'localhost:3000',
  schemes: ['http'],
  tags: [
    {
      name: 'Relayer',
      description: 'Relayer endpoints for cross-chain operations'
    },
    {
      name: 'Resolver',
      description: 'Resolver endpoints for order management'
    }
  ],
  definitions: {
    Quote: {
      srcChainId: 1,
      dstChainId: 2,
      srcTokenAddress: '0x...',
      dstTokenAddress: '0x...',
      srcAmount: '1000000000000000000',
      dstAmount: '2000000000000000000',
      exchangeRate: 2,
      estimatedGas: '21000',
      gasPrice: '20000000000',
      fees: {
        protocolFee: '0',
        gasFee: '420000000000000'
      },
      route: [
        {
          from: '0x...',
          to: '0x...',
          exchange: 'AptosCrossChain'
        }
      ],
      timestamp: '2024-03-21T12:00:00Z',
      validUntil: '2024-03-21T12:00:30Z'
    },
    Order: {
      orderId: '0x...',
      signature: '0x...'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/server.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc); 