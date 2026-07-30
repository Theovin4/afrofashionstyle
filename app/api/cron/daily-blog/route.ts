import { publishDailyBlogPost } from "../../../lib/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await publishDailyBlogPost());
  } catch (error) {
    console.error("Daily blog publication failed", error);
    return Response.json({ error: "Daily post could not be published" }, { status: 500 });
  }
}
