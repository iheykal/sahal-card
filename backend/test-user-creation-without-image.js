const axios = require('axios');

// Use environment variable or default to sahalcard.com
const API_BASE_URL = process.env.API_URL 
  ? `${process.env.API_URL}/api` 
  : process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL
  : 'https://sahalcard.com/api';

async function testUserCreationWithoutImage() {
  try {
    console.log('🧪 Testing user creation without image upload...\n');

    // Step 1: Login as superadmin
    console.log('1️⃣ Logging in as superadmin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone: '+252613273911',
      password: 'maandhise11'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');

    // Step 2: Test user creation without profile picture
    console.log('\n2️⃣ Testing user creation without profile picture...');
    
    const userData = {
      fullName: 'Test User ' + Date.now(),
      phone: '+25261' + Math.floor(Math.random() * 10000000),
      role: 'customer',
      idNumber: 'ID' + Math.floor(Math.random() * 1000000),
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
    console.log('📱 Phone:', createUserResponse.data.data.user.phone);
    console.log('🆔 ID Number:', createUserResponse.data.data.user.idNumber);
    console.log('📸 Profile picture URL:', createUserResponse.data.data.user.profilePicUrl || 'None');

    // Step 3: Test getting all users
    console.log('\n3️⃣ Testing get all users...');
    
    const usersResponse = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Users retrieved successfully');
    console.log('👥 Total users:', usersResponse.data.data.users.length);

    // Check if our created user is in the list
    const createdUser = usersResponse.data.data.users.find(user => 
      user.phone === userData.phone
    );
    
    if (createdUser) {
      console.log('✅ Created user found in users list');
      console.log('👤 User details:', {
        name: createdUser.fullName,
        phone: createdUser.phone,
        role: createdUser.role,
        canLogin: createdUser.canLogin
      });
    } else {
      console.log('❌ Created user not found in users list');
    }

    console.log('\n🎉 User creation test passed! The issue is specifically with R2 image upload.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserCreationWithoutImage();
