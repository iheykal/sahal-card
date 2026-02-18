require('dotenv').config();
const mongoose = require('mongoose');

const fixPhoneIndex = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}:`, JSON.stringify(idx.key), idx.unique ? '(unique)' : '', idx.sparse ? '(sparse)' : '');
    });

    // Find phone index
    const phoneIndex = indexes.find(idx => idx.name === 'phone_1' || idx.key?.phone === 1);
    
    if (phoneIndex) {
      console.log('\n🔍 Found phone index:', phoneIndex.name);
      console.log('   Sparse:', phoneIndex.sparse || false);
      console.log('   Unique:', phoneIndex.unique || false);

      if (!phoneIndex.sparse) {
        console.log('\n⚠️  Phone index is NOT sparse - dropping it...');
        try {
          await collection.dropIndex('phone_1');
          console.log('✅ Dropped old phone index');
        } catch (error) {
          console.error('❌ Error dropping index:', error.message);
          await mongoose.disconnect();
          process.exit(1);
        }
      } else {
        console.log('✅ Phone index is already sparse');
        await mongoose.disconnect();
        process.exit(0);
      }
    } else {
      console.log('\n⚠️  Phone index not found');
    }

    // Create sparse unique index
    console.log('\n🔧 Creating sparse unique phone index...');
    try {
      await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_1' });
      console.log('✅ Created sparse unique phone index');
    } catch (error) {
      console.error('❌ Error creating index:', error.message);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Verify
    const newIndexes = await collection.indexes();
    const newPhoneIndex = newIndexes.find(idx => idx.name === 'phone_1' || idx.key?.phone === 1);
    console.log('\n✅ Verification:');
    console.log('   Index name:', newPhoneIndex.name);
    console.log('   Sparse:', newPhoneIndex.sparse || false);
    console.log('   Unique:', newPhoneIndex.unique || false);

    console.log('\n✅ Phone index fixed successfully!');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixPhoneIndex();

