import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Proxy for fetching contract data
  app.get("/api/contract", async (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing ID" });
    }

    try {
      console.log(`Proxying fetch for ID: ${id}`);
      
      // Sending ID in URL AND Body under multiple names to be extremely compatible
      const response = await axios.post(`https://n8n.doorbinwaste.com/webhook/consultar-cotizacion?id=${id}`, 
        { 
          id: id,
          "Property ID": id,
          recordId: id,
          airtable_record_id: id
        }, 
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log("n8n Raw Response:", JSON.stringify(response.data, null, 2));
      
      let data = response.data;
      
      // 1. Handle Array
      if (Array.isArray(data)) {
        data = data[0];
      }
      
      // 2. Handle common n8n/Airtable wrappers
      if (data && data.body) data = data.body;
      if (data && data.fields) data = data.fields;
      if (data && data.data && typeof data.data === 'object' && !data.fields) data = data.data;
      
      // If we still have an array after unwrapping
      if (Array.isArray(data)) data = data[0];

      if (!data || Object.keys(data).length === 0) {
        console.warn("n8n returned empty data for ID:", id);
        return res.status(404).json({ error: "No data found for this ID in n8n/Airtable" });
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Proxy Fetch Error:", error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message || "Failed to fetch from n8n";
      res.status(status).json({ error: message });
    }
  });

  // Proxy for submitting acceptance
  app.post("/api/submit", async (req, res) => {
    try {
      // n8n expects form-urlencoded based on previous implementation
      const params = new URLSearchParams();
      for (const key in req.body) {
        params.append(key, req.body[key]);
      }

      const response = await axios.post(
        "https://n8n.doorbinwaste.com/webhook/consultar-cotizacion",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error("Proxy Submit Error:", error.message);
      res.status(error.response?.status || 500).json({ error: "Failed to submit to n8n" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
