// Configuration
const API_KEY = 'mixedtrip-api-key-2024';
const headers = { 'X-API-Key': API_KEY };

// Éléments DOM
const searchForm = document.getElementById('searchForm');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const modal = document.getElementById('sejourModal');
const modalContent = document.getElementById('modalContent');
const dateInput = document.getElementById('date');
const returnDateInput = document.getElementById('returnDate');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// Images placeholder depuis Unsplash
const IMAGES = {
    hotels: {
        hilton: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        default: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80'
    },
    circuits: {
        kamba7: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?auto=format&fit=crop&w=800&q=80',
        kamba4: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        default: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
    },
    transport: {
        car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80'
    }
};

// Données globales
let dbData = null;
let citiesData = [];

// Charger les données depuis db.json
async function loadData() {
    try {
        const response = await fetch('/data/json/db.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données');
        }
        dbData = await response.json();
        citiesData = dbData.cities;
        
        // Afficher le hub initial
        displayInitialHub();
    } catch (error) {
        console.error('Erreur chargement des données:', error);
        showError('Erreur lors du chargement des données');
    }
}

// Fonction pour obtenir l'image appropriée pour un hôtel
function getHotelImage(hotel) {
    if (hotel.name.toLowerCase().includes('hilton')) {
        return IMAGES.hotels.hilton;
    }
    return IMAGES.hotels.default;
}

// Fonction pour obtenir l'image appropriée pour un circuit
function getCircuitImage(circuit) {
    if (circuit.title.toLowerCase().includes('7 nuits')) {
        return IMAGES.circuits.kamba7;
    } else if (circuit.title.toLowerCase().includes('4 nuits')) {
        return IMAGES.circuits.kamba4;
    }
    return IMAGES.circuits.default;
}

