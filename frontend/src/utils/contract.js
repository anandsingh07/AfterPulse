import { ethers } from "ethers";
import contractABI from "./contractABI.json";

export const CONTRACT_ADDRESS = "0xD6c32D1B96B88E812cEd37e56aF5376660123db4";

export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

export const getBalance = async (account) => {
  if (!window.ethereum) return 0;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const balance = await provider.getBalance(account);
  return Number(ethers.formatEther(balance));
};
