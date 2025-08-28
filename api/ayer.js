export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const response = await fetch("http://168.231.70.228:3040/ayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      const text = await response.text(); // tu backend puede no devolver JSON
      res.status(response.status).send(text);
    } catch (err) {
      res.status(500).json({ error: "Fallo proxy a /ayer", detail: err.message });
    }
  } else {
    res.status(405).end("Método no permitido");
  }
}
