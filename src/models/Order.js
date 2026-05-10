import mongoose from 'mongoose';

/**
 * Buyer details subdocument schema
 * Stores customer contact information
 */
const buyerDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Buyer name is required'],
      trim: true,
    },
    whatsapp: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      match: [/^\+?[\d\s\-()]{7,}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
  },
  { _id: false }
);

/**
 * Attendee subdocument schema
 * Stores details of additional guests/attendees with check-in capability
 */
const attendeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Attendee email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    whatsapp: {
      type: String,
      match: [/^\+?[\d\s\-()]{7,}$/, 'Please provide a valid phone number'],
    },
    ticketType: {
      type: String,
      trim: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    specialNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Special note cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

/**
 * Payment details subdocument schema
 * Tracks payment method and status
 */
const paymentSchema = new mongoose.Schema(
  {
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      enum: {
        values: ['Card', 'Transfer', 'Manual'],
        message: 'Payment method must be Card, Transfer, or Manual',
      },
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Successful', 'Failed'],
        message: 'Status must be Pending, Successful, or Failed',
      },
      default: 'Pending',
    },
    reference: {
      type: String,
      unique: true, // This automatically creates the index, so we don't need it at the bottom!
      sparse: true, // Allow multiple null values
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Order schema for ticket purchases
 * Stores guest checkout orders with ticket and payment details
 */
const orderSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true,
    },
    buyerDetails: {
      type: buyerDetailsSchema,
      required: [true, 'Buyer details are required'],
    },
    ticketType: {
      type: String,
      required: [true, 'Ticket type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100 per order'],
    },
    attendees: [attendeeSchema],
    payment: {
      type: paymentSchema,
      required: [true, 'Payment information is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validator to ensure attendees count matches quantity
 * (Assuming 1 ticket = 1 attendee, or primary buyer counts as attendee)
 */
orderSchema.pre('save', function (next) {
  // Allow flexibility: attendees array can have 0 to quantity items
  if (this.attendees && this.attendees.length > this.quantity) {
    throw new Error('Number of attendees cannot exceed ordered quantity');
  }
  next();
});

/**
 * Index for efficient queries
 */
orderSchema.index({ event: 1, createdAt: -1 });
orderSchema.index({ 'buyerDetails.email': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;