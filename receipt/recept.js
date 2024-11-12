const apiKey = "bb07e2796a624d5ebe502f33b8e337f6"; 
const recipeGrid = document.getElementById("recipe-grid"); 

let favoritesVisible = false;

function loadFavorites() {
    const userFavorites = localStorage.getItem("favorites");
    return userFavorites ? JSON.parse(userFavorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function showFavorites() {
    const favoritesSection = document.getElementById("favorites-section");
    const favoritesGrid = document.getElementById("favorites-grid");

    if (favoritesVisible) {
        favoritesSection.style.display = "none";
        favoritesVisible = false;
    } else {
        updateFavoritesGrid();
        favoritesSection.style.display = "block";
        favoritesVisible = true;
    }
}

function updateFavoritesGrid() {
    const favoritesGrid = document.getElementById("favorites-grid");
    const favorites = loadFavorites();

    favoritesGrid.innerHTML = "";

    if (favorites.length === 0) {
        favoritesGrid.innerHTML = "<p>No favorites added.</p>";
    } else {
        favorites.forEach(recipe => {
            const recipeItem = document.createElement("div");
            recipeItem.classList.add("grid-item");

            recipeItem.innerHTML = `
                <div style="position: relative;">
                    <img src="${recipe.image}" alt="${recipe.title}">
                    <span class="heart-icon favorited" data-id="${recipe.id}">&#10084;</span>
                </div>
                <h3>${recipe.title}</h3>
            `;

            const heartIcon = recipeItem.querySelector(".heart-icon");
            heartIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavorite(recipe);
                updateFavoritesGrid();
            });

            favoritesGrid.appendChild(recipeItem);
        });
    }
}


function displayFavorites() {
    const favoritesGrid = document.getElementById("favorites-grid");
    const favorites = loadFavorites(); 

    favoritesGrid.innerHTML = ""; 

    if (favorites.length === 0) {
        favoritesGrid.innerHTML = "<p>No favorites added.</p>";
        return;
    }

    favorites.forEach(favorite => {
        const recipeItem = document.createElement("div");
        recipeItem.classList.add("grid-item");
        
        recipeItem.innerHTML = `
            <div style="position: relative;">
                <img src="${favorite.image}" alt="${favorite.title}">
                <h3>${favorite.title}</h3>
            </div>
        `;

        favoritesGrid.appendChild(recipeItem);
    });
}

function toggleFavorite(recipe) {
    let favorites = loadFavorites();
    const isFavorited = favorites.some(fav => fav.id === recipe.id);

    if (isFavorited) {
        favorites = favorites.filter(fav => fav.id !== recipe.id);
    } else {
        favorites.push(recipe);
    }

    saveFavorites(favorites);
    updateHeartIcon(recipe.id, !isFavorited);
}

function updateHeartIcon(recipeId, isFavorited) {
    const heartIcons = document.querySelectorAll(`.heart-icon[data-id="${recipeId}"]`);
    heartIcons.forEach(heartIcon => {
        heartIcon.classList.toggle("favorited", isFavorited);
    });
}

async function getRecipeDetails(recipeId) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`);
        if (!response.ok) {
            throw new Error("Failed to fetch recipe details");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        return {};
    }
}

async function searchRecipes() {
    const query = document.querySelector(".search-input").value.trim();
    if (!query) {
        alert("Please enter a search term");
        return;
    }

    recipeGrid.innerHTML = ""; 

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=12&apiKey=${apiKey}`);
        const data = await response.json();
        displayRecipes(data.results);
    } catch (error) {
        console.error("Error fetching recipes:", error);
        recipeGrid.innerHTML = "<p>Error loading recipes. Please try again later.</p>";
    }
}

async function displayRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
        recipeGrid.innerHTML = "<p>No recipes found. Try a different search.</p>";
        return;
    }

    const uniqueRecipes = new Set();
    recipeGrid.innerHTML = ""; 

    const favorites = loadFavorites();

    for (let recipe of recipes) {
        if (!uniqueRecipes.has(recipe.id)) {
            uniqueRecipes.add(recipe.id);
            const details = await getRecipeDetails(recipe.id);

            const recipeItem = document.createElement("div");
            recipeItem.classList.add("grid-item");

            const isFavorited = favorites.some(fav => fav.id === recipe.id);

            recipeItem.innerHTML = `
                <div style="position: relative;">
                    <img src="${recipe.image}" alt="${recipe.title}">
                    <span class="heart-icon ${isFavorited ? 'favorited' : ''}" data-id="${recipe.id}">&#10084;</span>
                </div>
                <h3>${recipe.title}</h3>
                <p><strong>Prep Time:</strong> ${details.readyInMinutes ? details.readyInMinutes + " mins" : "N/A"}</p>
                <p>${details.summary ? details.summary.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 100) + "..." : "Description not available"}</p>
            `;

            recipeItem.querySelector(".heart-icon").addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavorite({ id: recipe.id, title: recipe.title, image: recipe.image });
            });

            recipeItem.addEventListener("click", () => showRecipeDetails(recipe.id));
            recipeGrid.appendChild(recipeItem);
        }
    }
}

async function showRecipeDetails(recipeId) {
    const modal = document.getElementById("recipe-modal");
    modal.style.display = "block";

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`);
        const data = await response.json();

        document.getElementById("modal-title").textContent = data.title;
        document.getElementById("modal-image").src = data.image;
        document.getElementById("modal-prep-time").textContent = data.readyInMinutes + " mins";

        const ingredientsList = document.getElementById("modal-ingredients").querySelector("ul");
        ingredientsList.innerHTML = "";
        data.extendedIngredients.forEach(ingredient => {
            const li = document.createElement("li");
            li.textContent = `${ingredient.original}`;
            ingredientsList.appendChild(li);
        });

        const cleanInstructions = data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available";
        document.getElementById("modal-instructions").querySelector("p").textContent = cleanInstructions;

        const nutrition = data.nutrition;
        document.getElementById("modal-nutrition").querySelector("p").textContent = `
            Calories: ${nutrition.nutrients.find(n => n.name === "Calories").amount} kcal 
            Protein: ${nutrition.nutrients.find(n => n.name === "Protein").amount}g
            Fat: ${nutrition.nutrients.find(n => n.name === "Fat").amount}g
        `;
    } catch (error) {
        console.error("Error fetching recipe details:", error);
    }
}

function closeModal() {
    const modal = document.getElementById("recipe-modal");
    modal.style.display = "none";
}

async function suggestRecipes() {
    const query = document.querySelector(".search-input").value.trim();
    const suggestionsDiv = document.getElementById("suggestions");
    suggestionsDiv.innerHTML = ""; 

    if (query.length < 3) { 
        suggestionsDiv.style.display = "none";
        return;
    }

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/autocomplete?query=${query}&number=5&apiKey=${apiKey}`);
        const suggestions = await response.json();

        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const suggestionItem = document.createElement("div");
                suggestionItem.classList.add("suggestion-item");
                suggestionItem.textContent = suggestion.title;
                suggestionItem.onclick = () => selectSuggestion(suggestion.title);
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
    searchRecipes(); 
}

window.addEventListener("click", function(event) {
    const suggestionsDiv = document.getElementById("suggestions");
    if (!event.target.closest(".search-container")) {
        suggestionsDiv.style.display = "none"; 
    }
});
