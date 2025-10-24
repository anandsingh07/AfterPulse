import React, { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

export default function LockForm({ account }) {
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState("ETH"); // ETH or PYUSD
  const [lockDays, setLockDays] = useState("");
  const [graceDays, setGraceDays] = useState("");
  const [inactivityDays, setInactivityDays] = useState("");
  const [nominee, setNominee] = useState("");
  const [share, setShare] = useState("100");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleLock = async (e) => {
    e.preventDefault();

    if (!window.ethereum) return alert("MetaMask not found!");
    if (!amount || !nominee || !lockDays || !graceDays || !inactivityDays)
      return alert("Fill all fields!");
    if (Number(lockDays) < 1) return alert("Lock period must be at least 1 day");
    if (Number(inactivityDays) < 1)
      return alert("Inactivity period must be at least 1 day");
    if (Number(share) < 1 || Number(share) > 100) return alert("Share must be 1-100");

    try {
      setLoading(true);
      const contract = await getContract();
      const nominees = [{ wallet: nominee, share: Number(share) }];
      const lockSeconds = Number(lockDays) * 86400;
      const graceSeconds = Number(graceDays) * 86400;
      const inactivitySeconds = Number(inactivityDays) * 86400;

      let tx;
      if (tokenType === "ETH") {
        tx = await contract.lockETH(lockSeconds, nominees, graceSeconds, inactivitySeconds, {
          value: ethers.parseEther(amount),
        });
      } else {
        tx = await contract.lockPYUSD(
          ethers.parseUnits(amount, 18),
          lockSeconds,
          nominees,
          graceSeconds,
          inactivitySeconds
        );
      }

      await tx.wait();
      setTxHash(tx.hash);
      alert(`${tokenType} locked successfully!`);
    } catch (err) {
      console.error(err);
      alert(err?.reason || "Transaction failed or reverted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-md mt-4">
      <h2 className="text-xl font-semibold text-indigo-400 mb-3">
        🔒 Lock Funds & Add Nominee
      </h2>

      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => setTokenType("ETH")}
          className={`px-4 py-1 rounded-xl ${
            tokenType === "ETH" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200"
          }`}
        >
          ETH
        </button>
        <button
          type="button"
          onClick={() => setTokenType("PYUSD")}
          className={`px-4 py-1 rounded-xl ${
            tokenType === "PYUSD"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-200"
          }`}
        >
          PYUSD
        </button>
      </div>

      <form onSubmit={handleLock} className="space-y-3">
        <input
          type="number"
          step="0.01"
          placeholder={`Amount (${tokenType})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Lock Period (days)"
            value={lockDays}
            onChange={(e) => setLockDays(e.target.value)}
            className="bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
          />
          <input
            type="number"
            placeholder="Grace Period (days)"
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            className="bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
          />
        </div>

        <input
          type="number"
          placeholder="Inactivity Period (days)"
          value={inactivityDays}
          onChange={(e) => setInactivityDays(e.target.value)}
          className="w-full bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
        />

        <input
          type="text"
          placeholder="Nominee Wallet Address"
          value={nominee}
          onChange={(e) => setNominee(e.target.value)}
          className="w-full bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
        />

        <input
          type="number"
          placeholder="Share (%)"
          value={share}
          onChange={(e) => setShare(e.target.value)}
          className="w-full bg-gray-800 rounded-xl p-2 text-gray-100 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 font-semibold mt-2"
        >
          {loading ? `Locking ${tokenType}...` : `Lock ${tokenType}`}
        </button>

        {txHash && (
          <p className="text-sm text-gray-400 mt-2">
            ✅ Tx Hash:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline"
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}
      </form>
    </div>
  );
}
