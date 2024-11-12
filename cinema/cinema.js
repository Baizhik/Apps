const apiKey = "80cc044e9f3f77945ee41503157a473a";
const trendingGrid = document.getElementById("trending-grid");
const newReleasesGrid = document.getElementById("new-releases-grid");
const searchResultsGrid = document.getElementById("search-results-grid");

let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

/* ------------------------------- Movie Fetching and Display ------------------------------- */

async function fetchMovies(endpoint, gridElement, sortBy = "popularity.desc") {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${sortBy}&page=1`);
        const data = await response.json();
        displayMovies(data.results, gridElement);
    } catch (error) {
        console.error("Error fetching movies:", error);
        gridElement.innerHTML = "<p>Error loading movies. Please try again later.</p>";
    }
}

function displayMovies(movies, gridElement) {
    gridElement.innerHTML = "";
    movies.forEach(movie => {
        const movieItem = document.createElement("div");
        movieItem.classList.add("grid-item");
        const sectionPrefix = gridElement === trendingGrid ? "trending" : 
                              gridElement === newReleasesGrid ? "newreleases" : "searchresults";
        const heartIconId = `heart-${sectionPrefix}-${movie.id}`;
        movieItem.innerHTML = `
            <div style="position: relative;">
                <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}">
                <span class="heart-icon" onclick="toggleWatchlist(${movie.id}, '${movie.title}', '${movie.poster_path}')" id="${heartIconId}">♥</span>
            </div>
        `;
        movieItem.querySelector("img").addEventListener("click", () => showMovieDetails(movie.id));
        gridElement.appendChild(movieItem);
        updateHeartIcon(movie.id);
    });
}

/* ------------------------------- Sort  ------------------------------- */
function sortMovies() {
    const sortBy = document.getElementById("sort-select").value;
    fetchMovies("discover", searchResultsGrid, sortBy);
    const sortTitle = document.getElementById("sorted-title");
    if (sortBy === "popularity.desc") {
        sortTitle.textContent = "Sorted by Popularity";
    } else if (sortBy === "release_date.desc") {
        sortTitle.textContent = "Sorted by Release Date";
    } else if (sortBy === "vote_average.desc") {
        sortTitle.textContent = "Sorted by Rating";
    }
    toggleGridVisibility(false);
    sortTitle.style.display = "block";
}

function fetchMoviesBySearch(query) {
    const sortBy = document.getElementById("sort-select").value;
    fetch(`https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${apiKey}&language=en-US&page=1&sort_by=${sortBy}`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                displayMovies(data.results, searchResultsGrid);
                toggleGridVisibility(false);
            } else {
                searchResultsGrid.innerHTML = "<p>No movies found.</p>";
            }
        })
        .catch(error => {
            console.error("Error fetching search results:", error);
            searchResultsGrid.innerHTML = "<p>Error loading search results.</p>";
        });
}

/* ------------------------------- Movie Details Modal ------------------------------- */

async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`);
        const movie = await response.json();
        const creditsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`);
        const credits = await creditsResponse.json();
        const cast = credits.cast.slice(0, 5).map(member => member.name).join(', ');
        const director = credits.crew.find(member => member.job === 'Director')?.name || "N/A";
        const producer = credits.crew.find(member => member.job === 'Producer')?.name || "N/A";
        const writer = credits.crew.find(member => member.job === 'Writer')?.name || "N/A";
        document.getElementById("modal-title").textContent = movie.title;
        document.getElementById("modal-overview").textContent = movie.overview;
        document.getElementById("modal-release-date").textContent = `Release Date: ${movie.release_date}`;
        document.getElementById("modal-runtime").textContent = `Runtime: ${movie.runtime} mins`;
        document.getElementById("modal-rating").textContent = `Rating: ${movie.vote_average.toFixed(1)}/10`;
        document.getElementById("modal-cast").textContent = `Cast: ${cast}`;
        document.getElementById("modal-crew").textContent = `Director: ${director} | Producer: ${producer} | Writer: ${writer}`;
        const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : 'path/to/default/image.jpg';
        document.getElementById("modal-poster").src = posterPath;
        document.getElementById("modal-poster").alt = `${movie.title} Poster`;
        const modal = document.getElementById("movie-details-modal");
        modal.style.display = "block";
        setTimeout(() => {
            modal.style.opacity = "1";
        }, 10);
    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
}

function closeModal() {
    document.getElementById("movie-details-modal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("movie-details-modal");
    if (event.target === modal) {
        closeModal();
    }
};

/* ------------------------------- Movie Search and Suggestions ------------------------------- */

async function suggestMovies() {
    const query = document.querySelector(".search-input").value.trim();
    const suggestionsDiv = document.getElementById("suggestions");
    suggestionsDiv.innerHTML = "";
    if (query.length < 3) {
        suggestionsDiv.style.display = "none";
        return;
    }
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${apiKey}&language=en-US&page=1`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 5).forEach(movie => {
                const suggestionItem = document.createElement("div");
                suggestionItem.classList.add("suggestion-item");
                suggestionItem.textContent = movie.title;
                suggestionItem.onclick = () => selectSuggestion(movie.title);
                suggestionsDiv.appendChild(suggestionItem);
            });
            suggestionsDiv.style.display = "block";
        } else {
            suggestionsDiv.style.display = "none";
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
}

