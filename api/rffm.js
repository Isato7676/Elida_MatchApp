module.exports = async (req, res) => {
  // Permitir peticiones desde cualquier origen (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, temporada, tipojuego, competicion, grupo, id } = req.query;

  try {
    // 1. OBTENER TEMPORADAS
    if (endpoint === 'seasons') {
      const response = await fetch('https://www.rffm.es/api/v1/seasons');
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. OBTENER COMPETICIONES
    if (endpoint === 'competitions') {
      const url = `https://www.rffm.es/api/v1/competitions?temporada=${temporada}&tipojuego=${tipojuego}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 3. OBTENER GRUPOS
    if (endpoint === 'groups') {
      const url = `https://www.rffm.es/api/v1/groups?competicion=${competicion}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 4. OBTENER CALENDARIO Y EQUIPOS
    if (endpoint === 'calendario-next') {
      const url = `https://www.rffm.es/_next/data/latest/pnf/calendario.json?temporada=${temporada}&tipojuego=${tipojuego}&competicion=${competicion}&grupo=${grupo}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 5. OBTENER FICHA TÉCNICA Y DIRECCIÓN DEL ESTADIO
    if (endpoint === 'estadio') {
      if (!id) return res.status(400).json({ error: 'Falta el ID del campo' });

      const response = await fetch(`https://www.rffm.es/campo/${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await response.text();

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
    }

    return res.status(400).json({ error: 'Endpoint no válido' });

  } catch (error) {
    return res.status(500).json({ error: 'Error en el proxy de Vercel', details: error.message });
  }
};
