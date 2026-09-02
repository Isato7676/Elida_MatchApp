export default async function handler(req, res) {
  // Configuración de cabeceras para permitir que tu web consulte esta API sin bloqueos (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Capturamos la ruta que quiere consultar la App (ej. 'seasons', 'competitions', etc.)
  const { endpoint, ...queryParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Es necesario indicar un endpoint' });
  }

  // Convertimos los parámetros pasados (temporada, grupo, etc.) en formato URL
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `https://www.rffm.es/api/${endpoint}${queryString ? `?${queryString}` : ''}`;

  try {
    // Hacemos la petición a la RFFM desde el servidor de Vercel
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Error RFFM: ${response.statusText}` });
    }

    const data = await response.json();
    
    // Devolvemos los datos limpios a nuestro HTML
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno conectando con RFFM', details: error.message });
  }
}
