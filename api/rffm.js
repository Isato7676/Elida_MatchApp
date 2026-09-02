module.exports = async (req, res) => {
  // Cabeceras para permitir peticiones sin bloqueos (CORS)
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
    // Extraer endpoint y parámetros de la petición
    const { endpoint, ...queryParams } = req.query || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'Es necesario indicar un endpoint' });
    }

    // Construir la URL hacia la RFFM
    const queryString = new URLSearchParams(queryParams).toString();
    const targetUrl = `https://www.rffm.es/api/${endpoint}${queryString ? `?${queryString}` : ''}`;

    // Hacer la petición a la RFFM
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
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
