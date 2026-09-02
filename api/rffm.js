export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const targetUrl = 'https://www.rffm.es/competicion/resultados-y-jornadas?temporada=22&competicion=26737819&grupo=26737824&jornada=1&tipojuego=1';

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const text = await response.text();
    
    // Devolvemos el estado del servidor de la RFFM y la longitud del texto
    return res.status(200).json({
      status: response.status,
      statusText: response.statusText,
      longitudTexto: text.length,
      contenidoInicio: text.substring(0, 300)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
