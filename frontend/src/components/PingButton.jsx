import React, { useState } from "react";
import { getContract } from "../utils/contract";

export default function PingButton() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handlePing = async () => {
    if (!window.ethereum) return alert("MetaMask not found!");
    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.ping();
      await tx.wait();
      setTxHash(tx.hash);
      alert("Ping recorded successfully!");
    } catch (err) {
      console.error(err);
      alert("Ping failed or cancelled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-5 rounded-2xl shadow-md mt-4 text-center">
      <h2 className="text-xl font-semibold text-indigo-400 mb-3">🫀 Manual Ping</h2>
      <button onClick={handlePing} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl shadow-lg transition-all">
        {loading ? "Pinging..." : "Send Ping"}
      </button>
      {txHash && (
        <p className="text-sm text-gray-400 mt-2">
          ✅ Tx:{" "}
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
            {txHash.slice(0, 10)}...
          </a>
        </p>
      )}
    </div>
  );
}
