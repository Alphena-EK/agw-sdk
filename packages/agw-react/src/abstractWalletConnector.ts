import { toPrivyWalletConnector } from '@privy-io/cross-app-connect';
import { type CreateConnectorFn } from '@wagmi/core';
import {
  type EIP1193EventMap,
  type EIP1193RequestFn,
  type EIP1474Methods,
} from 'viem';

import { AGW_APP_ID } from './constants.js';

/**
 * Create a wagmi connector for the Abstract Global Wallet.
 *
 * Adapted from wagmi injected connector as a reference implementation:
 * https://github.com/wevm/wagmi/blob/main/packages/core/src/connectors/injected.ts#L94
 *
 * @example
 * import { createConfig, http } from "wagmi";
 * import { abstract } from "wagmi/chains";
 *
 * const privyWalletConnector = toPrivyWalletConnector({
 *   providerAppId: <your-app-id>,
 *   providerName: 'Your app',
 *   providerIconUrl: 'https://example.com/image.png',
 * })
 *
 * export const wagmiConfig = createConfig({
 *   chains: [mainnet],
 *   transports: {
 *     [mainnet.id]: http(),
 *   },
 *   connectors: [abstractWalletConnector],
 *   ssr: true,
 * });
 */
function abstractWalletConnector(): CreateConnectorFn<
  {
    on: <event extends keyof EIP1193EventMap>(
      event: event,
      listener: EIP1193EventMap[event],
    ) => void;
    removeListener: <event extends keyof EIP1193EventMap>(
      event: event,
      listener: EIP1193EventMap[event],
    ) => void;
    request: EIP1193RequestFn<EIP1474Methods>;
  },
  Record<string, unknown>,
  Record<string, unknown>
> {
  return (params) => {
    console.log('Creating abstract wallet connector');

    const connector = toPrivyWalletConnector({
      iconUrl:
        'https://ipfs.io/ipfs/QmSpL14zz76qGCvxD5rd3SLTmQUmruY3DEZAw3a9GebZ4S',
      id: AGW_APP_ID,
      name: 'Abstract',
    })(params);

    const getProvider = connector.getProvider;
    const getAbstractProvider = async (
      parameters?: { chainId?: number | undefined } | undefined,
    ) => {
      const provider = await getProvider(parameters);
      const providerHandleRequest = provider.request;
      const handler: EIP1193RequestFn<EIP1474Methods> = async (e: any) => {
        const { method } = e;
        console.log('Abstract provider processing', method);
        switch (method) {
          case 'eth_signTransaction':
          case 'eth_sendTransaction': {
            console.log('Fetching accounts');
            const accounts = await connector.getAccounts();
            console.log('Accounts:', accounts);
            return await providerHandleRequest(e);
          }
          default: {
            return await providerHandleRequest(e);
          }
        }
      };

      return {
        on: provider.on,
        removeListener: provider.removeListener,
        request: handler,
      };
    };

    const abstractConnector = {
      ...connector,
      getProvider: getAbstractProvider,
      type: 'abstract',
    };
    console.log('Abstract connector:', abstractConnector);
    return abstractConnector;
  };
}

export { abstractWalletConnector };