import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getProjects(req, res);
      case 'POST':
        return await createProject(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getProjects(req: VercelRequest, res: VercelResponse) {
  const { page = 1, limit = 20, status } = req.query;
  
  let query = supabase
    .from('projects')
    .select(`
      *,
      customers(*),
      sites(*),
      buildings(*),
      applications(*)
    `);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const offset = (Number(page) - 1) * Number(limit);
  query = query.range(offset, offset + Number(limit) - 1);

  const { data: projects, error, count } = await query;

  if (error) {
    return res.status(500).json({ message: 'Database error', error: error.message });
  }

  return res.status(200).json({
    projects: projects || [],
    total: count || 0,
    skip: offset,
    limit: Number(limit)
  });
}

async function createProject(req: VercelRequest, res: VercelResponse) {
  const { project_name, customer, site, building } = req.body;

  if (!project_name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  // Start transaction
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      project_name,
      project_code: `P${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status: '事前相談',
      input_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (projectError || !project) {
    return res.status(500).json({ message: 'Failed to create project', error: projectError?.message });
  }

  // Create related records if provided
  if (customer) {
    await supabase.from('customers').insert({ ...customer, project_id: project.id });
  }
  
  if (site) {
    await supabase.from('sites').insert({ ...site, project_id: project.id });
  }
  
  if (building) {
    await supabase.from('buildings').insert({ ...building, project_id: project.id });
  }

  return res.status(201).json(project);
}