import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import axios from 'axios';

const router = Router();

const generateBlogContentSchema = z.object({
  blogIdea: z.string().optional(),
  blogAbout: z.string().optional(),
  audience: z.string().optional(),
  isCompanySpecific: z.boolean().optional().default(false)
});

const regenerateBlogFieldSchema = z.object({
  field: z.enum(['title', 'summary', 'content', 'tags', 'image']),
  prompt: z.string().min(1, 'Prompt is required'),
  currentValue: z.string().optional(),
  context: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
  }).optional()
});

router.use(authenticate);

// Generate blog content using AI
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { blogIdea, blogAbout, audience, isCompanySpecific } = generateBlogContentSchema.parse(req.body);
    
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
      message: error.message || 'Failed to generate blog content' 
    });
  }
});

// Regenerate specific blog field using AI
router.post('/regenerate', async (req: AuthRequest, res: Response) => {
  try {
    const { field, prompt, currentValue, context } = regenerateBlogFieldSchema.parse(req.body);
    
    const timeout = parseInt(process.env.AI_WEBHOOK_TIMEOUT || '30000');
    let response;
    
    // Use specific webhook URLs for blog field regeneration
    if (field === 'title') {
      const titleWebhookUrl = 'http://54.88.119.163:5679/webhook/a03946d5-0449-4156-89c8-36f2f021803c';
      
      // Call external webhook with POST request for title
      response = await axios.post(
        titleWebhookUrl,
        {
          prompt,
          currentValue: currentValue || '',
          field,
          ...(context || {})
        },
        {
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else if (field === 'summary') {
      const summaryWebhookUrl = 'http://54.88.119.163:5679/webhook/438b14c0-3bd6-4636-9831-a7bb3463c926';
      
      // Call external webhook with POST request for summary
      response = await axios.post(
        summaryWebhookUrl,
        {
          prompt,
          currentValue: currentValue || '',
          field,
          ...(context || {})
        },
        {
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else if (field === 'content') {
      const contentWebhookUrl = 'http://54.88.119.163:5679/webhook-test/ddab5050-03cd-4d48-8a74-2b07e5d17e96';
      
      // Call external webhook with POST request for content
      response = await axios.post(
        contentWebhookUrl,
        {
          prompt,
          currentValue: currentValue || '',
          field,
          ...(context || {})
        },
        {
          timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // Use default webhook for other fields (tags, image)
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
    let regeneratedValue;
    
    if (field === 'title') {
      // Handle n8n response format: Title field or nested output[0].content[0].text structure
      regeneratedValue = response.data.Title || 
                        response.data.title ||
                        response.data?.output?.[0]?.content?.[0]?.text ||
                        response.data.value || 
                        response.data.result;
    } else if (field === 'summary') {
      // Handle n8n response format: Summary field or nested output[0].content[0].text structure
      regeneratedValue = response.data.Summary || 
                        response.data.summary ||
                        response.data?.output?.[0]?.content?.[0]?.text ||
                        response.data.value || 
                        response.data.result;
    } else if (field === 'content') {
      // Handle n8n response format: Content field or nested output[0].content[0].text structure
      regeneratedValue = response.data.Content || 
                        response.data.contentHtml ||
                        response.data.content ||
                        response.data?.output?.[0]?.content?.[0]?.text ||
                        response.data.value || 
                        response.data.result;
    } else {
      regeneratedValue = response.data[field] || 
                        response.data.value || 
                        response.data.result;
    }
    
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
      message: error.message || 'Failed to regenerate blog field' 
    });
  }
});

export default router;

