const MODEL = "fal-ai/wan/v2.7/text-to-video";
const TTS_MODEL = "fal-ai/gemini-tts";
const IMAGE_MODEL = "fal-ai/flux-2-pro";
export default async function handler(req, res) {
  try {

    // ==========================================
    // GUARDAR FEEDBACK
    // ==========================================
    if (req.method === "POST" && req.body?.action === "feedback") {

      const { comentario, email } = req.body;

      if (!comentario || !comentario.trim()) {
return res.status(400).json({
  error: "Escribe un comentario."
});
      }

      const supabaseResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_SECRET_KEY,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            comentario: comentario.trim(),
            email: email?.trim() || null
          })
        }
      );

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("Supabase error:", errorText);

        return res.status(500).json({
          error: "No se pudo guardar el comentario."
        });
      }

      return res.status(200).json({
        success: true,
        message: "Comentario guardado correctamente."
      });
    }


    // ==========================================
    // FAL.AI
    // ==========================================
    const { fal } = await import("@fal-ai/client");

    fal.config({
      credentials: process.env.FAL_KEY,
    });


    // ==========================================
    // CONSULTAR ESTADO
    // ==========================================
    if (req.method === "GET") {
      if (req.query?.credits === "true") {
  const creditsResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/credits?id=eq.1&select=balance`,
    {
      method: "GET",
      headers: {
        "apikey": process.env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!creditsResponse.ok) {
    throw new Error("No se pudo consultar los créditos.");
  }

  const creditsData = await creditsResponse.json();

  return res.status(200).json({
    balance: Number(creditsData?.[0]?.balance || 0)
  });
}
if (req.query?.history === "true") {
const authHeader = req.headers.authorization;

if (!authHeader) {
  return res.status(401).json({
    error: "Debes iniciar sesión"
  });
}

const userResponse = await fetch(
  `${process.env.SUPABASE_URL}/auth/v1/user`,
  {
    headers: {
      "apikey": process.env.SUPABASE_PUBLISHABLE_KEY,
      "Authorization": authHeader
    }
  }
);

const userData = await userResponse.json();

if (!userResponse.ok) {
  return res.status(401).json({
    error: "Sesión inválida"
  });
}

const userId = userData.id;
  const videosResponse = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/videos?user_id=eq.${userId}&select=*&order=created_at.desc`,
    {
      method: "GET",
      headers: {
        "apikey": process.env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!videosResponse.ok) {
    throw new Error("No se pudo cargar el historial.");
  }

  const videos = await videosResponse.json();

  return res.status(200).json({
    success: true,
    videos
  });
}
      const requestId = req.query?.requestId;

      if (!requestId) {
        return res.status(400).json({
          error: "Falta requestId"
        });
      }

      const status = await fal.queue.status(MODEL, {
        requestId
      });

if (status.status === "COMPLETED") {

  const result = await fal.queue.result(MODEL, {
    requestId
  });

  const videoUrl = result.data?.video?.url || null;
const videoRecordResponse = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/videos?request_id=eq.${encodeURIComponent(requestId)}&select=audio_url`,
  {
    headers: {
      "apikey": process.env.SUPABASE_SECRET_KEY
    }
  }
);

const videoRecordData = await videoRecordResponse.json();

const audioUrl = videoRecordData?.[0]?.audio_url || null;

if (!audioUrl) {
  throw new Error("No se encontró el audio guardado.");
}
const lipsyncResult = await fal.subscribe("fal-ai/musetalk", {
  input: {
    source_video_url: videoUrl,
    audio_url: audioUrl
  }
});

const finalVideoUrl =
  lipsyncResult.data?.video?.url || null;

if (!finalVideoUrl) {
  throw new Error("No se pudo sincronizar el video con el audio.");
}
  
  await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/videos?request_id=eq.${encodeURIComponent(requestId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SECRET_KEY,
        "Prefer": "return=minimal"
      },
body: JSON.stringify({
  video_url: finalVideoUrl
})
    }
  );

  return res.status(200).json({
    status: "COMPLETED",
    video: videoUrl
  });
}
    

      return res.status(200).json({
        status: status.status
      });
    }


    // ==========================================
    // CREAR VIDEO
    // ==========================================

if (req.method === "DELETE") {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Debes iniciar sesión"
    });
  }

  const userResponse = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        "apikey": process.env.SUPABASE_PUBLISHABLE_KEY,
        "Authorization": authHeader
      }
    }
  );

  const userData = await userResponse.json();

  if (!userResponse.ok) {
    return res.status(401).json({
      error: "Sesión inválida"
    });
  }

  const userId = userData.id;
  const videoId = req.query?.id;

  if (!videoId) {
    return res.status(400).json({
      error: "Falta el ID del video"
    });
  }

  const deleteResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/videos?id=eq.${encodeURIComponent(videoId)}&user_id=eq.${userId}`,
    {
      method: "DELETE",
      headers: {
        "apikey": process.env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!deleteResponse.ok) {
    throw new Error("No se pudo eliminar el video.");
  }

  return res.status(200).json({
    success: true
  });
}
    
    if (req.method === "POST") {
const authHeader = req.headers.authorization;

if (!authHeader) {
  return res.status(401).json({
    error: "Debes iniciar sesión"
  });
}

const userResponse = await fetch(
  `${process.env.SUPABASE_URL}/auth/v1/user`,
  {
    headers: {
      "apikey": process.env.SUPABASE_PUBLISHABLE_KEY,
      "Authorization": authHeader
    }
  }
);

const userData = await userResponse.json();

if (!userResponse.ok) {
  return res.status(401).json({
    error: "Sesión inválida"
  });
}

const userId = userData.id;
      const { prompt, aspectRatio, duration } = req.body || {};
// ==========================================
// GENERAR IMAGEN
// ==========================================
if (req.body?.tipo === "imagen") {
const imageCost = 0.03;
const creditsResponse = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/credits?id=eq.1&select=balance,total_spent`,
  {
    headers: {
      "apikey": process.env.SUPABASE_SECRET_KEY
    }
  }
);

const creditsData = await creditsResponse.json();
const balance = Number(creditsData?.[0]?.balance || 0);
const totalSpent = Number(creditsData?.[0]?.total_spent || 0);

if (balance < imageCost) {
  return res.status(402).json({
    error: `Créditos insuficientes. Necesitas $${imageCost.toFixed(2)}.`
  });
}

await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/credits?id=eq.1`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SECRET_KEY,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      balance: balance - imageCost,
      total_spent: totalSpent + imageCost
    })
  }
);
  
  const imageResult = await fal.subscribe(IMAGE_MODEL, {
    input: {
      prompt: prompt.trim(),
      image_size: aspectRatio === "9:16"
        ? "portrait_4_3"
        : aspectRatio === "1:1"
        ? "square_hd"
        : "landscape_4_3",
      num_images: 1
    }
  });

  const imageUrl = imageResult.data?.images?.[0]?.url || null;

  if (!imageUrl) {
    throw new Error("No se pudo generar la imagen.");
  }

  return res.status(200).json({
    success: true,
    image: imageUrl
  });
}
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          error: "Escribe un prompt."
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
const cost = videoDuration * 0.10;
const creditsResponse = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/credits?id=eq.1&select=balance,total_spent`,
  {
    headers: {
      "apikey": process.env.SUPABASE_SECRET_KEY
    }
  }
);

const creditsData = await creditsResponse.json();
const balance = Number(creditsData?.[0]?.balance || 0);
const totalSpent = Number(creditsData?.[0]?.total_spent || 0);

if (balance < cost) {
  return res.status(402).json({
    error: `Créditos insuficientes. Necesitas $${cost.toFixed(2)}.`
  });
}
await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/credits?id=eq.1`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SECRET_KEY,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      balance: balance - cost,
total_spent: totalSpent + cost
    })
  }
);
      // ==========================================
      // GENERAR DIÁLOGO AUTOMÁTICAMENTE
      // ==========================================

      const dialoguePrompt = `
Crea un diálogo corto y natural para un video de ${videoDuration} segundos.

Idea del usuario:
${prompt.trim()}

Reglas:
- El personaje debe hablar de forma natural.
- El diálogo debe durar aproximadamente ${videoDuration} segundos.
- No describas la escena.
- No pongas etiquetas como "Personaje:".
- Devuelve solamente lo que debe decir el personaje.
- Hazlo entretenido y fácil de entender.
`;

