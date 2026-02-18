#!/usr/bin/env node

/**
 * Test login endpoint directly
 */

require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
  const API_URL = 'http://localhost:5001/api';

  console.log('🔄 Testing login endpoint...\n');
  console.log('URL:', `${API_URL}/auth/login`);

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      phone: '613273911',
      password: 'maandhise11'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Login successful!');
    console.log('Status:', response.status);
    console.log('User:', response.data.data.user.fullName);
    console.log('Role:', response.data.data.user.role);
    console.log('Access Token:', response.data.data.tokens.accessToken ? 'Present ✅' : 'Missing ❌');
    console.log('Refresh Token:', response.data.data.tokens.refreshToken ? 'Present ✅' : 'Missing ❌');

  } catch (error) {
    console.error('\n❌ Login failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ Backend server is NOT RUNNING!');
      console.error('Run: cd backend && npm run dev');
    }
  }
};

testLogin();
