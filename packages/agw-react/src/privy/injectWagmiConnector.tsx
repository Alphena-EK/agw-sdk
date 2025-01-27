import { Fragment, useEffect, useState } from 'react';
import React from 'react';
import type { Chain, EIP1193Provider, Transport } from 'viem';
import { useConfig, useReconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { usePrivyCrossAppProvider } from './usePrivyCrossAppProvider.js';

interface InjectWagmiConnectorProps extends React.PropsWithChildren {
  chain: Chain;
  transport?: Transport;
}

export const InjectWagmiConnector = (props: InjectWagmiConnectorProps) => {
  const { chain, transport, children } = props;

  const config = useConfig();
  const { reconnect } = useReconnect();
  const { provider, ready } = usePrivyCrossAppProvider({ chain, transport });
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    const setup = async (provider: EIP1193Provider) => {
      const wagmiConnector = injected({
        target: {
          provider,
          id: 'xyz.abs.privy',
          name: 'Abstract Global Wallet',
          icon: '',
        },
      });

      const connector = config._internal.connectors.setup(wagmiConnector);
      await config.storage?.setItem('recentConnectorId', 'xyz.abs.privy');
      config._internal.connectors.setState([connector]);

      return connector;
    };

    if (ready && !isSetup) {
      setup(provider).then((connector) => {
        if (connector) {
          reconnect({ connectors: [connector] });
          setIsSetup(true);
        }
      });
    }
  }, [provider, ready]);

  return <Fragment>{children}</Fragment>;
};
