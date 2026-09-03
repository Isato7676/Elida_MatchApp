module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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

    let targetUrl = '';
    const queryString = new URLSearchParams(queryParams).toString();

    if (endpoint === 'calendario-next') {
      // Endpoint de Next.js para descargar el calendario/clasificación global
      targetUrl = `https://www.rffm.es/_next/data/inlzUL9hzqhAubIvBCD2y/competicion/calendario.json?${queryString}`;
    } else {
      // Endpoints estándar de catálogo (seasons, competitions, groups)
      targetUrl = `https://www.rffm.es/api/${endpoint}${queryString ? `?${queryString}` : ''}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.rffm.es/'
      }
    });

// Añadir este bloque dentro de tu enrutador principal en /api/rffm.js
if (endpoint === 'estadio') {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Falta el ID del campo' });

  try {
    const response = await fetch(`https://www.rffm.es/campo/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // Extraer datos clave usando Regex
    const getMatch = (regex) => {
      const match = html.match(regex);
      return match ? match[1].trim() : '';
    };

    const nombre = getMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || `Campo ${id}`;
    const direccion = getMatch(/Dirección[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/Dirección:?\s*<\/strong>\s*([^<]+)/i);
    const localidad = getMatch(/Localidad[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/Localidad:?\s*<\/strong>\s*([^<]+)/i);
    const cp = getMatch(/C\.P\.?[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i) || getMatch(/28\d{3}/);

    const queryMaps = encodeURIComponent(`${direccion || nombre}, ${cp} ${localidad} Madrid`.trim());
    const google_maps_url = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

    return res.status(200).json({
      id,
      nombre,
      direccion,
      localidad,
      cp,
      google_maps_url
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar la RFFM' });
  }
}

    
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
