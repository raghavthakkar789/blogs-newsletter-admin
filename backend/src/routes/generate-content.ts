import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import axios from 'axios';

const router = Router();

const generateContentSchema = z.object({
  blogIdea: z.string().min(1, 'Blog idea is required'),
  blogAbout: z.string().min(1, 'Blog about is required')
});

router.use(authenticate);

// Generate content using AI
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { blogIdea, blogAbout } = generateContentSchema.parse(req.body);
    
    const webhookUrl = process.env.AI_WEBHOOK_URL;
    const timeout = parseInt(process.env.AI_WEBHOOK_TIMEOUT || '30000');
    
    if (!webhookUrl) {
      return res.status(503).json({ 
        message: 'AI content generation is not configured' 
      });
    }
    
    // Call external webhook
    const response = await axios.post(
      webhookUrl,
      {
        blogIdea,
        blogAbout
      },
      {
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract title, content, and summary from response
    // Adjust based on actual API response structure
    const { title, content, summary } = response.data;
    
    if (!title || !content) {
      return res.status(500).json({ 
        message: 'Invalid response from AI service' 
      });
    }
    
    res.json({
      title: title || 'Generated Blog Title',
      content: content || '',
      summary: summary || ''
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'AI service timeout' });
    }
    
    res.status(500).json({ 
      message: error.message || 'Failed to generate content' 
    });
  }
});

export default router;

