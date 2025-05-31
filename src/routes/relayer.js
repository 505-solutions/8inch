const express = require('express');
const router = express.Router();

router.get('/getQuote', (req, res) => {
  const {
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount
  } = req.query;

  if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount) {
      return res.status(400).json({
          error: 'Missing required parameters',
          required: ['srcChainId', 'dstChainId', 'srcTokenAddress', 'dstTokenAddress', 'amount']
      });
  }

  const inputAmount = BigInt(amount);
  const EXCHANGE_RATE = 2; // HARDCODED 
  const outputAmount = (inputAmount * BigInt(Math.floor(EXCHANGE_RATE * 1000))) / BigInt(1000);

  const mockQuote = {
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress,
      dstTokenAddress,
      srcAmount: amount,
      dstAmount: outputAmount.toString(),
      exchangeRate: EXCHANGE_RATE,
      estimatedGas: '21000',
      gasPrice: '20000000000',
      fees: {
          protocolFee: '0',
          gasFee: '420000000000000'
      },
      route: [
          {
              from: srcTokenAddress,
              to: dstTokenAddress,
              exchange: 'AptosCrossChain'
          }
      ],
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30000).toISOString()
  };

  res.json(mockQuote);
});

module.exports = router; 