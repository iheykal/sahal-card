const fetch = require('node-fetch');

async function testSearchEndpoint() {
  try {
    console.log('Testing search endpoint...');
    
    const response = await fetch('http://192.168.100.32:5000/api/auth/search-by-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idNumber: '0083' })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Search endpoint is working!');
    } else {
      console.log('❌ Search endpoint failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testSearchEndpoint();







