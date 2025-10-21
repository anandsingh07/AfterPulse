// services/lighthouseService.js
const axios = require('axios');

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
const LIGHTHOUSE_UPLOAD_URL = 'https://api.lighthouse.storage/api/v0/add';

async function uploadUserProof(userProofJSON) {
    try {
        
        const jsonString = JSON.stringify(userProofJSON);

        const response = await axios.post(LIGHTHOUSE_UPLOAD_URL, jsonString, {
            headers: {
                'Authorization': LIGHTHOUSE_API_KEY,
                'Content-Type': 'application/json',
            }
        });

       
        return response.data.cid;
    } catch (error) {
        console.error('Error uploading to Lighthouse:', error.message);
        throw error;
    }
}

async function fetchUserProof(cid) {
    try {
        const response = await axios.get(`https://gateway.lighthouse.storage/ipfs/${cid}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching from Lighthouse:', error.message);
        throw error;
    }
}

module.exports = { uploadUserProof, fetchUserProof };
