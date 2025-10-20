import { CreateConnectorFn } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import {
  Adapter,
  WalletError,
  WalletAdapterNetwork,
  WalletNotReadyError,
} from "@solana/wallet-adapter-base";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
} from "@solana-mobile/wallet-adapter-mobile";
import type { NetworkId } from "@orderly.network/types";
import injectedOnboard from "@web3-onboard/injected-wallets";
import { getRuntimeConfig } from "./runtime-config";
import walletConnectOnboard from "@web3-onboard/walletconnect";
import { withBasePath } from "@/utils/base-path";

export const getEvmConnectors = (): CreateConnectorFn[] => {
  const walletConnectProjectId = getRuntimeConfig(
    "VITE_WALLETCONNECT_PROJECT_ID"
  );
  const isBrowser = typeof window !== "undefined";

  const connectors: CreateConnectorFn[] = [injected()];

  if (walletConnectProjectId && isBrowser) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
        metadata: {
          name: getRuntimeConfig("VITE_APP_NAME") || "Orderly App",
          description:
            getRuntimeConfig("VITE_APP_DESCRIPTION") || "Orderly Application",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.webp`],
        },
      })
    );
  }

  return connectors;
};

export const getSolanaWallets = (networkId: NetworkId) => {
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    return [];
  }

  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: {
        uri: `${location.protocol}//${location.host}`,
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      chain:
        networkId === "mainnet"
          ? WalletAdapterNetwork.Mainnet
          : WalletAdapterNetwork.Devnet,
      onWalletNotFound: (adapter: SolanaMobileWalletAdapter) => {
        console.log("-- mobile wallet adapter", adapter);
        return Promise.reject(new WalletNotReadyError("wallet not ready"));
      },
    }),
  ];
};

export const getSolanaConfig = (networkId: NetworkId) => {
  return {
    wallets: getSolanaWallets(networkId),
    onError: (error: WalletError, adapter?: Adapter) => {
      console.log("-- error", error, adapter);
    },
  };
};

export const getOnboardEvmWallets = () => {
  const walletConnectProjectId = getRuntimeConfig(
    "VITE_WALLETCONNECT_PROJECT_ID"
  );
  const isBrowser = typeof window !== "undefined";

  if (!walletConnectProjectId || !isBrowser) {
    return [];
  }

  const chainIds = getRuntimeConfig('VITE_ORDERLY_MAINNET_CHAINS')?.split(',').map((id) => parseInt(id.trim()));
  return [
    walletConnectOnboard({
      projectId: walletConnectProjectId,
      qrModalOptions: {
        themeMode: "dark",
      },
      optionalChains: chainIds,
      dappUrl: window.location.origin,
    }),
    injectedOnboard(),
  ];
};

export const getEvmInitialConfig = () => {
  const wallets = getOnboardEvmWallets();

  return wallets.length > 0
    ? {
        options: {
          wallets,
          appMetadata: {
            icon: withBasePath("/logo.svg"),
            name: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME"),
            description: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME"),
          },
        },
      }
    : undefined;
};
