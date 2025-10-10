import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    let url = `${BACKEND_URL}/volunteer-data`;
    let fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
    };

    // Handle different HTTP methods
    switch (method) {
      case 'POST':
        // Create volunteer data
        fetchOptions.body = JSON.stringify(req.body);
        break;

      case 'GET':
        // Get volunteer data - handle query parameters
        if (req.query.id) {
          url = `${BACKEND_URL}/volunteer-data/${req.query.id}`;
        } else if (req.query.user_id) {
          url = `${BACKEND_URL}/volunteer-data/user/${req.query.user_id}`;
        }
        // If no specific query, it will get all volunteer data
        break;

      case 'PUT':
        // Update volunteer data
        if (req.query.id) {
          url = `${BACKEND_URL}/volunteer-data/${req.query.id}`;
          fetchOptions.body = JSON.stringify(req.body);
        } else {
          return res.status(400).json({ error: 'ID required for PUT request' });
        }
        break;

      case 'DELETE':
        // Delete volunteer data
        if (req.query.id) {
          url = `${BACKEND_URL}/volunteer-data/${req.query.id}`;
        } else {
          return res.status(400).json({ error: 'ID required for DELETE request' });
        }
        break;

      default:
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }

    // Make request to FastAPI backend
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // Forward the response status and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
