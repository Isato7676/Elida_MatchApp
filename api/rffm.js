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

    // 1. ENDPOINT PARA SINCRONIZAR Y GUARDAR ESTADIOS FALTANTES EN GITHUB
    if (endpoint === 'sync-estadios') {
      const { codigos } = req.body || {};
      if (!Array.isArray(codigos) || codigos.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de códigos' });
      }

      const owner = process.env.VERCEL_GIT_REPO_OWNER;
      const repo = process.env.VERCEL_GIT_REPO_SLUG;
      const token = process.env.GITHUB_TOKEN;

      // Si no hay token configurado, devolvemos un aviso pero no bloqueamos
      if (!token || !owner || !repo) {
        return res.status(200).json({ message: 'Petición omitida: Falta GITHUB_TOKEN en Vercel' });
      }

      // Obtener el estadios.json actual de GitHub
      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/estadios.json`;
      const ghRes = await fetch(ghUrl, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'Vercel-App' }
      });

      let currentDb = {};
      let sha = '';

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        sha = ghData.sha;
        const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
        currentDb = JSON.parse(content || '{}');
      }

      // Buscar los códigos que no tenemos en el JSON
      const faltantes = codigos.filter(code => !currentDb[code]);
      if (faltantes.length === 0) {
        return res.status(200).json({ message: 'Todos los estadios ya están registrados' });
      }

      // Extraer datos de la RFFM para cada estadio faltante
      for (const idCampo of faltantes) {
        try {
          const responseCampo = await fetch(`https://www.rffm.es/campo/${idCampo}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });

          if (responseCampo.ok) {
            const html = await responseCampo.text();
            const getMatch = (regex) => {
              const match = html.match(regex);
              return match ? match[1].trim() : '';
            };

            const nombre = getMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || `Campo ${idCampo}`;
            const direccion = getMatch(/Dirección[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/Dirección:?\s*<\/strong>\s*([^<]+)/i);
            const localidad = getMatch(/Localidad[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/Localidad:?\s*<\/strong>\s*([^<]+)/i);
            const cp = getMatch(/C\.P\.?[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/28\d{3}/);

            const queryMaps = encodeURIComponent(`${direccion || nombre}, ${cp} ${localidad} Madrid`.trim());
            const google_maps_url = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

            currentDb[idCampo] = { nombre, direccion, localidad, cp, google_maps_url };
          }
        } catch (e) {
          console.warn(`Error al extraer campo ${idCampo}`, e);
        }
      }

      // Guardar el nuevo estadios.json actualizado en GitHub
      const updatedContent = Buffer.from(JSON.stringify(currentDb, null, 2)).toString('base64');
      await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-App'
        },
        body: JSON.stringify({
          message: 'auto: Actualización automática de estadios',
          content: updatedContent,
          sha: sha || undefined
        })
      });

      return res.status(200).json({ message: 'Estadios sincronizados con éxito', añadidos: faltantes.length });
    }

    // 2. RUTAS ORIGINALES
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
