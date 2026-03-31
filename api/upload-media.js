export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const imageBuffer = Buffer.concat(chunks);
  const wpUrl = req.headers["x-wp-url"];
  const authorization = req.headers["authorization"];
  const mimeType = req.headers["content-type"] || "image/png";
  const filename = req.headers["x-filename"] || "image.png";
  if (!wpUrl || !authorization) return res.status(400).json({ error: "Missing headers" });
  try {
    const mediaUrl = `${wpUrl.replace(/\/$/, "")}/wp-json/wp/v2/media`;
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("file", blob, filename);
    const wpRes = await fetch(mediaUrl, { method: "POST", headers: { Authorization: authorization }, body: formData });
    const text = await wpRes.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(wpRes.status||500).json({ error: `WP a répondu en HTML (${wpRes.status}): ${text.slice(0,300)}` }); }
    if (!wpRes.ok) return res.status(wpRes.status).json({ error: data.message || JSON.stringify(data) });
    return res.status(200).json(data);
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