const dialogueResponse = await fal.subscribe("fal-ai/any-llm", {
  input: {
    model: "google/gemini-flash-1.5",
    prompt: dialoguePrompt
  }
});

      const dialogue =
        dialogueResponse.data?.output ||
        dialogueResponse.data?.text ||
        dialogueResponse.data?.response ||
        "";

      if (!dialogue) {
        throw new Error("No se pudo generar el diálogo.");
      }

function detectarVoz(prompt) {
  const texto = prompt.toLowerCase();

  const palabrasFemeninas = [
    "mujer", "mujeres", "chica", "señora", "niña",
    "abuela", "madre", "mamá", "esposa", "joven mujer"
  ];

  const palabrasMasculinas = [
    "hombre", "hombres", "chico", "señor", "niño",
    "abuelo", "padre", "papá", "esposo", "joven hombre"
  ];

  if (palabrasFemeninas.some(palabra => texto.includes(palabra))) {
    return "Kore";
  }

  if (palabrasMasculinas.some(palabra => texto.includes(palabra))) {
    return "Puck";
  }

  return "Puck";
}
      // ==========================================
      // GENERAR VOZ
      // ==========================================

const voiceResult = await fal.subscribe(TTS_MODEL, {
  input: {
    prompt: dialogue,
voice: detectarVoz(prompt),
    model: "gemini-2.5-flash-tts",
language_code: "Spanish (Latin America)",
    output_format: "mp3"
  }
});

      const audioUrl =
        voiceResult.data?.audio?.url ||
        voiceResult.data?.audio_url ||
        null;

      if (!audioUrl) {
        throw new Error("No se pudo generar el audio.");
      }


      // ==========================================
      // GENERAR VIDEO CON LA VOZ
      // ==========================================

      const { request_id } = await fal.queue.submit(MODEL, {
        input: {
          prompt: prompt.trim(),
          aspect_ratio: ratio,
          resolution: "720p",
          duration: videoDuration,
          audio_url: audioUrl,
          enable_prompt_expansion: true,
          enable_safety_checker: true
        }
      });
await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/videos`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SECRET_KEY,
      "Prefer": "return=minimal"
    },
body: JSON.stringify({
  request_id: request_id,
  prompt: prompt.trim(),
  aspect_ratio: ratio,
  duration: videoDuration,
  cost: cost,
  user_id: userId,
  audio_url: audioUrl
})
  }
);

      return res.status(200).json({
        success: true,
        requestId: request_id
      });
    }


    return res.status(405).json({
      error: "Método no permitido"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "No se pudo procesar la solicitud.",
      details: error?.message || "Error desconocido"
    });
  }
}
