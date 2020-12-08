import { common, crypto } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { LocalUserAccountProvider, LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
const secondaryKeyString = '04c1784140445016cf0f8cc86dd10ad8764e1a89c563c500e21ac19a5d905ab3';

jest.setTimeout(30000);

describe('Test LocalUserAccountProvider transfer methods -- local network', () => {
    const networkOptions = {
        rpcURL: 'http://localhost:9040/rpc',
        network: 'local',
    };

    const publicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
    const masterAccount = {
      network: constants.LOCAL_NETWORK_NAME,
      privateKeys: [constants.PRIVATE_NET_PRIVATE_KEY],
      name: 'master',
    };
  
    const masterScriptHash = crypto.toScriptHash(
      crypto.createMultiSignatureVerificationScript(1, [publicKey]),
    );

    const masterAddress = crypto.scriptHashToAddress({
      addressVersion: common.NEO_ADDRESS_VERSION,
      scriptHash: masterScriptHash,
    });
  
    const emptyKey = common.stringToPrivateKey(secondaryKeyString);
    const emptyAddress = crypto.privateKeyToAddress({ addressVersion: common.NEO_ADDRESS_VERSION, privateKey: emptyKey });
  
    const emptyAccount = {
      network: constants.LOCAL_NETWORK_NAME,
      privateKey: secondaryKeyString,
      name: 'empty',
    };
  
    test('Transfer', async () => {
      const keystore = new LocalKeyStore(new LocalMemoryStore());
      await Promise.all([keystore.addMultiSigUserAccount(masterAccount), keystore.addUserAccount(emptyAccount)]);
      console.log('Keystore created, added master account + empty account');

      const provider = new NEOONEProvider([networkOptions]);
      console.log(`provider created for network at: ${networkOptions.rpcURL}`);

      const localProvider = new LocalUserAccountProvider({ provider, keystore });
      console.log('LocalUserAccountProvider created.')
  
      const transfer = {
        amount: new BigNumber(100000),
        asset: common.nativeScriptHashes.NEO,
        to: emptyAddress,
      };
      console.log(`preparing to transfer ${transfer.amount.toString()} of asset ${transfer.asset} to ${transfer.to}`)
  
      const result = await localProvider.transfer([transfer], {
        from: {
          network: 'local',
          address: masterAddress,
        },
        maxNetworkFee: new BigNumber(-1),
        maxSystemFee: new BigNumber(-1),
      });
  
      console.log('Transfer sent, awaiting confirmation...');
      await result.confirmed();

      console.log('Transfer confirmed! fetching transaction result...');
      const receipt = await localProvider.provider.getApplicationLogData('local', result.transaction.hash);
  
      const stackReturn = receipt.stack[0];
      if (typeof stackReturn === 'string') {
        throw new Error('expected good return');
      }
  
      console.log(`Transaction result: ${stackReturn.value}`);
      expect(stackReturn.value).toEqual(true);
    });
  });