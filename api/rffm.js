export default async function handler(req, res) {
  // Configurar cabeceras para permitir CORS en tu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { temporada = '22', competicion = '26737819', grupo = '26737824', jornada = '1', tipo = 'resultados' } = req.query;

  let urlRFFM = '';
  if (tipo === 'clasificacion') {
    urlRFFM = `https://www.rffm.es/competicion/clasificacion?temporada=${temporada}&competicion=${competicion}&grupo=${grupo}&tipojuego=1`;
  } else {
    urlRFFM = `https://www.rffm.es/competicion/resultados-y-jornadas?temporada=${temporada}&competicion=${competicion}&grupo=${grupo}&jornada=${jornada}&tipojuego=1`;
  }

  try {
    const response = await fetch(urlRFFM, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error al conectar con RFFM' });
    }

    const html = await response.text();
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).json({ error: 'Fallo interno en el servidor proxy de Vercel' });
  }
}
