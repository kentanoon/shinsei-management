const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getProjects(event, headers);
      case 'POST':
        return await createProject(event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function getProjects(event, headers) {
  const params = event.queryStringParameters || {};
  const { page = 1, limit = 20, status } = params;
  
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Database error', error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      projects: projects || [],
      total: count || 0,
      skip: offset,
      limit: Number(limit)
    })
  };
}

async function createProject(event, headers) {
  const { project_name, customer, site, building } = JSON.parse(event.body || '{}');

  if (!project_name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Project name is required' })
    };
  }

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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to create project', error: projectError?.message })
    };
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

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(project)
  };
}