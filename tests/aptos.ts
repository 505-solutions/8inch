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
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap::initialize_swap_ledger",
    type_arguments: [],
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
  console.log("stringBytesHash", ethers.keccak256(stringBytes));
  const secretHashHex = hexToUint8Array(ethers.keccak256(stringBytes));
  console.log("secretHashHex", secretHashHex);
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap::announce_order",
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

async function fund_src_escrow() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const order_id = 0;
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap::fund_src_escrow",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [order_id.toString()],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function claim_funds() {
  // -------------- user-supplied values --------------------------------
  const SRC_COIN_TYPE =
    "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::my_token::SimpleToken"; // generic type arg

  const order_id = 0;
  const secret = "my_secret_password_for_swap_test";
  const secretVec8 = hexToUint8Array(ethers.keccak256(secret));
  // --------------------------------------------------------------------

  // Build the txn payload
  const payload = {
    type: "entry_function_payload",
    function:
      "0x55625547c27ed94dde4184151d8a688d39615ace5d389b7fa4f0dbf887819b7c::swap::claim_funds",
    // 1) generic type arguments
    type_arguments: [SRC_COIN_TYPE],
    // 2) the four explicit Move parameters, IN ORDER, all as strings or hex
    arguments: [order_id.toString(), secretVec8],
  };

  //   console.log("payload", payload);

  await signAndSubmit(payload);
}

async function registerIfNeeded() {
  try {
    await client.getAccountResource(
      account.address(),
      `0x${account.address().hex()}::coin::CoinStore<0x${account
        .address()
        .hex()}::my_token::MyToken>`
    );
  } catch {
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::register",
      type_arguments: [`0x${account.address().hex()}::my_token::MyToken`],
      arguments: [],
    };
    await signAndSubmit(payload);
  }
}

async function deposit(amount: number) {
  const payload = {
    type: "entry_function_payload",
    function: `0x${account.address().hex()}::vault::deposit`,
    type_arguments: [],
    arguments: [amount.toString()],
  };
  await signAndSubmit(payload);
}

async function withdrawAll() {
  const payload = {
    type: "entry_function_payload",
    function: `0x${account.address().hex()}::vault::withdraw_all`,
    type_arguments: [],
    arguments: [],
  };
  await signAndSubmit(payload);
}

async function signAndSubmit(payload: any) {
  console.log("payload", payload);
  const rawTxn = await client.generateTransaction(account.address(), payload);
  console.log("rawTxn", rawTxn.payload);
  const bcsTxn = AptosClient.generateBCSTransaction(account, rawTxn);
  //   console.log("bcsTxn", bcsTxn);
  const pending = await client.submitSignedBCSTransaction(bcsTxn);
  console.log("pending", pending);
  await client.waitForTransaction(pending.hash);
  console.log("✓ Txn:", pending.hash);
}

(async () => {
  //   await registerIfNeeded();
  //   await deposit(500000); // 0.5 MYT
  //   await withdrawAll();

  //   await initialize_swap_ledger();
  //   await anounce_order();

  await fund_src_escrow();
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
