export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { roomName } = req.body || {};

    // Check room name
    if (!roomName) {
      return res.status(400).json({
        error: "roomName is required"
      });
    }

    // Get Vercel Environment Variables
    const domain = process.env.METERED_DOMAIN;
    const secretKey = process.env.METERED_SECRET_KEY;

    if (!domain) {
      return res.status(500).json({
        error: "METERED_DOMAIN is missing"
      });
    }

    if (!secretKey) {
      return res.status(500).json({
        error: "METERED_SECRET_KEY is missing"
      });
    }

    // Metered API
    const url =
      `https://${domain}/api/v1/room?secretKey=${encodeURIComponent(
        secretKey
      )}`;

    console.log("Creating Metered room:", roomName);

    const response = await fetch(url, {
      method: "POST",

      headers: {
        Accept: "application/json",
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
        raw: text
      };
    }

    console.log("Metered response status:", response.status);
    console.log("Metered response:", data);

    // If room already exists, that's okay.
    // The existing room can still be joined.
    if (
      !response.ok &&
      response.status !== 409
    ) {
      return res.status(response.status).json({
        error: "Metered room creation failed",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      roomName: roomName,
      data: data
    });

  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      error: "Failed to create Metered room",
      details: error.message
    });
  }
}
