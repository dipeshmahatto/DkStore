import mongoose, { modelNames } from 'mongoose'

const orderSchema  = new mongoose.Schema({
    userId: {type: String, required : true},
    items: {type: Array, required : true},
    amount: {type: Number, required : true},
    address: {type: Object, required : true},
    status: {type: String, required : true, default:'Order Placed'},
    // Full timestamped log of every status change, so both admin and
    // customer can see exactly when each stage happened - not just the
    // current status.
    statusHistory: {
        type: [
            {
                status: { type: String, required: true },
                date: { type: Number, required: true },
            }
        ],
        default: () => [{ status: 'Order Placed', date: Date.now() }],
    },
    paymentMethod: {type: String, required : true},
    payment: {type: Boolean, required : true , default:false},
    date: {type: Number, required : true},
})

const orderModel = mongoose.models.order || mongoose.model('order',orderSchema)

export default orderModel;