import React, { useEffect, useState } from "react";
import { getContract } from "../utils/contract";

export default function ActivityLog({ account }) {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    if (!account) return;
    try {
      const contract = await getContract();
      const activity = await contract.getActivityLog(account);
      setLogs(activity.map(ts => new Date(ts * 1000).toLocaleString()));
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  };

  useEffect(() => { fetchLogs(); }, [account]);

  return (
    <div className="bg-gray-900 p-4 rounded-2xl shadow-md mt-4">
      <h2 className="text-lg font-semibold text-indigo-400 mb-2">📝 Activity Log</h2>
      {logs.length === 0 ? <p className="text-gray-400">No activity yet.</p> : (
        <ul className="list-disc list-inside text-gray-100">
          {logs.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      )}
    </div>
  );
}
