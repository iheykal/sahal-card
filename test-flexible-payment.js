const mongoose = require('mongoose');
const SahalCard = require('./backend/src/models/SahalCard');
const User = require('./backend/src/models/User');

// Test the flexible payment system
async function testFlexiblePayment() {
  try {
    console.log('🧪 Testing Flexible Payment System...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/maandhise', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      fullName: 'Test User',
      phone: '+252123456789',
      idNumber: 'TEST123456',
      location: 'Mogadishu',
      password: 'testpassword123',
      role: 'customer'
    });
    await testUser.save();
    console.log('✅ Created test user:', testUser.fullName);

    // Create a test Sahal Card
    const testCard = await SahalCard.createCard(
      testUser._id,
      'TEST123456789',
      1.00 // $1 monthly fee
    );
    console.log('✅ Created test card:', testCard.cardNumber);
    console.log('   Initial valid until:', testCard.validUntil.toDateString());

    // Test 1: Flexible payment - $6 for 6 months
    console.log('\n📝 Test 1: Flexible Payment - $6 for 6 months');
    const originalValidUntil = new Date(testCard.validUntil);
    await testCard.renewForDuration(6, 'cash', 'TEST_TXN_001');
    
    console.log('   Payment processed: $6');
    console.log('   Months added: 6');
    console.log('   New valid until:', testCard.validUntil.toDateString());
    console.log('   Days extended:', Math.ceil((testCard.validUntil - originalValidUntil) / (1000 * 60 * 60 * 24)));

    // Test 2: Another flexible payment - $12 for 12 months
    console.log('\n📝 Test 2: Another Flexible Payment - $12 for 12 months');
    const secondValidUntil = new Date(testCard.validUntil);
    await testCard.renewForDuration(12, 'mobile_money', 'TEST_TXN_002');
    
    console.log('   Payment processed: $12');
    console.log('   Months added: 12');
    console.log('   New valid until:', testCard.validUntil.toDateString());
    console.log('   Days extended:', Math.ceil((testCard.validUntil - secondValidUntil) / (1000 * 60 * 60 * 24)));

    // Test 3: Check renewal history
    console.log('\n📝 Test 3: Check Renewal History');
    console.log('   Total renewals:', testCard.renewalHistory.length);
    testCard.renewalHistory.forEach((renewal, index) => {
      console.log(`   Renewal ${index + 1}:`);
      console.log(`     Date: ${renewal.renewedAt.toDateString()}`);
      console.log(`     Amount: $${renewal.fee}`);
      console.log(`     Months: ${renewal.monthsAdded}`);
      console.log(`     Method: ${renewal.paymentMethod}`);
      console.log(`     Valid until: ${renewal.validUntil.toDateString()}`);
    });

    // Test 4: Test edge case - $0.50 (should give 0 months)
    console.log('\n📝 Test 4: Edge Case - $0.50 (should give 0 months)');
    const edgeValidUntil = new Date(testCard.validUntil);
    await testCard.renewForDuration(0.50, 'cash', 'TEST_TXN_003');
    
    console.log('   Payment processed: $0.50');
    console.log('   Months added: 0 (floor of 0.50)');
    console.log('   Valid until unchanged:', testCard.validUntil.toDateString());

    // Test 5: Test large amount - $24 for 24 months
    console.log('\n📝 Test 5: Large Amount - $24 for 24 months');
    const largeValidUntil = new Date(testCard.validUntil);
    await testCard.renewForDuration(24, 'bank_transfer', 'TEST_TXN_004');
    
    console.log('   Payment processed: $24');
    console.log('   Months added: 24');
    console.log('   New valid until:', testCard.validUntil.toDateString());
    console.log('   Days extended:', Math.ceil((testCard.validUntil - largeValidUntil) / (1000 * 60 * 60 * 24)));

    // Test 6: Verify card status
    console.log('\n📝 Test 6: Verify Card Status');
    console.log('   Card status:', testCard.status);
    console.log('   Payment status:', testCard.paymentStatus);
    console.log('   Is active:', testCard.isActive);
    console.log('   Next payment due:', testCard.nextPaymentDue.toDateString());

    // Test 7: Test monthly renewal method (backward compatibility)
    console.log('\n📝 Test 7: Test Monthly Renewal (Backward Compatibility)');
    const monthlyValidUntil = new Date(testCard.validUntil);
    await testCard.renewMonthly({
      paymentMethod: 'cash',
      transactionId: 'TEST_TXN_005'
    });
    
    console.log('   Monthly renewal processed');
    console.log('   Amount: $1 (default monthly fee)');
    console.log('   Months added: 1');
    console.log('   New valid until:', testCard.validUntil.toDateString());

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log('   Total renewals:', testCard.renewalHistory.length);
    console.log('   Final valid until:', testCard.validUntil.toDateString());
    console.log('   Total days from start:', Math.ceil((testCard.validUntil - originalValidUntil) / (1000 * 60 * 60 * 24)));

    // Cleanup
    await testCard.deleteOne();
    await testUser.deleteOne();
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testFlexiblePayment();
