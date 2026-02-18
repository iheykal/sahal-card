const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    tripId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    passengerName: {
        type: String,
        required: [true, 'Passenger name is required'],
        trim: true
    },
    vehiclePlate: {
        type: String,
        required: [true, 'Vehicle plate is required'],
        trim: true,
        uppercase: true
    },
    fromLocation: {
        type: String,
        required: [true, 'From location is required'],
        trim: true
    },
    toLocation: {
        type: String,
        required: [true, 'To location is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['On Way', 'Completed'],
        default: 'On Way'
    },
    sosActive: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
tripSchema.index({ tripId: 1 }, { unique: true });
tripSchema.index({ userId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ sosActive: 1 });
tripSchema.index({ timestamp: -1 });

// Static method to generate unique trip ID
tripSchema.statics.generateTripId = async function () {
    let tripId;
    let exists = true;

    while (exists) {
        // Generate random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        tripId = `TX-${randomNum}`;

        // Check if this ID already exists
        const existingTrip = await this.findOne({ tripId });
        exists = !!existingTrip;
    }

    return tripId;
};

module.exports = mongoose.model('Trip', tripSchema);
