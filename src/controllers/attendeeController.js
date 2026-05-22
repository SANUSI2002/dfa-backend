import Attendee from "../models/Attendee.js";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Create attendee after cash payment (walk-in)
 * Generates QR code and sends confirmation email via Resend
 */
export const createAttendee = async (req, res) => {
  try {
    const { name, email, phone, eventId, eventTitle, ticketType, amountPaid } = req.body;

    // Validate required fields
    if (!name || !email || !eventId || !ticketType || amountPaid === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, eventId, ticketType, amountPaid",
      });
    }

    // Generate unique ticket ID
    const ticketId = "DFA-" + uuidv4().slice(0, 8).toUpperCase();

    // Generate QR code (contains ticketId for scanning)
    const qrData  = JSON.stringify({ ticketId, email, eventTitle });
    const qrCode  = await QRCode.toDataURL(qrData);

    // Save attendee to database
    const attendee = await Attendee.create({
      name,
      email,
      phone,
      eventId,
      eventTitle,
      ticketType,
      amountPaid,
      ticketId,
      qrCode,
    });

    // Respond immediately so the admin doesn't wait
    res.status(201).json({ success: true, attendee });

    // Send confirmation email in background (non-blocking)
    try {
      await resend.emails.send({
        from:    "DFA Events <tickets@dfaummah.com>", // ← change to your verified Resend domain
        to:      [email],
        subject: `Your DFA Ticket — ${eventTitle || "Event"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">

            <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <div style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);padding:32px 28px;text-align:center;">
                <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                  <span style="color:#fff;font-weight:800;font-size:16px;">DFA</span>
                </div>
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Your Ticket is Confirmed!</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Thank you for registering</p>
              </div>

              <!-- Body -->
              <div style="padding:28px;">

                <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi <strong>${name}</strong>,</p>
                <p style="color:#6B7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
                  Your ticket for <strong>${eventTitle || "the event"}</strong> has been confirmed.
                  Please present the QR code below at the entrance.
                </p>

                <!-- Ticket details card -->
                <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Event</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;text-align:right;">${eventTitle || "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Ticket Type</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;text-align:right;">${ticketType}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;text-align:right;">₦${Number(amountPaid).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Ticket ID</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:700;color:#8B5CF6;text-align:right;font-family:monospace;">${ticketId}</td>
                    </tr>
                  </table>
                </div>

                <!-- QR Code -->
                <div style="text-align:center;margin-bottom:24px;">
                  <p style="color:#374151;font-size:13px;font-weight:600;margin:0 0 12px;">Your Gate Pass</p>
                  <img src="${qrCode}" alt="QR Code" width="200" height="200"
                    style="border:4px solid #F3F4F6;border-radius:12px;display:block;margin:0 auto;" />
                  <p style="color:#9CA3AF;font-size:11px;margin:10px 0 0;">Show this at the entrance to get in</p>
                </div>

                <!-- Info box -->
                <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
                  <p style="color:#166534;font-size:12px;margin:0;">
                    ✅ Keep this email safe. Your QR code is your official gate pass and can only be scanned once.
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 28px;text-align:center;">
                <p style="color:#9CA3AF;font-size:12px;margin:0;">
                  DFA Events · <a href="https://dfaummah.com" style="color:#8B5CF6;text-decoration:none;">dfaummah.com</a>
                </p>
                <p style="color:#D1D5DB;font-size:11px;margin:6px 0 0;">
                  Questions? Reply to this email or contact us on WhatsApp
                </p>
              </div>

            </div>
          </body>
          </html>
        `,
      });

      console.log(`✅ Ticket email sent to ${email} — ${ticketId}`);
    } catch (emailError) {
      // Email failure doesn't affect the attendee creation
      console.error("❌ Email failed:", emailError.message);
    }

  } catch (error) {
    console.error("Create attendee error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all attendees
 * Returns list sorted by newest first
 */
export const getAttendees = async (req, res) => {
  try {
    const attendees = await Attendee.find().sort({ createdAt: -1 });
    res.json({ success: true, attendees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check in attendee by ticketId
 * Called by QR scanner or manual check-in button
 */
export const checkInAttendee = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: "ticketId is required" });
    }

    const attendee = await Attendee.findOne({ ticketId });

    if (!attendee) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (attendee.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Ticket already used — this person has already checked in",
      });
    }

    attendee.checkedIn = true;
    await attendee.save();

    console.log(`✅ Checked in: ${attendee.name} — ${ticketId}`);

    res.json({
      success: true,
      message: `${attendee.name} checked in successfully`,
      attendee,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete attendee by ID
 */
export const deleteAttendee = async (req, res) => {
  try {
    await Attendee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Attendee deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
