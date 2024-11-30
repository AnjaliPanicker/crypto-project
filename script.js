const API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&per_page=10&page=";
let currentPage = 1;
let cryptoData = [];
let selectedCryptos = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Function to display a toast notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Fetch cryptocurrency data with retry mechanism
function fetchCryptoData(page = 1, retries = 3) {
    $.get(`${API_URL}${page}`, function (data) {
        cryptoData = data;
        displayCryptoList(data);
    }).fail(function () {
        if (retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);
            fetchCryptoData(page, retries - 1);
        } else {
            showToast("Failed to fetch data. Please try again later.");
        }
    });
}

// Function to display the cryptocurrency list
function displayCryptoList(data) {
    const container = $("#crypto-container");
    container.empty();
    data.forEach((crypto) => {
        const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? "positive" : "negative";
        const isFavorite = favorites.includes(crypto.id) ? "favorite" : "";

        const item = `
            <div class="crypto-item ${isFavorite}" id="crypto-${crypto.id}" onclick="toggleSelection(
                '${crypto.id}', 
                '${crypto.name}', 
                ${crypto.current_price}, 
                '${crypto.symbol}', 
                ${crypto.price_change_percentage_24h}, 
                ${crypto.market_cap})">
                <h4>${crypto.name} (${crypto.symbol.toUpperCase()})</h4>
                <p>Price: CA$${crypto.current_price.toFixed(2)}</p>
                <p class="price-change ${priceChangeClass}">24h Change: ${crypto.price_change_percentage_24h.toFixed(2)}%</p>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${crypto.id}')">
                    ${isFavorite ? "★" : "☆"}
                </button>
            </div>
        `;
        container.append(item);
    });

    renderFavorites();
    renderSelections();
}

// Toggle cryptocurrency selection for comparison
function toggleSelection(id, name, price, symbol, price_change_percentage_24h, market_cap) {
    const card = $(`#crypto-${id}`);
    const existingIndex = selectedCryptos.findIndex((crypto) => crypto.id === id);

    if (existingIndex > -1) {
        selectedCryptos.splice(existingIndex, 1);
        card.removeClass("selected");
    } else {
        if (selectedCryptos.length < 5) {
            selectedCryptos.push({ id, name, price, symbol, price_change_percentage_24h, market_cap });
            card.addClass("selected");
        } else {
            showToast("You can only select up to 5 cryptocurrencies.");
            // alert("You can only select up to 5 cryptocurrencies.");
            return;
        }
    }

    updateCompareButton();
}

// Update the Compare button state based on selected coins
function updateCompareButton() {
    const compareButton = $("#compare-button");
    if (selectedCryptos.length > 1) {
        compareButton.removeClass("disabled").prop("disabled", false);
    } else {
        compareButton.addClass("disabled").prop("disabled", true);
    }
}

// Display the comparison view with selected cryptocurrencies
function displayComparison() {
    $("#home-view").removeClass("active");
    $("#compare-view").addClass("active");

    const container = $("#comparison-container");
    container.empty();

    selectedCryptos.forEach((crypto) => {
        const item = `
            <div class="comparison-item">
                <h4>${crypto.name} (${crypto.symbol.toUpperCase()})</h4>
                <p>Price: CA$${crypto.price.toFixed(2)}</p>
                <p>24h Change: ${crypto.price_change_percentage_24h.toFixed(2)}%</p>
                <p>Market Cap: CA$${(crypto.market_cap / 1e9).toFixed(2)}B</p>
                <p>Supply: ${(crypto.market_cap / crypto.current_price).toFixed(2)} tokens</p>
                <p>Volume (24h): CA$${crypto.market_cap.toFixed(2)}</p>
            </div>
        `;
        container.append(item);
    });

    highlightComparisonDifferences();
}

// Function to highlight the largest/smallest values in the comparison
function highlightComparisonDifferences() {
    const prices = selectedCryptos.map(crypto => crypto.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    selectedCryptos.forEach((crypto) => {
        const card = $(`#crypto-${crypto.id}`);
        if (crypto.price === maxPrice) {
            card.addClass("highlight-max");
        } else if (crypto.price === minPrice) {
            card.addClass("highlight-min");
        }
    });
}

// Back to home view
function goBack() {
    $("#compare-view").removeClass("active");
    $("#home-view").addClass("active");
}

// Sort cryptocurrencies by market cap
function sortByMarketCap() {
    const sortedData = [...cryptoData].sort((a, b) => b.market_cap - a.market_cap);
    displayCryptoList(sortedData);
    showToast("Cryptocurrencies sorted by market cap.");
}

// View 24-hour price change toggle
function viewPriceChange() {
    console.log("here")
    const container = $("#crypto-container");
    container.find(".price-change").toggleClass("visible");
}

// Apply filters for price range
function applyFilters() {
    const minPrice = parseFloat($("#min-price").val()) || 0;
    const maxPrice = parseFloat($("#max-price").val()) || Infinity;

    const filteredData = cryptoData.filter((crypto) => {
        return crypto.current_price >= minPrice && crypto.current_price <= maxPrice;
    });

    displayCryptoList(filteredData);
    showToast(`Filters applied: Price range CA$${minPrice} - CA$${maxPrice}`);
}

// Toggle favorite status for cryptocurrencies
function toggleFavorite(id) {
    const isFavorite = favorites.includes(id);

    if (isFavorite) {
        favorites = favorites.filter((fav) => fav !== id);
    } else {
        favorites.push(id);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    const card = $(`#crypto-${id}`);
    if (favorites.includes(id)) {
        card.addClass("favorite");
        card.find(".favorite-btn").text("★");
    } else {
        card.removeClass("favorite");
        card.find(".favorite-btn").text("☆");
    }
}

// Reapply favorite status to cryptocurrency cards
function renderFavorites() {
    favorites.forEach((id) => {
        const card = $(`#crypto-${id}`);
        if (card.length) {
            card.addClass("favorite");
            card.find(".favorite-btn").text("★");
        }
    });
}

// Reapply selection status to cryptocurrency cards
function renderSelections() {
    selectedCryptos.forEach((crypto) => {
        const card = $(`#crypto-${crypto.id}`);
        if (card.length) {
            card.addClass("selected");
        }
    });
}

let isGridView = true;

// Toggle display settings
function toggleDisplay() {
    isGridView = !isGridView;
    console.log(isGridView)
    if (isGridView) {
        $("#crypto-container").removeClass("list-view").addClass("grid-view");
    } else {
        $("#crypto-container").removeClass("grid-view").addClass("list-view");
    }
}

// Initialize the application
$(document).ready(function () {
    fetchCryptoData(currentPage);

    // Refresh data every 20 seconds (3 calls per minute)
    setInterval(() => {
        fetchCryptoData(currentPage);
    }, 20000);

    $("#compare-button").click(displayComparison);
    $("#back-button").click(goBack);
    $("#sort-market-cap").click(sortByMarketCap);
    $("#view-price-change").click(viewPriceChange);
    $("#toggle-display").click(toggleDisplay);
    $("#apply-filters").click(applyFilters);
});
