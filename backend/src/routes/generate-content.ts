import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import axios from 'axios';

const router = Router();

const generateContentSchema = z.object({
  blogIdea: z.string().optional(),
  blogAbout: z.string().optional(),
  audience: z.string().optional(),
  isCompanySpecific: z.boolean().optional().default(false)
});

const regenerateFieldSchema = z.object({
  field: z.enum(['title', 'summary', 'content', 'tags', 'image']),
  prompt: z.string().min(1, 'Prompt is required'),
  currentValue: z.string().optional(),
  context: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional()
});

router.use(authenticate);

// Generate content using AI
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { blogIdea, blogAbout, audience, isCompanySpecific } = generateContentSchema.parse(req.body);
    
    // Validate that at least one field is provided
    if (!blogIdea?.trim() && !blogAbout?.trim()) {
      return res.status(400).json({ 
        message: 'Please provide either a blog idea or what it\'s about' 
      });
    }
    
    // Use specific webhook URL for blog idea generation
    const webhookUrl = 'http://54.88.119.163:5679/webhook/http://localhost:5000/api/blogs';
    const timeout = parseInt(process.env.AI_WEBHOOK_TIMEOUT || '30000');
    
    // Call external webhook with POST request
    const response = await axios.post(
      webhookUrl,
      {
        blogIdea: blogIdea || '',
        blogAbout: blogAbout || '',
        audience: audience || '',
        isCompanySpecific: isCompanySpecific || false
      },
      {
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract title, content, and summary from response
    // Handle new n8n response format with capitalized fields (Title, Content, Summary, Tags)
    const title = response.data.title || response.data.Title;
    const content = response.data.contentHtml || response.data.Content || response.data.content;
    const summary = response.data.summary || response.data.Summary;
    const tags = response.data.tags || response.data.Tags;
    
    if (!title || !content) {
      return res.status(500).json({ 
        message: 'Invalid response from AI service' 
      });
    }
    
    res.json({
      title: title || 'Generated Blog Title',
      content: content || '',
      summary: summary || '',
      tags: tags || []
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

// Regenerate specific field using AI
router.post('/regenerate', async (req: AuthRequest, res: Response) => {
  try {
    const { field, prompt, currentValue, context } = regenerateFieldSchema.parse(req.body);
    
    const timeout = parseInt(process.env.AI_WEBHOOK_TIMEOUT || '30000');
    let response;
    
    // Use specific webhook URL for title regeneration
    if (field === 'title') {
      const titleWebhookUrl = 'http://54.88.119.163:5679/webhook/3a4da3fa-fcc5-4f8a-b1a9-50ae40cfd4ad';
      
      // Call external webhook with GET request for title
      response = await axios.get(
        titleWebhookUrl,
        {
          params: {
            prompt,
            currentValue: currentValue || '',
            field,
            ...(context || {})
          },
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // Use default webhook for other fields
      const webhookUrl = process.env.AI_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return res.status(503).json({ 
          message: 'AI content generation is not configured' 
        });
      }
      
      // Call external webhook for field regeneration
      response = await axios.post(
        webhookUrl,
        {
          action: 'regenerate',
          field,
          prompt,
          currentValue: currentValue || '',
          context: context || {}
        },
        {
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Extract the regenerated field value from response
    const regeneratedValue = response.data[field] || response.data.value || response.data.result || response.data.title;
    
    if (!regeneratedValue) {
      return res.status(500).json({ 
        message: 'Invalid response from AI service' 
      });
    }
    
    res.json({
      field,
      value: regeneratedValue
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'AI service timeout' });
    }
    
    res.status(500).json({ 
      message: error.message || 'Failed to regenerate field' 
    });
  }
});

export default router;

