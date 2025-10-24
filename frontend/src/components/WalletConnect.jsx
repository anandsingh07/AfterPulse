import React from "react";
import { ethers } from "ethers";

export default function WalletConnect({ account, setAccount, setBalance }) {
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not found!");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const balance = await provider.getBalance(accounts[0]);
      const ethBalance = ethers.formatEther(balance);

      setAccount(accounts[0]);
      setBalance(parseFloat(ethBalance).toFixed(4));
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(0);
  };

  return (
    <div className="flex space-x-4">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-lg"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={disconnectWallet}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl shadow-lg"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
