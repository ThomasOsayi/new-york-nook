import { NextRequest, NextResponse } from "next/server";
import { createConsultation } from "@/lib/consultation";
import type { ConsultationData } from "@/lib/consultation";

export async function POST(req: NextRequest) {
  try {
    const body: ConsultationData = await req.json();

    /* ── Validate required fields ── */
    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }
    if (!body.eventType?.trim()) {
      return NextResponse.json({ error: "Event type is required." }, { status: 400 });
    }

    /* ── Save to Firestore ── */
    const { id, referenceNumber } = await createConsultation(body);

    /* ── Send email via Resend ── */
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.CONSULTATION_NOTIFY_EMAIL || "events@nynook.com";

    if (resendKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "New York Nook <onboarding@resend.dev>",
            to: [notifyEmail],
            subject: `New Catering Inquiry — ${referenceNumber}`,
            html: buildEmailHtml(body, referenceNumber),
          }),
        });

        const resendData = await emailRes.json();
        console.log("Resend response:", emailRes.status, JSON.stringify(resendData));
      } catch (emailErr) {
        // Log but don't fail the request — Firestore write already succeeded
        console.error("Resend email failed:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY not set — skipping email notification.");
    }

    return NextResponse.json({ id, referenceNumber }, { status: 201 });
  } catch (err: any) {
    console.error("Consultation API error:", err);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

/* ── Email template ── */

function buildEmailHtml(data: ConsultationData, ref: string): string {
  const row = (label: string, value: string) =>
    value ? `<tr><td style="padding:8px 16px;font-size:13px;color:#888;border-bottom:1px solid #1a1a1a;width:140px">${label}</td><td style="padding:8px 16px;font-size:14px;color:#fff;border-bottom:1px solid #1a1a1a">${value}</td></tr>` : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080603;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:3px;margin-bottom:4px">NEW YORK NOOK</div>
      <div style="font-size:9px;letter-spacing:4px;color:#C9A050;text-transform:uppercase">Catering Inquiry</div>
    </div>

    <!-- Reference -->
    <div style="background:#0C0A07;border:1px solid rgba(201,160,80,0.15);padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:3px;color:#C9A050;text-transform:uppercase;margin-bottom:8px">Reference Number</div>
      <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:2px">${ref}</div>
    </div>

    <!-- Details -->
    <table style="width:100%;border-collapse:collapse;background:#0C0A07;border:1px solid rgba(201,160,80,0.1)">
      <tr><td colspan="2" style="padding:12px 16px;font-size:11px;letter-spacing:2px;color:#C9A050;text-transform:uppercase;border-bottom:1px solid rgba(201,160,80,0.15)">Contact Information</td></tr>
      ${row("Name", `${data.firstName} ${data.lastName}`)}
      ${row("Email", `<a href="mailto:${data.email}" style="color:#C9A050;text-decoration:none">${data.email}</a>`)}
      ${row("Phone", `<a href="tel:${data.phone}" style="color:#C9A050;text-decoration:none">${data.phone}</a>`)}
      
      <tr><td colspan="2" style="padding:12px 16px;font-size:11px;letter-spacing:2px;color:#C9A050;text-transform:uppercase;border-bottom:1px solid rgba(201,160,80,0.15)">Event Details</td></tr>
      ${row("Event Type", data.eventType)}
      ${row("Preferred Date", data.eventDate || "Not specified")}
      ${row("Guest Count", data.guestCount || "Not specified")}
      ${row("Budget Range", data.budget || "Not specified")}
      ${row("Package Interest", data.packageInterest || "Not selected")}
    </table>

    ${data.message ? `
    <div style="background:#0C0A07;border:1px solid rgba(201,160,80,0.1);border-top:none;padding:16px">
      <div style="font-size:11px;letter-spacing:2px;color:#C9A050;text-transform:uppercase;margin-bottom:8px">Special Requests</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7">${data.message.replace(/\n/g, "<br>")}</div>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.04)">
      <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0">Respond to this inquiry within 24 hours.</p>
      <p style="font-size:10px;color:rgba(255,255,255,0.1);margin:8px 0 0">7065 Sunset Blvd, Hollywood, CA 90028</p>
    </div>
  </div>
</body>
</html>`.trim();
}