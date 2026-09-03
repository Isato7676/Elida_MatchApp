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

// 1. ENDPOINT PARA CONSULTAR UN ESTADIO INDIVIDUAL (EXTRACCIÓN DIRECTA POR HTML)
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

      // Función auxiliar para extraer el texto limpio que le sigue a una etiqueta
      const extractField = (pattern) => {
        const match = html.match(pattern);
        if (!match) return '';
        // Limpia etiquetas HTML internas, &nbsp; y saltos de línea
        return match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/[:\r\n\t]/g, '')
          .trim();
      };

      // 1. Extraer Nombre (del H1 o título de la ficha)
      const nombre = extractField(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || 
                     extractField(/Nombre[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || 
                     `Campo ${idCampo}`;

      // 2. Extraer Dirección
      const direccion = extractField(/Dirección[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || 
                        extractField(/Dirección:?[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/i) ||
                        extractField(/Dirección[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);

      // 3. Extraer Localidad
      const localidad = extractField(/Localidad[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || 
                        extractField(/Localidad:?[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/i) ||
                        'MADRID';

      // 4. Extraer Código Postal (Busca patrón de 5 dígitos que empiece por 28 o tras la palabra CP)
      const cpMatch = html.match(/C\.?P\.?[\s\S]*?(28\d{3})/i) || html.match(/\b(28\d{3})\b/);
      const cp = cpMatch ? cpMatch[1] : '';

      // Construcción limpia de la Query de Google Maps
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
