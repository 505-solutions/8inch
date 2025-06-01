import { AptosAccount, AptosClient, TxnBuilderTypes, BCS } from "aptos";
import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const NODE = "https://fullnode.mainnet.aptoslabs.com/v1";

// Use the SAME private key you used with the CLI
const account = AptosAccount.fromAptosAccountObject({
  privateKeyHex: process.env.PRIVKEY as string,
  address: process.env.ADDR as string,
});

const client = new AptosClient(NODE);

async function initialize_swap_ledger() {
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap_v3::initialize_swap_ledger",
    type_arguments: [SRC_COIN_TYPE],
    arguments: [],
  };
  await signAndSubmit(payload);
}

async function anounce_order() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg
  const srcAmount = 10_000; // 1 APT if decimals = 6
  const minDstAmount = 10_000;
  const expiresInSecs = 3_600; // 1 hour

  const stringBytes = ethers.toUtf8Bytes("my_secret_password_for_swap_test");
  const secretHashHex = hexToUint8Array(ethers.keccak256(stringBytes));
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap_v3::announce_order",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [
      srcAmount.toString(), // u64
      minDstAmount.toString(), // u64
      expiresInSecs.toString(), // u64
      secretHashHex, // vector<u8>  (hex string with 0x-prefix)
    ],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function fund_dst_escrow() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const dst_amount = 10_000;
  const expiration_duration_secs = Math.floor(Date.now() / 1000) + 3600;
  const secret = ethers.toUtf8Bytes("my_secret_password_for_swap_test");
  const secret_hash = hexToUint8Array(ethers.keccak256(secret));
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap_v3::fund_dst_escrow",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [
      dst_amount.toString(),
      expiration_duration_secs.toString(),
      secret_hash,
    ],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function claim_funds() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const order_id = 10;
  const secret = ethers.toUtf8Bytes("my_secret_password_for_swap_test");
  //   const secretVec8 = hexToUint8Array(ethers.keccak256(secret));
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap_v3::claim_funds",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [order_id.toString(), secret],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function cancel_swap() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const order_id = 19;
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap_v3::cancel_swap",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [order_id.toString()],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function signAndSubmit(payload: any) {
  console.log("payload", payload);
  const rawTxn = await client.generateTransaction(account.address(), payload);
  console.log("rawTxn", rawTxn.payload);
  const bcsTxn = AptosClient.generateBCSTransaction(account, rawTxn);
  const pending = await client.submitSignedBCSTransaction(bcsTxn);
  console.log("pending", pending);
  await client.waitForTransaction(pending.hash);
  console.log("✓ Txn:", `https://explorer.aptoslabs.com/txn/${pending.hash}?network=mainnet`);
}

(async () => {
  //   await initialize_swap_ledger();
  //   await anounce_order();

  // await fund_dst_escrow();

  //   await claim_funds();

  await cancel_swap();
})();

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith("0x")) {
    hex = hex.substring(2);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(
      "Hex string must have an even number of characters for byte conversion."
    );
  }
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return byteArray;
}


export {
    fund_dst_escrow,
    claim_funds,
    cancel_swap,
    anounce_order,
    initialize_swap_ledger,
}