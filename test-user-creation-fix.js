const axios = require('axios');

// Use environment variable or default to sahalcard.com
const API_BASE_URL = process.env.API_URL 
  ? `${process.env.API_URL}/api` 
  : process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL
  : 'https://sahalcard.com/api';

async function testUserCreationWithImage() {
  try {
    console.log('🧪 Testing user creation with image upload...\n');

    // Step 1: Login as superadmin
    console.log('1️⃣ Logging in as superadmin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone: '+252613273911',
      password: 'maandhise11'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');

    // Step 2: Test image upload
    console.log('\n2️⃣ Testing image upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(`${API_BASE_URL}/upload/file`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Image upload successful');
    console.log('📸 Image URL:', uploadResponse.data.data.url);

    // Step 3: Test user creation with profile picture
    console.log('\n3️⃣ Testing user creation with profile picture...');
    
    const userData = {
      fullName: 'Test User ' + Date.now(),
      phone: '+25261' + Math.floor(Math.random() * 10000000),
      role: 'customer',
      idNumber: 'ID' + Math.floor(Math.random() * 1000000),
      profilePicUrl: uploadResponse.data.data.url,
      registrationDate: new Date().toISOString(),
      amount: 12
    };

    const createUserResponse = await axios.post(`${API_BASE_URL}/auth/create-user`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ User creation successful');
    console.log('👤 Created user:', createUserResponse.data.data.user.fullName);
    console.log('📸 Profile picture URL:', createUserResponse.data.data.user.profilePicUrl);

    // Step 4: Test image URL refresh
    console.log('\n4️⃣ Testing image URL refresh...');
    
    const refreshResponse = await axios.post(`${API_BASE_URL}/upload/refresh-url`, {
      fileUrl: uploadResponse.data.data.url
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ URL refresh successful');
    console.log('🔄 Refreshed URL:', refreshResponse.data.data.url);

    // Step 5: Test getting all users
    console.log('\n5️⃣ Testing get all users...');
    
    const usersResponse = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Users retrieved successfully');
    console.log('👥 Total users:', usersResponse.data.data.users.length);

    console.log('\n🎉 All tests passed! User creation and image handling is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserCreationWithImage();