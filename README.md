# NEO•ONE v3.0.1 release demonstration repo

We provide 2 test suites to demonstrate the new features we have implemented in NEO•ONE.

To get started you can clone this repository and run:

```
npm install
```

## Transfer's using the staging node (synced with testnet)

This test makes use of our currently running 3.0.1 node at https://staging.neotracker.io/rpc.

Using a NEO account with some allocated test gas we can demonstrate transferring and receiving NEO/GAS
from our local user-account provider.

to test simply run: 
```
npx jest staging.test.ts
```

## Transfer's using a local consensus node with 1-validator that we control

This test requires starting a local development network and then using the defined validator
to form a transaction that populates our test wallets for development purposes.

to test, open a second terminal and start a local development network with:
```
npx neo-one start network
```

this will start a local development network with data being stored at `./.neo-one/`.

Once running, you can test a transaction with:
```
npx jest local.test.ts
```
