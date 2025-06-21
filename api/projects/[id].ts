import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getProject(id, res);
      case 'PUT':
        return await updateProject(id, req.body, res);
      case 'DELETE':
        return await deleteProject(id, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getProject(id: string, res: NextApiResponse) {
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      customers(*),
      sites(*),
      buildings(*),
      applications(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.status(500).json({ message: 'Database error', error: error.message });
  }

  return res.status(200).json(project);
}

async function updateProject(id: string, updates: any, res: NextApiResponse) {
  const { data: project, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: 'Failed to update project', error: error.message });
  }

  return res.status(200).json(project);
}

async function deleteProject(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }

  return res.status(204).end();
}