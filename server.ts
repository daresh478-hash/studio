import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client per skill instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, recipeContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let contextSnippet = '';
    if (recipeContext && typeof recipeContext === 'object') {
      contextSnippet = `
CURRENT RECIPE CONTEXT IN USER INTERFACE:
- Dish Name: ${recipeContext.dishName || 'None'}
- Original Servings: ${recipeContext.originalServings || 'N/A'}
- Wanted Servings: ${recipeContext.wantedServings || 'N/A'}
- Core Ingredients:
${Array.isArray(recipeContext.ingredients) ? recipeContext.ingredients.map((ing: any) => `  * ${ing.name || 'Unnamed'}: ${ing.qty || 0} ${ing.unit || ''}`).join('\n') : '  None'}
`;
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${contextSnippet}\nUser Question: ${message}`,
          config: {
            systemInstruction: `You are ChefBot, an expert culinary formulation and kitchen science AI consultant for CulinaryScale Pro.
You specialize in commercial culinary calculations, recipe scaling caveats (such as pan surface area, evaporation rates, non-linear leavening scaling, salt and spice balance), ingredient substitutions, and chef techniques.
Answer clearly, concisely, and encouragingly. Use formatting like bullet points when helpful. Keep replies to 2-4 sentences or short digestible bullets.`,
          },
        });

        const replyText = response.text;
        if (replyText) {
          return res.json({ reply: replyText });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using culinary domain fallback:', geminiError?.message);
      }
    }

    // Graceful, intelligent domain guidance fallback
    const lower = message.toLowerCase();
    let fallbackReply = `When scaling ${recipeContext?.dishName || 'recipes'}, base structural ingredients (flour, meats, liquids) scale by the direct ratio (Wanted / Original). Spices, salt, and leaveners should initially be increased with caution (around 75-80% of ratio) to prevent over-seasoning or rapid over-proofing.`;

    if (lower.includes('baking powder') || lower.includes('yeast') || lower.includes('leaven')) {
      fallbackReply = `**Scaling Leaveners**: Chemical leaveners (baking powder/soda) do not scale linearly! When doubling or tripling a recipe, scale leaveners by **70–80%** of the direct ratio to prevent your baked goods from expanding too quickly and collapsing in the oven.`;
    } else if (lower.includes('substitut') || lower.includes('replace') || lower.includes('egg') || lower.includes('cream')) {
      fallbackReply = `**Culinary Substitutions**:
• Heavy cream can be substituted with whole milk plus melted unsalted butter (3:1 ratio).
• Whole eggs can be replaced with 1/4 cup unsweetened applesauce or silken tofu in moisture-heavy bakes.
• All-purpose flour can substitute bread flour, but add 1 tsp vital wheat gluten per cup for comparable chew.`;
    } else if (lower.includes('time') || lower.includes('bake') || lower.includes('temperature') || lower.includes('temp')) {
      fallbackReply = `**Cooking Time & Temperature**:
• When scaling up batch size into multiple pans of the same original size, maintain the **same oven temperature and baking time**.
• If increasing the depth or size of a single baking vessel, **reduce oven temperature by 25°F (15°C)** and increase bake time by 20–35% to allow the interior to cook through without burning the crust.`;
    } else if (lower.includes('analy') || lower.includes('current')) {
      const dish = recipeContext?.dishName || 'your formulation';
      const orig = recipeContext?.originalServings || '4';
      const wanted = recipeContext?.wantedServings || '10';
      fallbackReply = `**Formulation Analysis for ${dish}**:
• Scaling from ${orig} to ${wanted} servings gives a direct multiplier.
• Ensure cooking vessels provide sufficient surface area for evaporation; crowded pans cause braising instead of searing.
• Always taste test salt and acidity (lemon/vinegar) before service, as perceived salinity increases non-linearly with volume.`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error('ChefBot API Error:', error);
    return res.status(500).json({
      error: 'ChefBot service encountered an error',
      details: error?.message || 'Server error',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
