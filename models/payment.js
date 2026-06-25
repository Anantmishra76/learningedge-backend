// Model for payment records
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['Completed', 'Failed', 'Pending'],
        default: 'Completed'
    },
    paymentMethod: {
        type: String,
        default: 'Razorpay'
    },
    razorpayOrderId: {
        type: String,
        required: true
    },
    razorpayPaymentId: {
        type: String,
        required: true
    }
}, { timestamps: true });

paymentSchema.index(
    { userId: 1, courseId: 1, razorpayPaymentId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
