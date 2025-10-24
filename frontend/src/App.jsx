import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);

  // Shorten wallet address
  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">
        🧠 PulseTrack Wallet
      </h1>

      <WalletConnect
        account={account}
        setAccount={setAccount}
        setBalance={setBalance}
      />

      {account && (
        <div className="bg-gray-900 p-6 rounded-2xl shadow-md mt-6 w-full max-w-sm text-center">
          <p>
            <span className="text-indigo-400">Wallet:</span>{" "}
            {shortAddress(account)}
          </p>
          <p>
            <span className="text-indigo-400">Balance:</span> {balance} ETH
          </p>
        </div>
      )}

      {!account && (
        <p className="text-gray-400 mt-6 text-center">
          Connect your wallet to access PulseTrack features.
        </p>
      )}
    </div>
  );
}
