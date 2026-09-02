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
