// Referencias al DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusMessage = document.getElementById('statusMessage');
const loader = document.getElementById('loader');

const tabSearch = document.getElementById('tabSearch');
const tabFavs = document.getElementById('tabFavs');
const searchContainer = document.getElementById('searchContainer');
const favCount = document.getElementById('favCount');

// Estado global y LocalStorage
let favoritos = JSON.parse(localStorage.getItem('soundpulse_favs')) || [];
let currentView = 'search'; // 'search' o 'favs'

// Inicialización
actualizarContadorFavoritos();

// Eventos del buscador
searchBtn.addEventListener('click', ejecutarBusqueda);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') ejecutarBusqueda();
});

function ejecutarBusqueda() {
  const query = searchInput.value.trim();
  if (query !== '') buscarMusica(query);
}

// Eventos de Pestañas
tabSearch.addEventListener('click', () => {
  currentView = 'search';
  tabSearch.classList.add('active');
  tabFavs.classList.remove('active');
  searchContainer.classList.remove('hidden');
  statusMessage.textContent = 'Escribe algo para comenzar a explorar música.';
  resultsGrid.innerHTML = '';
});

tabFavs.addEventListener('click', () => {
  currentView = 'favs';
  tabFavs.classList.add('active');
  tabSearch.classList.remove('active');
  searchContainer.classList.add('hidden');
  mostrarFavoritos();
});

// Petición a la API de iTunes
async function buscarMusica(termino) {
  loader.classList.remove('hidden');
  statusMessage.textContent = 'Buscando canciones... 🎧';
  resultsGrid.innerHTML = '';

  try {
    const urlApi = `https://itunes.apple.com/search?term=${encodeURIComponent(termino)}&entity=song&limit=20`;
    const response = await fetch(urlApi);

    if (!response.ok) throw new Error('Error al conectar con la API');

    const data = await response.json();
    const canciones = data.results;

    loader.classList.add('hidden');

    if (!canciones || canciones.length === 0) {
      statusMessage.textContent = `No se encontraron resultados para "${termino}".`;
      return;
    }

    statusMessage.textContent = `Se encontraron ${canciones.length} resultados para "${termino}":`;
    mostrarCanciones(canciones);

  } catch (error) {
    console.error(error);
    loader.classList.add('hidden');
    statusMessage.textContent = 'Hubo un error al realizar la búsqueda. Inténtalo de nuevo.';
  }
}

// Renderizar tarjetas
function mostrarCanciones(canciones) {
  resultsGrid.innerHTML = '';

  canciones.forEach(cancion => {
    let audioUrl = cancion.previewUrl;
    if (audioUrl && audioUrl.startsWith('http://')) {
      audioUrl = audioUrl.replace('http://', 'https://');
    }

    const esFav = favoritos.some(fav => fav.trackId === cancion.trackId);

    const card = document.createElement('div');
    card.classList.add('card');

    card.innerHTML = `
      <button class="fav-btn" title="Guardar en favoritos">${esFav ? '❤️' : '🤍'}</button>
      <img src="${cancion.artworkUrl100.replace('100x100bb', '300x300bb')}" alt="${cancion.trackName}">
      <h3>${cancion.trackName}</h3>
      <p>${cancion.artistName}</p>
      <audio controls src="${audioUrl}"></audio>
    `;

    // Evento para guardar/quitar de favoritos
    const btnFav = card.querySelector('.fav-btn');
    btnFav.addEventListener('click', () => toggleFavorito(cancion, btnFav));

    // Control de audio único (pausa otros reproductores activados)
    const audioElement = card.querySelector('audio');
    audioElement.addEventListener('play', () => {
      document.querySelectorAll('audio').forEach(otherAudio => {
        if (otherAudio !== audioElement) otherAudio.pause();
      });
    });

    resultsGrid.appendChild(card);
  });
}

// Gestión de Favoritos
function toggleFavorito(cancion, boton) {
  const index = favoritos.findIndex(fav => fav.trackId === cancion.trackId);

  if (index === -1) {
    favoritos.push(cancion);
    boton.textContent = '❤️';
  } else {
    favoritos.splice(index, 1);
    boton.textContent = '🤍';
  }

  localStorage.setItem('soundpulse_favs', JSON.stringify(favoritos));
  actualizarContadorFavoritos();

  if (currentView === 'favs') {
    mostrarFavoritos();
  }
}

function mostrarFavoritos() {
  if (favoritos.length === 0) {
    statusMessage.textContent = 'Aún no tienes canciones en tus favoritos. ¡Agrega algunas usando el ❤️!';
    resultsGrid.innerHTML = '';
    return;
  }

  statusMessage.textContent = `Tus ${favoritos.length} canciones favoritas:`;
  mostrarCanciones(favoritos);
}

function actualizarContadorFavoritos() {
  favCount.textContent = favoritos.length;
}