function selectSuggestion(suggestion) {
    document.querySelector(".search-input").value = suggestion;
    document.getElementById("suggestions").style.display = "none";
    searchMovies();
}

function searchMovies() {
    const query = document.querySelector(".search-input").value.trim();
    if (query) {
        fetchMoviesBySearch(query);
    } else {
        toggleGridVisibility(true);
    }
}

function fetchMoviesBySearch(query) {
    fetch(`https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${apiKey}&language=en-US&page=1`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                displayMovies(data.results, searchResultsGrid);
                toggleGridVisibility(false);
            } else {
                searchResultsGrid.innerHTML = "<p>No movies found.</p>";
            }
        })
        .catch(error => {
            console.error("Error fetching search results:", error);
            searchResultsGrid.innerHTML = "<p>Error loading search results.</p>";
        });
}

document.addEventListener("click", function(event) {
    const suggestionsDiv = document.getElementById("suggestions");
    const searchInput = document.querySelector(".search-input");
    if (suggestionsDiv.style.display === "block" && !suggestionsDiv.contains(event.target) && !searchInput.contains(event.target)) {
        suggestionsDiv.style.display = "none";
    }
});

/* ------------------------------- Grid Toggle and Scrolling ------------------------------- */

function toggleGridVisibility(showOriginalGrids) {
    const trendingSection = document.getElementById("trending-section");
    const newReleasesSection = document.getElementById("new-releases-section");
    const searchResultsSection = document.getElementById("search-results-section");
    const sortTitle = document.getElementById("sorted-title");
    trendingSection.style.display = showOriginalGrids ? "block" : "none";
    newReleasesSection.style.display = showOriginalGrids ? "block" : "none";
    searchResultsSection.style.display = showOriginalGrids ? "none" : "block";
    sortTitle.style.display = showOriginalGrids ? "none" : "block";
}

function scrollGridLeft(gridId) {
    const grid = document.getElementById(gridId);
    if (grid) {
        grid.scrollBy({ left: -300, behavior: 'smooth' });
    }
}

function scrollGridRight(gridId) {
    const grid = document.getElementById(gridId);
    if (grid) {
        grid.scrollBy({ left: 300, behavior: 'smooth' });
    }
}

/* ------------------------------- watch list ------------------------------- */

function displayWatchlist() {
    const watchlistGrid = document.getElementById("watchlist-grid");
    watchlistGrid.innerHTML = "";
    if (watchlist.length == 0) {
        watchlistGrid.innerHTML = "<p class='empty-message'>Your watchlist is empty.</p>";
        return;
    }
    watchlist.forEach(movie => {
        const movieItem = document.createElement("div");
        movieItem.classList.add("grid-item");
        const heartIconId = `heart-watchlist-${movie.id}`;
        movieItem.innerHTML = `
            <div style="position: relative;">
                <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}">
                <span class="heart-icon" onclick="toggleWatchlist(${movie.id}, '${movie.title}', '${movie.poster_path}')" id="${heartIconId}">♥</span>
            </div>
        `;
        movieItem.querySelector("img").addEventListener("click", () => showMovieDetails(movie.id));
        watchlistGrid.appendChild(movieItem);
        updateHeartIcon(movie.id);
    });
}

function toggleWatchlist(movieId, movieTitle, posterPath) {
    const movieIndex = watchlist.findIndex(movie => movie.id === movieId);
    if (movieIndex === -1) {
        watchlist.push({ id: movieId, title: movieTitle, poster_path: posterPath });
        alert(`${movieTitle} added to your watchlist`);
    } else {
        watchlist.splice(movieIndex, 1);
        alert(`${movieTitle} removed from your watchlist`);
    }
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    updateHeartIcon(movieId);
    const watchlistSection = document.getElementById("watchlist-section");
    if (watchlistSection.style.display === "block") {
        displayWatchlist();
    }
}

function updateHeartIcon(movieId) {
    const heartIcons = document.querySelectorAll(`[id^="heart-"][id$="-${movieId}"]`);
    heartIcons.forEach(heartIcon => {
        const isInWatchlist = watchlist.some(movie => movie.id === movieId);
        heartIcon.style.color = isInWatchlist ? "red" : "gray";
    });
}

function toggleWatchlistView() {
    const watchlistSection = document.getElementById("watchlist-section");
    const isVisible = watchlistSection.style.display === "block";
    if (isVisible) {
        watchlistSection.style.display = "none";
    } else {
        watchlistSection.style.display = "block";
        displayWatchlist();
    }
}

/* ------------------------------- Initial Fetch ------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    fetchMovies("popular", trendingGrid);
    fetchMovies("now_playing", newReleasesGrid);
});
