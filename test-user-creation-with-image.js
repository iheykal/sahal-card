const axios = require('axios');

async function testUserCreationWithImage() {
  console.log('=== Testing User Creation with Profile Image ===\n');
  
  try {
    // First, let's test the upload endpoint directly
    console.log('1. Testing image upload...');
    
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Create a FormData-like object for testing
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-profile.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post('http://192.168.100.32:5000/api/upload/file', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a valid token
      }
    });
    
    console.log('✅ Upload successful!');
    console.log('Upload response:', uploadResponse.data);
    
    const profilePicUrl = uploadResponse.data.data.url;
    console.log('Profile pic URL:', profilePicUrl);
    
    // Now test user creation with the profile image URL
    console.log('\n2. Testing user creation with profile image...');
    
    const userData = {
      fullName: 'Test User with Image',
      phone: '+252612345678',
      role: 'customer',
      idNumber: '12345',
      profilePicUrl: profilePicUrl
    };
    
    console.log('User data to send:', userData);
    
    const createUserResponse = await axios.post('http://192.168.100.32:5000/api/auth/create-user', userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a valid token
      }
    });
    
    console.log('✅ User creation successful!');
    console.log('Created user:', createUserResponse.data.data.user);
    
    // Check if profilePicUrl is in the response
    if (createUserResponse.data.data.user.profilePicUrl) {
      console.log('✅ Profile image URL is saved in database!');
      console.log('Profile image URL:', createUserResponse.data.data.user.profilePicUrl);
    } else {
      console.log('❌ Profile image URL is missing from user data!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Note: This test requires a valid authentication token
console.log('Note: This test requires a valid authentication token.');
console.log('Please replace YOUR_TOKEN_HERE with a valid JWT token from your login.');
console.log('You can get a token by logging in through your frontend.\n');

testUserCreationWithImage();


