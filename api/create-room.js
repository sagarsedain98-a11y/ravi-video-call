export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { roomName } = req.body || {};

    if (!roomName) {
      return res.status(400).json({
        error: "roomName is required"
      });
    }

    const domain = process.env.METERED_DOMAIN;
    const secretKey = process.env.METERED_SECRET_KEY;

    if (!domain || !secretKey) {
      return res.status(500).json({
        error: "METERED_DOMAIN or METERED_SECRET_KEY is missing"
      });
    }

    const url =
      `https://${domain}/api/v1/room?secretKey=${encodeURIComponent(secretKey)}`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        roomName: roomName,
        privacy: "public"
      })
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text
      };
    }

    if (!response.ok) {
      console.error("Metered API error:", data);

      return res.status(response.status).json({
        error: "Metered room creation failed",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Failed to create Metered room",
      details: error.message
    });
  }
}
