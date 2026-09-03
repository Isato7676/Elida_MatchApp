module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, ...queryParams } = req.query || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'Es necesario indicar un endpoint' });
    }

    // 1. ENDPOINT PARA CONSULTAR UN ESTADIO INDIVIDUAL (PARSER ROBUSTO)
    if (endpoint === 'estadio') {
      const idCampo = queryParams.id;
      if (!idCampo) {
        return res.status(400).json({ error: 'Es necesario indicar el id del campo' });
      }

      const responseCampo = await fetch(`https://www.rffm.es/campo/${idCampo}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.rffm.es/'
        }
      });

      if (!responseCampo.ok) {
        return res.status(responseCampo.status).json({ error: `HTTP RFFM ${responseCampo.status}` });
      }

      const html = await responseCampo.text();

      // Normalizar HTML: reemplazar entidades comunes, eliminar scripts/estilos y extraer líneas limpias
      const textOnly = html
        .replace(/&nbsp;/g, ' ')
        .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n');

      const lineas = textOnly
        .split('\n')
        .map(l => l.replace(/[:\t\r]/g, '').trim())
        .filter(Boolean);

      const info = {};
      const clavesTarget = [
        { key: 'Nombre', matches: ['nombre', 'campo', 'instalacion'] },
        { key: 'Dirección', matches: ['direccion', 'domicilio'] },
        { key: 'Localidad', matches: ['localidad', 'poblacion', 'municipio'] },
        { key: 'CP', matches: ['cp', 'codigo postal', 'c.p.'] }
      ];

      for (let i = 0; i < lineas.length; i++) {
        const lineaLower = lineas[i].toLowerCase();
        
        clavesTarget.forEach(target => {
          const coincide = target.matches.some(m => lineaLower === m || lineaLower.startsWith(m));
          if (coincide && lineas[i + 1] && !info[target.key]) {
            info[target.key] = lineas[i + 1];
          }
        });
      }

      // Si no se encontró el nombre en el barrido por clave, buscar el primer H1 del HTML
      let nombre = info['Nombre'];
      if (!nombre) {
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        nombre = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : `Campo ${idCampo}`;
      }

      const direccion = info['Dirección'] || '';
      const localidad = info['Localidad'] || 'MADRID';
      const cp = info['CP'] || '';

      const querySearch = `${direccion || nombre}, ${cp} ${localidad} Madrid`.replace(/\s+/g, ' ').trim();
      const google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(querySearch)}`;

      return res.status(200).json({
        id: idCampo,
        nombre,
        direccion,
        localidad,
        cp,
        google_maps_url
      });
    }

    // 2. ENDPOINT PARA ESCRIBIR EN GITHUB
    if (endpoint === 'save-estadios-github') {
      const { nuevosEstadios } = req.body || {};
      const token = process.env.GITHUB_TOKEN;
      const owner = process.env.VERCEL_GIT_REPO_OWNER;
      const repo = process.env.VERCEL_GIT_REPO_SLUG;

      if (!token) {
        return res.status(400).json({ status: 400, message: 'ERROR: Falta GITHUB_TOKEN en Vercel' });
      }

      if (!owner || !repo) {
        return res.status(400).json({ status: 400, message: 'ERROR: No se detectó VERCEL_GIT_REPO_OWNER o SLUG' });
      }

      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/estadios.json`;
      
      const getRes = await fetch(ghUrl, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'Vercel-App' }
      });

      let currentDb = {};
      let sha = '';

      if (getRes.ok) {
        const ghData = await getRes.json();
        sha = ghData.sha;
        const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
        try { currentDb = JSON.parse(content); } catch(e) {}
      }

      const updatedDb = { ...currentDb, ...nuevosEstadios };
      const updatedContent = Buffer.from(JSON.stringify(updatedDb, null, 2)).toString('base64');

      const putRes = await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-App'
        },
        body: JSON.stringify({
          message: 'auto: Sincronización de estadios',
          content: updatedContent,
          sha: sha || undefined
        })
      });

      const putData = await putRes.json();

      if (!putRes.ok) {
        return res.status(putRes.status).json({ 
          status: putRes.status, 
          message: `Error GitHub API: ${putData.message || putRes.statusText}` 
        });
      }

      return res.status(200).json({ 
        status: 200, 
        message: 'Guardado exitoso en GitHub', 
        totalRegistros: Object.keys(updatedDb).length 
      });
    }

    // 3. RUTAS ESTÁNDAR
    let targetUrl = '';
    const queryString = new URLSearchParams(queryParams).toString();

    if (endpoint === 'calendario-next') {
      targetUrl = `https://www.rffm.es/_next/data/inlzUL9hzqhAubIvBCD2y/competicion/calendario.json?${queryString}`;
    } else {
      targetUrl = `https://www.rffm.es/api/${endpoint}${queryString ? `?${queryString}` : ''}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.rffm.es/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Error en RFFM: ${response.statusText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Error interno en la función de Vercel', 
      details: error.message 
    });
  }
};
