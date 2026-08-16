export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // Read request body
    const { roomName } = req.body || {};

    // Validate room name
    if (!roomName || typeof roomName !== "string") {
      return res.status(400).json({
        success: false,
        error: "roomName is required"
      });
    }

    // Clean room name
    const cleanRoomName = roomName.trim();

    if (!cleanRoomName) {
      return res.status(400).json({
        success: false,
        error: "roomName cannot be empty"
      });
    }

    // Metered environment variables
    const domain = process.env.METERED_DOMAIN;
    const secretKey = process.env.METERED_SECRET_KEY;

    // Check environment variables
    if (!domain) {
      console.error("METERED_DOMAIN is missing");

      return res.status(500).json({
        success: false,
        error: "METERED_DOMAIN is missing in Vercel Environment Variables"
      });
    }

    if (!secretKey) {
      console.error("METERED_SECRET_KEY is missing");

      return res.status(500).json({
        success: false,
        error: "METERED_SECRET_KEY is missing in Vercel Environment Variables"
      });
    }

    // Remove accidental https:// or trailing slash
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    // Metered Create Room API
    const url =
      `https://${cleanDomain}/api/v1/room` +
      `?secretKey=${encodeURIComponent(secretKey)}`;

    console.log("Creating Metered room:", cleanRoomName);

    // Call Metered API
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        roomName: cleanRoomName,
        privacy: "public"
      })
    });

    // Read response
    const text = await response.text();

    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        raw: text
      };
    }

    console.log("Metered response status:", response.status);

    // Room already exists
    if (
      response.status === 409 ||
      (
        typeof data?.error === "string" &&
        data.error.toLowerCase().includes("already")
      ) ||
      (
        typeof data?.message === "string" &&
        data.message.toLowerCase().includes("already")
      )
    ) {
      console.log("Room already exists:", cleanRoomName);

      return res.status(200).json({
        success: true,
        roomName: cleanRoomName,
        alreadyExists: true
      });
    }

    // Metered returned an error
    if (!response.ok) {
      console.error("Metered API error:", {
        status: response.status,
        data
      });

      return res.status(502).json({
        success: false,
        error: "Metered room creation failed",
        status: response.status,
        details: data
      });
    }

    // Success
    console.log("Room created successfully:", cleanRoomName);

    return res.status(200).json({
      success: true,
      roomName: cleanRoomName,
      alreadyExists: false,
      data
    });

  } catch (error) {
    console.error("Create room server error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create Metered room",
      details: error?.message || "Unknown server error"
    });
  }
}
