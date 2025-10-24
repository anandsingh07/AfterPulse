import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import LockForm from "./components/LockForm";
import PingButton from "./components/PingButton";

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("lock"); // lock | ping

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const tabs = [
    { id: "lock", label: "🔒 Lock Funds" },
    { id: "ping", label: "🫀 Manual Ping" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">
        🧠 PulseTrack Guardian
      </h1>

      {/* Wallet Connect */}
      <WalletConnect
        account={account}
        setAccount={setAccount}
        setBalance={setBalance}
      />

      {account && (
        <>
          {/* Wallet Info */}
          <div className="bg-gray-900 p-6 rounded-2xl shadow-md mt-6 w-full max-w-lg text-center space-y-2">
            <p>
              <span className="text-indigo-400">Wallet:</span> {shortAddress(account)}
            </p>
            <p>
              <span className="text-indigo-400">Balance:</span> {balance} ETH
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6 mb-4 w-full max-w-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Section */}
          <div className="w-full max-w-lg space-y-4">
            {activeTab === "lock" && <LockForm account={account} />}
            {activeTab === "ping" && <PingButton />}
          </div>
        </>
      )}

      {!account && (
        <p className="text-gray-400 mt-6 text-center">
          Connect your wallet to access PulseTrack features.
        </p>
      )}
    </div>
  );
}
