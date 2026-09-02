export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { temporada = '22', competicion = '26737819', grupo = '26737824', jornada = '1', tipo = 'resultados' } = req.query;

  let urlRFFM = '';
  if (tipo === 'clasificacion') {
    // URL exacta en plural con el parámetro de jornada
    urlRFFM = `https://www.rffm.es/competicion/clasificaciones?temporada=${temporada}&tipojuego=1&competicion=${competicion}&grupo=${grupo}&jornada=${jornada}`;
  } else {
    // URL exacta de resultados y jornadas
    urlRFFM = `https://www.rffm.es/competicion/resultados-y-jornadas?temporada=${temporada}&tipojuego=1&competicion=${competicion}&grupo=${grupo}&jornada=${jornada}`;
  }

  try {
    const response = await fetch(urlRFFM, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error al conectar con RFFM' });
    }

    const html = await response.text();
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).json({ error: 'Fallo interno en el servidor proxy' });
  }
}
