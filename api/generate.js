const MODEL = "fal-ai/wan/v2.7/text-to-video";

export default async function handler(req, res) {
  try {
    const { fal } = await import("@fal-ai/client");

    fal.config({
      credentials: process.env.FAL_KEY,
    });

    // CONSULTAR ESTADO DE UNA GENERACIÓN
    if (req.method === "GET") {
      const requestId = req.query?.requestId;

      if (!requestId) {
        return res.status(400).json({
          error: "Falta requestId",
        });
      }

      const status = await fal.queue.status(MODEL, {
        requestId,
      });

      if (status.status === "COMPLETED") {
        const result = await fal.queue.result(MODEL, {
          requestId,
        });

        return res.status(200).json({
          status: "COMPLETED",
          video: result.data?.video?.url || null,
        });
      }

      return res.status(200).json({
        status: status.status,
      });
    }

    // CREAR UNA NUEVA GENERACIÓN
    if (req.method === "POST") {
      const { prompt, aspectRatio, duration } = req.body || {};

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          error: "Escribe un prompt.",
        });
      }

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
      });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "No se pudo procesar la solicitud.",
      details: error?.message || "Error desconocido",
    });
  }
}