// Afficher le hub initial avec les circuits et hôtels
function displayInitialHub() {
    const hotels = dbData.hotels;
    const circuits = dbData.circuits;
    
    const hubContent = `
        <div class="hub-section">
            <h2>Nos Hôtels</h2>
            <div class="results-grid">
                ${hotels.map((hotel, index) => `
                    <div class="result-card" onclick="showHotelDetails(${index})">
                        <div class="result-image-container">
                            <img src="${getHotelImage(hotel)}" 
                                 alt="${hotel.name}" 
                                 class="result-image">
                            <div class="result-badge">
                                ${hotel.rating} ⭐
                            </div>
                        </div>
                        <div class="result-content">
                            <div class="result-header">
                                <div class="result-title">${hotel.name}</div>
                            </div>
                            <div class="result-info">
                                <i class="fas fa-map-marker-alt"></i>
                                ${hotel.city}, ${hotel.country}
                            </div>
                            <div class="result-details">
                                ${hotel.amenities ? `
                                    <div class="hotel-amenities">
                                        ${hotel.amenities.slice(0, 3).map(amenity => 
                                            `<span class="amenity"><i class="fas fa-check"></i> ${amenity}</span>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="result-price">
                                <div class="price-amount">À partir de ${hotel.rooms?.[0]?.pricePerNight || '---'}€</div>
                                <div class="price-detail">par nuit</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="hub-section">
            <h2>Nos Circuits</h2>
            <div class="results-grid">
                ${circuits.map((circuit, index) => `
                    <div class="result-card" onclick="showCircuitDetails(${index})">
                        <div class="result-image-container">
                            <img src="${getCircuitImage(circuit)}" 
                                 alt="${circuit.title}" 
                                 class="result-image">
                            <div class="result-badge">
                                ${circuit.duration.days} jours
                            </div>
                        </div>
                        <div class="result-content">
                            <div class="result-header">
                                <div class="result-title">${circuit.title}</div>
                            </div>
                            <div class="result-info">
                                <i class="fas fa-map-marker-alt"></i>
                                ${circuit.destination.city}, ${circuit.destination.country}
                            </div>
                            <div class="result-details">
                                ${circuit.highlights ? `
                                    <div class="circuit-highlights">
                                        ${circuit.highlights.slice(0, 2).map(highlight => 
                                            `<div class="highlight"><i class="fas fa-check"></i> ${highlight}</div>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="result-price">
                                <div class="price-amount">${circuit.pricing.basePrice}€</div>
                                <div class="price-detail">par personne</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = hubContent;
}

// Charger les données au démarrage
loadData();

// Initialisation des dates
const today = new Date();
dateInput.min = today.toISOString().split('T')[0];
dateInput.addEventListener('change', (e) => {
    const selectedDate = new Date(e.target.value);
    returnDateInput.min = selectedDate.toISOString().split('T')[0];
    
    if (returnDateInput.value && new Date(returnDateInput.value) < selectedDate) {
        returnDateInput.value = '';
    }
    
    returnDateInput.parentElement.classList.add('visible');
});

// Fonction d'autocomplétion
function autocomplete(input, suggestionsDiv, type) {
    const query = input.value.trim().toLowerCase();
    
    // Afficher les suggestions dès qu'on commence à taper
    if (query.length === 0) {
        const allCities = citiesData.filter(city => !type || city.type === type);
        displaySuggestions(allCities, suggestionsDiv, input.id);
        return;
    }

    const filteredCities = citiesData.filter(city => 
        (!type || city.type === type) && 
        (city.name.toLowerCase().includes(query) || 
         (city.code && city.code.toLowerCase().includes(query)) ||
         city.country.toLowerCase().includes(query))
    );

    displaySuggestions(filteredCities, suggestionsDiv, input.id);
}

// Fonction d'affichage des suggestions
function displaySuggestions(cities, suggestionsDiv, inputId) {
    if (cities.length > 0) {
        suggestionsDiv.innerHTML = cities.map(city => `
            <div class="suggestion-item" onclick="selectCity('${city.name}', '${city.code}', '${inputId}')">
                <i class="fas fa-map-marker-alt"></i>
                <div class="suggestion-content">
                    <div class="suggestion-name">${city.name} (${city.code})</div>
                    <div class="suggestion-country">${city.country}</div>
                </div>
            </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

// Afficher une erreur
function showError(message, duration = 5000) {
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, duration);
}

// Sélection d'une ville
function selectCity(cityName, cityCode, inputId) {
    const input = document.getElementById(inputId);
    input.value = `${cityName} (${cityCode})`;
    input.dataset.code = cityCode;
    document.getElementById(inputId + 'Suggestions').style.display = 'none';
}

// Gestionnaires d'événements pour l'autocomplétion
document.getElementById('depart').addEventListener('input', (e) => {
    autocomplete(e.target, document.getElementById('departSuggestions'), 'departure');
});

document.getElementById('destination').addEventListener('input', (e) => {
    autocomplete(e.target, document.getElementById('destinationSuggestions'), 'destination');
});

// Focus sur les champs de saisie
document.getElementById('depart').addEventListener('focus', (e) => {
    autocomplete(e.target, document.getElementById('departSuggestions'), 'departure');
});

document.getElementById('destination').addEventListener('focus', (e) => {
    autocomplete(e.target, document.getElementById('destinationSuggestions'), 'destination');
});

// Fermer les suggestions en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.matches('.form-group input') && !e.target.closest('.suggestions')) {
        document.querySelectorAll('.suggestions').forEach(div => {
            div.style.display = 'none';
        });
    }
});

// Fonction d'affichage des résultats
function displayResults(sejours) {
    if (!Array.isArray(sejours) || sejours.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Aucun séjour disponible</h3>
                <p>Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        return;
    }

    resultsDiv.innerHTML = sejours.map((sejour, index) => `
        <div class="result-card" onclick="showSejourDetails(${index})">
            <div class="result-image-container">
                <img src="${sejour.hotel?.image || '/assets/images/default-hotel.jpg'}" 
                     alt="${sejour.hotel?.name}" 
                     class="result-image">
                <div class="result-badge">
                    ${sejour.circuit?.duration?.days || sejour.duration} jours
                </div>
            </div>
            <div class="result-content">
                <div class="result-header">
                    <div class="result-title">${sejour.hotel?.name}</div>
                    <div class="result-rating">
                        ${Array(Math.round(sejour.hotel?.rating || 0)).fill('⭐').join('')}
                    </div>
                </div>
                <div class="result-info">
                    <i class="fas fa-map-marker-alt"></i>
                    ${sejour.hotel?.city}, ${sejour.hotel?.country}
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <i class="fas fa-plane"></i>
                        ${sejour.vol?.compagnie}
                    </div>
                    <div class="result-detail">
                        <i class="fas fa-clock"></i>
                        ${sejour.vol?.duree}
                    </div>
                </div>
                <div class="result-circuit">
                    <i class="fas fa-route"></i>
                    ${sejour.circuit?.title}
                </div>
                <div class="result-price">
                    <div class="price-amount">${sejour.prix?.total}€</div>
                    <div class="price-detail">par personne</div>
                </div>
            </div>
        </div>
    `).join('');

    window.sejours = sejours;
}

// Afficher les détails d'un séjour dans la modal
function showSejourDetails(index) {
    const sejour = window.sejours[index];
    modalContent.innerHTML = `
        <div class="modal-grid">
            <div class="modal-section flight-section">
                <h3><i class="fas fa-plane"></i> Vol</h3>
                <div class="flight-details">
                    <div class="flight-route">
                        <div class="flight-point">
                            <div class="time">${sejour.vol?.heureDepart}</div>
                            <div class="city">${sejour.vol?.depart}</div>
                        </div>
                        <div class="flight-line">
                            <div class="duration">${sejour.vol?.duree}</div>
                        </div>
                        <div class="flight-point">
                            <div class="time">${sejour.vol?.heureArrivee}</div>
                            <div class="city">${sejour.vol?.destination}</div>
                        </div>
                    </div>
                    <div class="flight-info">
                        <div class="airline">
                            <i class="fas fa-plane"></i>
                            ${sejour.vol?.compagnie}
                        </div>
                        <div class="flight-number">
                            Vol ${sejour.vol?.numero}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-section hotel-section">
                <h3><i class="fas fa-hotel"></i> Hébergement</h3>
                <img src="${sejour.hotel?.image || '/assets/images/default-hotel.jpg'}" 
                     alt="${sejour.hotel?.name}" 
                     class="hotel-image">
                <div class="hotel-details">
                    <h4>${sejour.hotel?.name}</h4>
                    <div class="hotel-rating">
                        ${Array(Math.round(sejour.hotel?.rating || 0)).fill('⭐').join('')}
                    </div>
                    <div class="hotel-amenities">
                        ${sejour.hotel?.amenities?.map(amenity => 
                            `<span class="amenity"><i class="fas fa-check"></i> ${amenity}</span>`
                        ).join('') || ''}
                    </div>
                </div>
            </div>
            <div class="modal-section circuit-section">
                <h3><i class="fas fa-route"></i> Circuit</h3>
                <img src="${sejour.circuit?.image || '/assets/images/default-circuit.jpg'}" 
                     alt="${sejour.circuit?.title}" 
                     class="circuit-image">
                <div class="circuit-details">
                    <h4>${sejour.circuit?.title}</h4>
                    <p>${sejour.circuit?.description}</p>
                    ${sejour.circuit?.highlights ? `
                        <div class="circuit-highlights">
                            <h5>Points forts :</h5>
                            <ul>
                                ${sejour.circuit.highlights.map(highlight => 
                                    `<li><i class="fas fa-check"></i> ${highlight}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <div class="price-breakdown">
                <div class="price-item">
                    <span>Vol</span>
                    <span>${sejour.prix?.vol}€</span>
                </div>
                <div class="price-item">
                    <span>Hébergement</span>
                    <span>${sejour.prix?.hotel}€</span>
                </div>
                <div class="price-item">
                    <span>Circuit</span>
                    <span>${sejour.prix?.circuit}€</span>
                </div>
                <div class="price-total">
                    <span>Total par personne</span>
                    <span>${sejour.prix?.total}€</span>
                </div>
            </div>
            <button class="book-button" onclick="reserverSejour(${index})">
                <i class="fas fa-check"></i> Réserver ce séjour
            </button>
        </div>
    `;
    modal.style.display = 'block';
}

// Fermer la modal
function closeModal() {
    modal.style.display = 'none';
}

// Réserver un séjour
function reserverSejour(index) {
    const sejour = window.sejours[index];
    // TODO: Implémenter la logique de réservation
    alert(`Réservation du séjour à ${sejour.hotel?.city} pour ${sejour.prix?.total}€ par personne`);
}

// Fermer la modal en cliquant en dehors
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// Validation du formulaire avant soumission
function validateForm() {
    const depart = document.getElementById('depart');
    const destination = document.getElementById('destination');
    const date = document.getElementById('date');
    
    if (!depart.dataset.code) {
        showError('Veuillez sélectionner une ville de départ valide');
        return false;
    }
    
    if (!destination.dataset.code) {
        showError('Veuillez sélectionner une destination valide');
        return false;
    }
    
    if (!date.value) {
        showError('Veuillez sélectionner une date de départ');
        return false;
    }

    const selectedDate = new Date(date.value);
    if (selectedDate < today) {
        showError('La date de départ doit être future');
        return false;
    }

    return true;
}

// Recherche de séjours
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    errorDiv.style.display = 'none';

    const formData = new FormData(searchForm);
    const params = new URLSearchParams();
    
    params.append('depart', document.getElementById('depart').dataset.code);
    params.append('destination', document.getElementById('destination').dataset.code);
    params.append('date', formData.get('date'));
    if (formData.get('returnDate')) {
        params.append('returnDate', formData.get('returnDate'));
    }
    params.append('guests', formData.get('guests') || '2');
    params.append('duration', formData.get('duration') || '7');

    try {
        const response = await fetch(`/api/sejours?${params}`, { 
            headers,
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Une erreur est survenue');
        }
        
        loadingDiv.style.display = 'none';
        displayResults(data);
        
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        loadingDiv.style.display = 'none';
        showError(error.message || 'Erreur de connexion au serveur');
    }
});

// Afficher les détails d'un hôtel dans la modal
function showHotelDetails(index) {
    const hotel = dbData.hotels[index];
    modalContent.innerHTML = `
        <div class="modal-grid">
            <div class="modal-section hotel-section">
                <h3><i class="fas fa-hotel"></i> ${hotel.name}</h3>
                <img src="${getHotelImage(hotel)}" 
                     alt="${hotel.name}" 
                     class="hotel-image">
                <div class="hotel-details">
                    <div class="hotel-rating">
                        ${Array(Math.round(hotel.rating || 0)).fill('⭐').join('')}
                    </div>
                    <div class="hotel-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${hotel.city}, ${hotel.country}
                    </div>
                    ${hotel.amenities ? `
                        <div class="hotel-amenities">
                            ${hotel.amenities.map(amenity => 
                                `<span class="amenity"><i class="fas fa-check"></i> ${amenity}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                    <div class="hotel-description">
                        ${hotel.description || ''}
                    </div>
                    <div class="price-section">
                        <div class="price-amount">À partir de ${hotel.rooms?.[0]?.pricePerNight || '---'}€</div>
                        <div class="price-detail">par nuit</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

// Afficher les détails d'un circuit dans la modal
function showCircuitDetails(index) {
    const circuit = dbData.circuits[index];
    modalContent.innerHTML = `
        <div class="modal-grid">
            <div class="modal-section circuit-section">
                <h3><i class="fas fa-route"></i> ${circuit.title}</h3>
                <img src="${getCircuitImage(circuit)}" 
                     alt="${circuit.title}" 
                     class="circuit-image">
                <div class="circuit-details">
                    <div class="circuit-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${circuit.destination.city}, ${circuit.destination.country}
                    </div>
                    <div class="circuit-duration">
                        <i class="fas fa-clock"></i>
                        ${circuit.duration.days} jours / ${circuit.duration.nights} nuits
                    </div>
                    ${circuit.description ? `
                        <div class="circuit-description">
                            ${circuit.description}
                        </div>
                    ` : ''}
                    ${circuit.highlights ? `
                        <div class="circuit-highlights">
                            <h4>Points forts du circuit :</h4>
                            <ul>
                                ${circuit.highlights.map(highlight => 
                                    `<li><i class="fas fa-check"></i> ${highlight}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="price-section">
                        <div class="price-amount">${circuit.pricing.basePrice}€</div>
                        <div class="price-detail">par personne</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
} 