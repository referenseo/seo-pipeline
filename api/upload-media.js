export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const wpUrl = req.headers["x-wp-url"];
  const authorization = req.headers["authorization"];
  const contentType = req.headers["content-type"];
  const filename = req.headers["x-filename"] || "image.jpg";
  if (!wpUrl || !authorization) {
    return res.status(400).json({ error: "Missing headers" });
  }
  try {
    const mediaUrl = `${wpUrl.replace(/\/$/, "")}/wp-json/wp/v2/media`;
    const wpRes = await fetch(mediaUrl, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body,
    });
    const data = await wpRes.json();
    if (!wpRes.ok) return res.status(wpRes.status).json({ error: data.message || "WordPress error" });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
