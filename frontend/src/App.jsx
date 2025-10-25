import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import LockForm from "./components/LockForm";
import PingButton from "./components/PingButton";
import ActivityLog from "./components/ActivityLog";

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("lock"); // lock | ping | log

  const tabs = [
    { id: "lock", label: "🔒 Lock Funds" },
    { id: "ping", label: "🫀 Manual Ping" },
    { id: "log", label: "📝 Activity Log" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-indigo-400 mb-6">
          🧠 PulseTrack
        </h1>

        <WalletConnect account={account} setAccount={setAccount} setBalance={setBalance} />

        {account && (
          <div className="bg-gray-800 p-4 rounded-xl space-y-2">
            <p><span className="text-indigo-400">Address:</span> {account}</p>
            <p><span className="text-indigo-400">Balance:</span> {balance} ETH</p>
          </div>
        )}

        {account && (
          <nav className="flex flex-col space-y-2 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 text-left rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Mobile Tabs */}
        {account && (
          <div className="flex md:hidden space-x-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-center rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Active Section */}
        {account && (
          <div className="space-y-4">
            {activeTab === "lock" && <LockForm account={account} />}
            {activeTab === "ping" && <PingButton />}
            {activeTab === "log" && <ActivityLog account={account} />}
          </div>
        )}

        {!account && (
          <p className="text-gray-400 text-center mt-20">
            Connect your wallet to access PulseTrack features.
          </p>
        )}
      </main>
    </div>
  );
}
