async function loadCompetitions() {
  const temporada = document.getElementById('select-season').value;
  const tipojuego = document.getElementById('select-gametype').value;
  if (!temporada || !tipojuego) return;

  const select = document.getElementById('select-competition');
  select.disabled = false;
  select.innerHTML = '<option value="">Cargando...</option>';

  try {
    const comps = await apiFetch('competitions', { temporada, tipojuego });
    
    // Si la respuesta no es un array o viene vacía
    if (!Array.isArray(comps) || comps.length === 0) {
      select.innerHTML = '<option value="">Sin competiciones disponibles</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecciona Competición</option>';
    comps.forEach(c => {
      // Extraemos el ID y Nombre probando las claves típicas de la RFFM
      const id = c.id || c.competicion || c.id_competicion || c.codigo;
      const nombre = c.nombre || c.nombre_competicion || c.denominacion || c.title;
      if (id && nombre) {
        select.innerHTML += `<option value="${id}">${nombre}</option>`;
      }
    });
  } catch (error) {
    console.error("Error al cargar competiciones:", error);
    select.innerHTML = '<option value="">Error al cargar competiciones</option>';
  }
}

async function loadGroups() {
  const competicion = document.getElementById('select-competition').value;
  if (!competicion) return;

  const select = document.getElementById('select-group');
  select.disabled = false;
  select.innerHTML = '<option value="">Cargando...</option>';

  try {
    const groups = await apiFetch('groups', { competicion });
    
    if (!Array.isArray(groups) || groups.length === 0) {
      select.innerHTML = '<option value="">Sin grupos disponibles</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecciona Grupo</option>';
    groups.forEach(g => {
      const id = g.id || g.grupo || g.id_grupo || g.codigo;
      const nombre = g.nombre || g.nombre_grupo || g.denominacion;
      if (id && nombre) {
        select.innerHTML += `<option value="${id}">${nombre}</option>`;
      }
    });
  } catch (error) {
    console.error("Error al cargar grupos:", error);
    select.innerHTML = '<option value="">Error al cargar grupos</option>';
  }
}

async function loadTeams() {
  const grupo = document.getElementById('select-group').value;
  if (!grupo) return;

  const select = document.getElementById('select-team');
  select.disabled = false;
  select.innerHTML = '<option value="">Cargando...</option>';

  try {
    const teams = await apiFetch('group-teams', { grupo });
    
    if (!Array.isArray(teams) || teams.length === 0) {
      select.innerHTML = '<option value="">Sin equipos disponibles</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecciona tu Equipo</option>';
    teams.forEach(t => {
      const id = t.id || t.equipo || t.id_equipo || t.codigo;
      const nombre = t.nombre || t.nombre_equipo || t.denominacion;
      if (id && nombre) {
        select.innerHTML += `<option value="${id}">${nombre}</option>`;
      }
    });
  } catch (error) {
    console.error("Error al cargar equipos:", error);
    select.innerHTML = '<option value="">Error al cargar equipos</option>';
  }
}
