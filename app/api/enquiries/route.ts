import { createAdminSupabase } from "../../lib/supabase";
import { sendCustomerEnquiry } from "../../lib/notifications";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "enquiry", 5, 60 * 60);
  if (limited) return limited;
  let input: { name?: string; email?: string; phone?: string; subject?: string; message?: string; website?: string };
  try { input = await readLimitedJson(request); } catch (error) { return payloadError(error); }
  if (String(input.website || "").trim()) return Response.json({ success: true, message: "Thank you. Your enquiry has been received." }, { status: 201 });
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();
  const subject = String(input.subject || "").trim();
  const message = String(input.message || "").trim();
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 2 || message.length < 10 || message.length > 3000) {
    return Response.json({ error: "Please complete every required enquiry field." }, { status: 400 });
  }
  const { error } = await createAdminSupabase().from("customer_enquiries").insert({ name, email, phone: phone || null, subject, message });
  if (error) return Response.json({ error: "Your enquiry could not be saved." }, { status: 500 });
  const delivery = await sendCustomerEnquiry({ name, email, phone, subject, message }).catch(() => ({ sent: false }));
  const whatsappMessage = `Hello Afro.Fashionstyle, I sent a website enquiry. Name: ${name}. Topic: ${subject}. Message: ${message}`;
  return Response.json({
    success: true,
    emailed: delivery.sent,
    whatsappUrl: `https://wa.me/2347049841931?text=${encodeURIComponent(whatsappMessage)}`,
    message: delivery.sent ? "Thank you. Your enquiry has been emailed to our support team." : "Your enquiry was saved. Please also send it to us on WhatsApp for the fastest response.",
  }, { status: 201 });
}
