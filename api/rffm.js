export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { temporada = '22', competicion = '26737819', grupo = '26737824', jornada = '1', tipo = 'resultados' } = req.query;

  let urlRFFM = '';
  if (tipo === 'clasificacion') {
    urlRFFM = `https://www.rffm.es/competicion/clasificaciones?temporada=${temporada}&tipojuego=1&competicion=${competicion}&grupo=${grupo}&jornada=${jornada}`;
  } else {
    urlRFFM = `https://www.rffm.es/competicion/resultados-y-jornadas?temporada=${temporada}&tipojuego=1&competicion=${competicion}&grupo=${grupo}&jornada=${jornada}`;
  }

  try {
    const response = await fetch(urlRFFM, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    const html = await response.text();
    
    // Si la respuesta es válida, la devolvemos
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send(`Error en el servidor: ${error.message}`);
  }
}
