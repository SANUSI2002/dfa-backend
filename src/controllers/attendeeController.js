import Attendee from "../models/Attendee.js";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import SibApiV3Sdk from "sib-api-v3-sdk";

/**
 * Create attendee after payment
 */
export const createAttendee = async (
  req,
  res
) => {

  try {

    const {
      name,
      email,
      phone,
      eventId,
      eventTitle,
      ticketType,
      amountPaid
    } = req.body;

    /**
     * Generate ticket ID
     */
    const ticketId =
      "DFA-" +
      uuidv4()
        .slice(0, 8)
        .toUpperCase();

    /**
     * Generate QR code
     */
    const qrData =
      JSON.stringify({
        ticketId,
        email
      });

    const qrCode =
      await QRCode.toDataURL(
        qrData
      );

    /**
     * Save attendee
     */
    const attendee =
      await Attendee.create({

        name,
        email,
        phone,
        eventId,
        eventTitle,
        ticketType,
        amountPaid,
        ticketId,
        qrCode

      });

    /**
     * Return success immediately
     */
    res.status(201).json({

      success: true,
      attendee

    });

    /**
     * Send email in background
     */
    try {

   const defaultClient =
  SibApiV3Sdk.ApiClient.instance;

const apiKey =
  defaultClient.authentications[
    "api-key"
  ];

apiKey.apiKey =
  process.env.BREVO_API_KEY;

const apiInstance =
  new SibApiV3Sdk.TransactionalEmailsApi();

await apiInstance.sendTransacEmail({

  sender: {

    email:
      "sanusidamilare333@gmail.com",

    name:
      "DFA"

  },

  to: [
    {
      email
    }
  ],

  subject:
    "Your DFA Event Ticket",

  htmlContent: `

    <div style="font-family:sans-serif;padding:20px;">

      <h2>
        Thank you for purchasing your ticket 🎉
      </h2>

      <p>
        Event:
        <strong>${eventTitle}</strong>
      </p>

      <p>
        Ticket Type:
        <strong>${ticketType}</strong>
      </p>

      <p>
        Ticket ID:
        <strong>${ticketId}</strong>
      </p>

      <p>
        Please present this QR code at the entrance.
      </p>

      <img
        src="${qrCode}"
        width="250"
      />

      <p>
        This QR code is your official gate pass.
      </p>

    </div>

  `

});

console.log(
  "Email sent successfully"
);
    } catch (emailError) {

      console.log(
        "Email failed:",
        emailError.message
      );

    }

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};

/**
 * Get attendees
 */
export const getAttendees =
  async (req, res) => {

    try {

      const attendees =
        await Attendee.find()
        .sort({ createdAt: -1 });

      res.json({

        success: true,
        attendees

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        message: error.message

      });

    }

};

/**
 * Check in attendee
 */
export const checkInAttendee =
  async (req, res) => {

    try {

      const { ticketId } =
        req.body;

      const attendee =
        await Attendee.findOne({
          ticketId
        });

      if (!attendee) {

        return res.status(404).json({

          success: false,

          message:
            "Ticket not found"

        });

      }

      if (attendee.checkedIn) {

        return res.status(400).json({

          success: false,

          message:
            "Ticket already used"

        });

      }

      attendee.checkedIn = true;

      await attendee.save();

      res.json({

        success: true,

        message:
          "Checked in successfully",

        attendee

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

};

/**
 * Delete attendee
 */
export const deleteAttendee =
  async (req, res) => {

    try {

      await Attendee.findByIdAndDelete(
        req.params.id
      );

      res.json({

        success: true,

        message:
          "Attendee deleted"

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

};
