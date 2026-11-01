import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: {
      type: [itemSchema],
      default: []
    }
  },
  { timestamps: true }
);

const Cart =
  mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;