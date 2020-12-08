import { common, crypto } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { LocalUserAccountProvider, LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
const secondaryKeyString = '04c1784140445016cf0f8cc86dd10ad8764e1a89c563c500e21ac19a5d905ab3';

jest.setTimeout(30000);

// Test the localUserAccountProvider using our test account
describe('Test LocalUserAccountProvider transfer methods -- staging network', () => {
  const masterPK = '08674acb3bb23d24473f2a578cee0399e2ae9e14b5159b6f1fcbdf1a6b678422';

  const masterAccount = {
    network: 'test',
    privateKey: masterPK,
    name: 'fundAccount',
  };

  const secondaryAccount = {
    network: 'test',
    privateKey: secondaryKeyString,
    name: 'receiveAccount',
  };

  const masterAddress = crypto.privateKeyToAddress({
    privateKey: common.stringToPrivateKey(masterPK),
    addressVersion: common.NEO_ADDRESS_VERSION,
  });
  const secondaryAddress = crypto.privateKeyToAddress({
    privateKey: common.stringToPrivateKey(secondaryKeyString),
    addressVersion: common.NEO_ADDRESS_VERSION,
  });

  const networkOptions = {
    network: 'test',
    rpcURL: 'https://staging.neotracker.io/rpc',
  };

  test('Transfer', async () => {
    const keystore = new LocalKeyStore(new LocalMemoryStore());
    await Promise.all([keystore.addUserAccount(masterAccount), keystore.addUserAccount(secondaryAccount)]);
    console.log('Keystore created, added master account + empty account');

    const provider = new NEOONEProvider([networkOptions]);
    console.log(`provider created for network at: ${networkOptions.rpcURL}`);

    const localProvider = new LocalUserAccountProvider({ provider, keystore });
    console.log('LocalUserAccountProvider created.');

    const transfer = {
      amount: new BigNumber(10),
      asset: common.nativeScriptHashes.GAS,
      to: secondaryAddress,
    };
    console.log(`preparing to transfer ${transfer.amount.toString()} of asset ${transfer.asset} to ${transfer.to}`)

    const result = await localProvider.transfer([transfer], {
      from: {
        network: 'test',
        address: masterAddress,
      },
      maxNetworkFee: new BigNumber(-1),
      maxSystemFee: new BigNumber(-1)
    });
    console.log('Transfer sent, awaiting confirmation...');

    await result.confirmed();

    console.log('Transfer confirmed! fetching transaction result...');
    const receipt = await localProvider.provider.getApplicationLogData('test', result.transaction.hash);

    const stackReturn = receipt.stack[0];
    if (typeof stackReturn === 'string') {
      throw new Error('expected good return');
    }

    console.log(`Transaction result: ${stackReturn.value}`);
    expect(stackReturn.value).toEqual(true);
  });
});
