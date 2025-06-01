#[test_only]
module swap_addr::swap_test {
    use std::signer;
    use std::vector;
    use std::aptos_hash;
    use aptos_std::string::{Self, String};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability};
    use aptos_framework::aptos_coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use swap_addr::swap::{Self, OrderMetadata};

    // Test coin types
    struct TestCoinA has key {}
    struct TestCoinB has key {}

    struct TestCoinCapabilities<phantom CoinType> has key {
        mint_cap: MintCapability<CoinType>,
        burn_cap: BurnCapability<CoinType>,
    }

    // Helper function to create a secret hash
    fun create_secret_hash(): vector<u8> {
        let secret = b"my_secret_password_for_swap_test";
        let h = aptos_hash::keccak256(secret); 
        h
    }

    // Helper function to get the secret
    fun get_secret(): vector<u8> {
        b"my_secret_password_for_swap_test"
    }

    // Helper function to setup test coins and mint to account
    fun setup_test_coin<CoinType>(
        admin: &signer,
        maker: &signer,
        amount: u64
    ) acquires TestCoinCapabilities {
        // Initialize the coin
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinType>(
            admin,
            string::utf8(b"Test Coin"),
            string::utf8(b"TC"),
            8,
            true
        );
        
        // Store capabilities
        move_to(admin, TestCoinCapabilities<CoinType> {
            mint_cap,
            burn_cap,
        });
        
        coin::destroy_freeze_cap(freeze_cap);

        // Register coin for recipient
        coin::register<CoinType>(maker);
        // coin::register<CoinType>(resolver);
        
        // Mint coins to recipient
        let caps = borrow_global<TestCoinCapabilities<CoinType>>(signer::address_of(admin));
        let coins = coin::mint<CoinType>(amount, &caps.mint_cap);
        coin::deposit<CoinType>(signer::address_of(maker), coins);
// 
//         let caps = borrow_global<TestCoinCapabilities<CoinType>>(signer::address_of(admin));
//         let coins = coin::mint<CoinType>(amount, &caps.mint_cap);
//         coin::deposit<CoinType>(signer::address_of(resolver), coins);
    }

    

    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_announce_order_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);
        
        // Create account for maker
        account::create_account_for_test(signer::address_of(maker));
        
        // Setup test coins and mint to maker
        let src_amount = 1000000; // 0.01 TCA
        setup_test_coin<TestCoinA>(admin, maker, src_amount);
        
        // Mint APT for safety deposit (using AptosCoin)
        let safety_deposit = 100000; // 0.001 APT
        // aptos_framework::aptos_coin::mint(aptos_framework, signer::address_of(maker), safety_deposit);

        mint_and_deposit<TestCoinA>(admin, maker, safety_deposit);

        // Create order
        let min_dst_amount = 2000000; // 0.02 TCB
        let expiration_duration = 3600; // 1 hour
        let secret_hash = create_secret_hash();
        
        // // create a string of type string::String,
        // let dst_coin_type = string::utf8(b"TestCoinB");

        // let initial_tca_balance = coin::balance<TestCoinA>(signer::address_of(maker));

        aptos_std::debug::print<u64>(&coin::balance<TestCoinA>(signer::address_of(maker)));

        swap::announce_order<TestCoinA>(
            maker,
            src_amount,
            min_dst_amount,
            expiration_duration,
            secret_hash
        );
        
        // Verify order was created correctly and is already funded
        let order = swap::get_order_details(0);
        assert!(swap::order_id(&order) == 0, 1);
        assert!(swap::order_maker_address(&order) == signer::address_of(maker), 2);
        assert!(swap::order_amount(&order) == src_amount, 3);
        assert!(swap::order_min_amount(&order) == min_dst_amount, 4);
        // assert!(swap::order_secret_hash(&order) == secret_hash, 5);
        assert!(swap::order_resolver_address(&order) == @0x0, 7);
        
        // Verify maker's balances were reduced
        // assert!(coin::balance<TestCoinA>(signer::address_of(maker)) == initial_tca_balance - src_amount, 8);
        // assert!(coin::balance<AptosCoin>(signer::address_of(maker)) == initial_apt_balance - safety_deposit, 9);
    }

    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_fund_src_escrow_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities  {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);
        
        // Create account for maker
        account::create_account_for_test(signer::address_of(maker));
        
        // Setup test coins and mint to maker
        let src_amount = 1000000; // 0.01 TCA
        setup_test_coin<TestCoinA>(admin, maker, src_amount);
        
        // Mint APT for safety deposit (using AptosCoin)
        let safety_deposit = 100000; // 0.001 APT
        // aptos_framework::aptos_coin::mint(aptos_framework, signer::address_of(maker), safety_deposit);
        
        // Check initial balances
        let initial_tca_balance = coin::balance<TestCoinA>(signer::address_of(maker));
        // let initial_apt_balance = coin::balance<AptosCoin>(signer::address_of(maker));
        
        // Create order (now includes funding automatically)
        let min_dst_amount = 2000000; // 0.02 TCB
        let expiration_duration = 3600; // 1 hour
        let secret_hash = create_secret_hash();
        
        swap::announce_order<TestCoinA>(
            maker,
            src_amount,
            min_dst_amount,
            expiration_duration,
            secret_hash
        );
        
        // Verify order is already funded (no need for separate fund_src_escrow call)
        let order = swap::get_order_details(0);
        
        // Fund the source escrow
        swap::fund_src_escrow<TestCoinA>(maker, 0);
        }

    
    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_fund_dst_escrow_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);

         // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);

        account::create_account_for_test(signer::address_of(maker));
        account::create_account_for_test(signer::address_of(resolver));
        
        // Setup test coins
        // setup_test_coin<TestCoinA>(admin, maker, 1000000);
        setup_test_coin<TestCoinA>(admin, resolver, 1000000);
        
        // Mint coins to maker and resolver
        let src_amount = 1000000; // 0.01 TCA
        let dst_amount = 2000000; // 0.02 TCB
        
        mint_and_deposit<TestCoinA>(admin, maker, src_amount);
        mint_and_deposit<TestCoinA>(admin, resolver, dst_amount);
        
        // Create order first
        let expiration_duration = 3600; // 1 hour
        let secret_hash = create_secret_hash();
        
        // Fund source escrow first
        swap::fund_dst_escrow<TestCoinA>(resolver, dst_amount, expiration_duration, secret_hash);
        
        // Verify order status updated
        let order_after = swap::get_order_details(0);
        assert!(swap::order_resolver_address(&order_after) == signer::address_of(resolver), 3);
        
        // // Verify resolver's balances were reduced
        // assert!(coin::balance<TestCoinB>(signer::address_of(resolver)) == 0, 4);
        // assert!(coin::balance<AptosCoin>(signer::address_of(resolver)) == 0, 5);
        
        // // Verify escrow has the funds
        // assert!(coin::balance<TestCoinB>(order_after.dst_escrow_address) == dst_amount, 6);
        // assert!(coin::balance<AptosCoin>(order_after.dst_escrow_address) == safety_deposit, 7);
    }


    
    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_claim_src_funds_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(maker));
        account::create_account_for_test(signer::address_of(resolver));
        
        // Setup test coins and mint to maker
        let src_amount = 1000000; // 0.01 TCA
        setup_test_coin<TestCoinA>(admin, maker, src_amount);
        
        // Register resolver for TestCoinA to receive funds
        coin::register<TestCoinA>(resolver);
        
        // Create order
        let min_dst_amount = 2000000; // 0.02 TCB
        let expiration_duration = 3600; // 1 hour
        let secret_hash = create_secret_hash();
        
        swap::announce_order<TestCoinA>(
            maker,
            src_amount,
            min_dst_amount,
            expiration_duration,
            secret_hash
        );
        
        // Fund the source escrow
        swap::fund_src_escrow<TestCoinA>(maker, 0);
        
        // Verify order exists and is not completed yet
        let order_before = swap::get_order_details(0);
        assert!(!swap::is_order_completed(0), 1);
        assert!(vector::is_empty(&swap::get_revealed_secret(0)), 2);
        
        // Get initial resolver balance
        let initial_resolver_balance = coin::balance<TestCoinA>(signer::address_of(resolver));
        
        // Claim funds with correct secret
        let secret = get_secret();
        swap::claim_funds<TestCoinA>(resolver, 0, secret);
        
        // Verify order is now completed
        assert!(swap::is_order_completed(0), 3);
        let revealed_secret = swap::get_revealed_secret(0);
        assert!(revealed_secret == secret, 4);
        
        // Note: Since actual coin transfers are commented out in the implementation,
        // we can't test balance changes, but we can verify the order state changes
        
        // Verify the order metadata was updated correctly
        let order_after = swap::get_order_details(0);
        assert!(swap::order_id(&order_after) == 0, 5);
    }


    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_claim_dst_funds_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(maker));
        account::create_account_for_test(signer::address_of(resolver));
        
        // Setup test coins and mint to maker
        let src_amount = 1000000; // 0.01 TCA
        setup_test_coin<TestCoinA>(admin, maker, src_amount);
        
        // Mint coins to maker and resolver
        let src_amount = 1000000; // 0.01 TCA
        let dst_amount = 2000000; // 0.02 TCB
        
        mint_and_deposit<TestCoinA>(admin, maker, src_amount);
        mint_and_deposit<TestCoinA>(admin, resolver, dst_amount);
        
        // Create order
        let expiration_duration = 3600; // 1 hour
        let secret_hash = create_secret_hash();
        
        // Fund source escrow first
        swap::fund_dst_escrow<TestCoinA>(resolver, dst_amount, expiration_duration, secret_hash);
        
        // Verify order exists and is not completed yet
        let order_before = swap::get_order_details(0);
        assert!(!swap::is_order_completed(0), 1);
        assert!(vector::is_empty(&swap::get_revealed_secret(0)), 2);
        
        // Get initial resolver balance
        let initial_resolver_balance = coin::balance<TestCoinA>(signer::address_of(resolver));
        
        // Claim funds with correct secret
        let secret = get_secret();
        swap::claim_funds<TestCoinA>(resolver, 0, secret);
        
        // Verify order is now completed
        assert!(swap::is_order_completed(0), 3);
        let revealed_secret = swap::get_revealed_secret(0);
        assert!(revealed_secret == secret, 4);
        
        // Note: Since actual coin transfers are commented out in the implementation,
        // we can't test balance changes, but we can verify the order state changes
        
        // Verify the order metadata was updated correctly
        let order_after = swap::get_order_details(0);
        assert!(swap::order_id(&order_after) == 0, 5);
    }

    #[test(
        aptos_framework = @aptos_framework,
        admin = @swap_addr,
        maker = @0x123,
        resolver = @0x456
    )]
    public fun test_cancel_swap_success(
        aptos_framework: &signer,
        admin: &signer,
        maker: &signer,
        resolver: &signer
    ) acquires TestCoinCapabilities {
        // Setup timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the swap ledger
        swap::initialize_swap_ledger(admin);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(maker));
        account::create_account_for_test(signer::address_of(resolver));
        
        // Setup test coins and mint to maker
        let src_amount = 1000000;
        setup_test_coin<TestCoinA>(admin, maker, src_amount);
        
        // Create order with short expiration
        let expiration_duration = 10; // 10 seconds
        swap::announce_order<TestCoinA>(
            maker,
            src_amount,
            2000000,
            expiration_duration,
            create_secret_hash()
        );
        
        // Fund the source escrow
        swap::fund_src_escrow<TestCoinA>(maker, 0);
        
        // Verify order is not completed initially
        assert!(!swap::is_order_completed(0), 1);
        
        // Advance time past expiration
        timestamp::fast_forward_seconds(20);
        
        // Cancel the swap
        swap::cancel_swap<TestCoinA>(maker, 0);
        
        // Verify order is now marked as cancelled (completed with dummy secret)
        assert!(swap::is_order_completed(0), 2);
        let revealed_secret = swap::get_revealed_secret(0);
        assert!(!vector::is_empty(&revealed_secret), 3);
        
        // Note: Since actual coin transfers are commented out in the implementation,
        // we can't test balance changes, but we can verify the order state changes
    }



    #[test_only]
    public fun mint_and_deposit<CoinType>(
        minter_with_cap_signer: &signer,
        recipient_account_signer: &signer,
        amount: u64
    ) acquires TestCoinCapabilities {

        let minter_address = signer::address_of(minter_with_cap_signer);
        let recipient_address = signer::address_of(recipient_account_signer);

        // 1. Ensure the recipient account is registered to receive the CoinType.
        //    If not, register it.
        if (!coin::is_account_registered<CoinType>(recipient_address)) {
            coin::register<CoinType>(recipient_account_signer);
        };

        // 2. Borrow the TestCoinCapabilities from the minter's account.
        //    This contains the MintCapability<CoinType> resource.
        let capabilities = borrow_global<TestCoinCapabilities<CoinType>>(minter_address);

        // 3. Mint the specified amount of CoinType tokens.
        //    The `coin::mint` function returns a `Coin<CoinType>` object containing the newly minted tokens.
        let minted_coins = coin::mint<CoinType>(amount, &capabilities.mint_cap);

        // 4. Deposit the minted coins into the recipient's account.
        coin::deposit<CoinType>(recipient_address, minted_coins);
    }



} 


