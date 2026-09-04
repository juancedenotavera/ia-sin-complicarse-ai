const MODEL = "fal-ai/wan/v2.7/text-to-video";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { prompt, aspectRatio, duration } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Escribe un prompt." });
    }

    const { fal } = await import("@fal-ai/client");

    fal.config({
      credentials: process.env.FAL_KEY,
    });

    const allowedRatios = ["16:9", "9:16", "1:1"];
    const ratio = allowedRatios.includes(aspectRatio)
      ? aspectRatio
      : "9:16";

    const requestedDuration = Number(duration);
    const videoDuration = [5, 10, 15].includes(requestedDuration)
      ? requestedDuration
      : 5;

    const { request_id } = await fal.queue.submit(MODEL, {
      input: {
        prompt: prompt.trim(),
        aspect_ratio: ratio,
        resolution: "720p",
        duration: videoDuration,
        enable_prompt_expansion: true,
        enable_safety_checker: true,
      },
    });

    return res.status(200).json({
      success: true,
      requestId: request_id,
      model: MODEL,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "No se pudo iniciar la generación.",
      details: error?.message || "Error desconocido",
    });
  }
}
