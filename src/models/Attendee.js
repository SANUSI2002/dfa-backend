import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    phone: {
      type: String
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    eventTitle: {
      type: String
    },

    ticketType: {
      type: String,
      required: true
    },

    amountPaid: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      default: "Paid"
    },

    checkedIn: {
      type: Boolean,
      default: false
    },

    qrCode: {
      type: String
    },

    ticketId: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

const Attendee = mongoose.model(
  "Attendee",
  attendeeSchema
);

export default Attendee;