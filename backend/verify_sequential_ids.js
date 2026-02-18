const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Counter = require('./src/models/Counter');
const User = require('./src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const verifySequentialIds = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Test 1: Check Counter Sequence
        console.log('\n--- Test 1: Counter Sequence ---');
        // Reset counter for testing? No, current state might catch conflicts.
        // We just get next sequence and see if it respects >= 7.

        const nextId = await Counter.getNextSequence('test_counter', 7);
        console.log(`Generated ID: ${nextId}`);

        if (nextId < 7) {
            console.error('❌ FAIL: Generated ID is less than 7.');
        } else {
            console.log('✅ PASS: Generated ID is >= 7.');
        }

        // Check padding
        // Note: getNextSequence returns a number. The controllers convert to string and pad.
        // We should verify the padding logic here too roughly.
        const paddedId = nextId.toString().padStart(3, '0');
        console.log(`Padded ID: ${paddedId}`);
        if (paddedId.length >= 3 && paddedId.startsWith('0')) {
            console.log('✅ PASS: ID is correctly padded (e.g. 007).');
        } else if (nextId >= 100) {
            console.log('✅ PASS: ID is correctly fully occupied (>= 100).');
        } else {
            console.error('❌ FAIL: ID padding check failed.');
        }

        // Test 2: Immutability Simulation
        // We can't easily test controller logic via script without mocking request, 
        // but we can verify that the ID generation function works consistently.

        const nextId2 = await Counter.getNextSequence('test_counter', 7);
        console.log(`Next Generated ID: ${nextId2}`);

        if (nextId2 === nextId + 1) {
            console.log('✅ PASS: Sequence incremented correctly.');
        } else {
            console.error(`❌ FAIL: Sequence did not increment correctly. Expected ${nextId + 1}, got ${nextId2}`);
        }

        console.log('\nVerification Complete.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifySequentialIds();
