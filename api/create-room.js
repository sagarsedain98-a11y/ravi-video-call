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
        error: "Metered environment variables are missing"
      });
    }

    const response = await fetch(
      `https://${domain}/api/v1/room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomName: roomName,
          secretKey: secretKey
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create Metered room"
    });
  }
}
