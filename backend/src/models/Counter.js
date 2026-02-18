const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Static method to get next sequence
counterSchema.statics.getNextSequence = async function (name, startFrom = 1) {
    try {
        const counter = await this.findByIdAndUpdate(
            name,
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // If the sequence is just created (or was lower than startFrom), ensure it starts from startFrom
        // Note: $inc happens before the result is returned if we use new: true.
        // If it's a new document, seq will be 1 (default 0 + 1).
        // If we want to force start from 7, we need to handle the initial case better.

        if (counter.seq < startFrom) {
            // Create/Update it to startFrom
            // Use findOneAndUpdate again to set it strictly if it's too low
            // This is a bit race-condition prone if specific start needed, but for "start from 7" on fresh db:
            const corrected = await this.findByIdAndUpdate(
                name,
                { $set: { seq: startFrom } },
                { new: true }
            );
            return corrected.seq;
        }

        return counter.seq;
    } catch (error) {
        throw error;
    }
};

// Static method to peek next sequence without incrementing
counterSchema.statics.peekNextSequence = async function (name, startFrom = 1) {
    try {
        const counter = await this.findById(name);
        if (!counter) {
            return startFrom;
        }
        // The current seq is the LAST used ID. So next one is seq + 1.
        // If current seq < startFrom - 1, we should theoretically jump to startFrom.
        // But getNextSequence handles the jump. Here we just want to predict.
        // If seq is 0 (default), next is 1.
        // If we want to enforce startFrom logic here too:
        if (counter.seq < startFrom - 1) {
            return startFrom;
        }
        return counter.seq + 1;
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('Counter', counterSchema);
