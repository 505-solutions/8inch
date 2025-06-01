module mytoken_addr::my_token {
    use std::signer;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::coin::{BurnCapability, FreezeCapability, MintCapability};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;

    /// Token struct
    struct SimpleToken {}

    /// Capabilities holder
    struct Capabilities has key {
        mint_cap: MintCapability<SimpleToken>,
        burn_cap: BurnCapability<SimpleToken>,
        freeze_cap: FreezeCapability<SimpleToken>,
    }

    /// Initialize the token
    public entry fun initialize(
        account: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        monitor_supply: bool,
    ) {
        let account_addr = signer::address_of(account);
        
        // Ensure the token hasn't been initialized
        assert!(!exists<Capabilities>(account_addr), E_ALREADY_INITIALIZED);

        // Create the token
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<SimpleToken>(
            account,
            name,
            symbol,
            decimals,
            monitor_supply,
        );

        // Store capabilities
        move_to(account, Capabilities {
            mint_cap,
            burn_cap,
            freeze_cap,
        });
    }

    /// Register an account to hold the token
    public entry fun register(account: &signer) {
        coin::register<SimpleToken>(account);
    }

    /// Mint new tokens
    public entry fun mint(
        account: &signer,
        to: address,
        amount: u64,
    ) acquires Capabilities {
        let account_addr = signer::address_of(account);
        
        // Ensure caller has mint capability
        assert!(exists<Capabilities>(account_addr), E_NOT_AUTHORIZED);
        
        let capabilities = borrow_global<Capabilities>(account_addr);
        let coins = coin::mint(amount, &capabilities.mint_cap);
        coin::deposit(to, coins);
    }

    /// Burn tokens from caller's account
    public entry fun burn(
        account: &signer,
        amount: u64,
    ) acquires Capabilities {
        let account_addr = signer::address_of(account);
        
        // Withdraw coins from the account
        let coins = coin::withdraw<SimpleToken>(account, amount);
        
        // Get burn capability
        let capabilities = borrow_global<Capabilities>(@mytoken_addr);
        coin::burn(coins, &capabilities.burn_cap);
    }

    /// Transfer tokens between accounts
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        coin::transfer<SimpleToken>(from, to, amount);
    }

    /// Get balance of an account
    public fun balance(owner: address): u64 {
        coin::balance<SimpleToken>(owner)
    }

    /// Check if an account is registered for the token
    public fun is_registered(owner: address): bool {
        coin::is_account_registered<SimpleToken>(owner)
    }

    /// Get token supply
    public fun supply(): u128 {
        let supply = coin::supply<SimpleToken>();
        if (std::option::is_some(&supply)) {
            *std::option::borrow(&supply)
        } else {
            0
        }
    }

    #[test_only]
    use std::string;
    
    #[test]
    fun test_initialize_and_mint() acquires Capabilities {
        use aptos_framework::account;
        
        // Create test accounts
        let admin = account::create_account_for_test(@mytoken_addr);
        let user = account::create_account_for_test(@0x4);
        
        // Initialize token
        initialize(
            &admin,
            string::utf8(b"My Token"),
            string::utf8(b"MTK"),
            8,
            true
        );
        
        // Register user account
        register(&user);
        
        // Mint tokens
        mint(&admin, signer::address_of(&user), 1000000);
        
        // Check balance
        assert!(balance(signer::address_of(&user)) == 1000000, 0);
    }
}