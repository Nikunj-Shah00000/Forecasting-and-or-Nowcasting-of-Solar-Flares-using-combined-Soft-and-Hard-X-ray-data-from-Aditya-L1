import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Lazy init Gemini AI client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please add it via the Secrets panel in the AI Studio UI.');
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Route: Generate content with customizable configurations
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, systemInstruction, temperature, topP, topK, enableSearch } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getGeminiClient();
      
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (typeof temperature === 'number') {
        config.temperature = temperature;
      }
      if (typeof topP === 'number') {
        config.topP = topP;
      }
      if (typeof topK === 'number') {
        config.topK = topK;
      }
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: config
      });

      const text = response.text || '';
      
      // Extract grounding sources
      const sources: Array<{ title: string; url: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri
            });
          }
        }
      }

      return res.json({ text, sources });
    } catch (error: any) {
      console.error('Error generating content:', error);
      return res.status(500).json({ error: error.message || 'An error occurred during generation' });
    }
  });

  // API Route: Conversation chat with stateless history
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, systemInstruction, temperature, enableSearch } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const ai = getGeminiClient();

      // Map incoming client-side message array to standard Gemini content payload
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content || '' }]
      }));

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (typeof temperature === 'number') {
        config.temperature = temperature;
      }
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: config
      });

      const text = response.text || '';

      const sources: Array<{ title: string; url: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri
            });
          }
        }
      }

      return res.json({ text, sources });
    } catch (error: any) {
      console.error('Error in chat:', error);
      return res.status(500).json({ error: error.message || 'An error occurred during the chat session' });
    }
  });

  // Integrate Vite Dev Server as middleware in development, serve build static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
