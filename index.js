require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./data/json/db.json');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// API Key middleware
const API_KEY = 'mixedtrip-api-key-2024';
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'API Key invalide ou manquante' });
    }
    next();
};

// Documentation route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Validation de date
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date >= new Date();
};

// Endpoints
app.get('/api/cities/autocomplete', checkApiKey, (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    if (query.length < 2) {
        return res.json([]);
    }

    const results = db.cities
        .filter(city => {
            const cityName = city.name.toLowerCase();
            const countryName = city.country.toLowerCase();
            return cityName.includes(query) || 
                   countryName.includes(query) ||
                   (city.code && city.code.toLowerCase().includes(query));
        })
        .map(city => ({
            id: city.id || city.code,
            name: city.name,
            country: city.country,
            code: city.code,
            type: city.type || 'city',
            location: city.location || null,
            region: city.region || null,
            fullName: `${city.name}, ${city.country} (${city.code})`
        }))
        .slice(0, 10);

    res.json(results);
});

app.get('/api/hotels/search', checkApiKey, (req, res) => {
    const { city, country, checkIn, checkOut, guests } = req.query;
    
    let hotels = db.hotels;
    if (city) {
        hotels = hotels.filter(hotel => 
            hotel.city.toLowerCase() === city.toLowerCase() ||
            hotel.country.toLowerCase() === country.toLowerCase()
        );
    }

    const results = hotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        location: hotel.location,
        amenities: hotel.amenities,
        rating: hotel.rating,
        rooms: hotel.rooms.map(room => ({
            ...room,
            available: true, // En production, vérifier la vraie disponibilité
            totalPrice: room.pricePerNight * (checkIn && checkOut ? 
                Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) : 1)
        })),
        thumbnail: `/images/hotels/${hotel.id}.jpg`,
        distance: hotel.location ? calculateDistance(hotel.location) : null
    }));

    res.json(results);
});

app.get('/api/circuits/search', checkApiKey, (req, res) => {
    const { destination, duration, startDate } = req.query;
    
    let circuits = db.circuits;
    if (destination) {
        circuits = circuits.filter(circuit => 
            circuit.destination.city?.toLowerCase() === destination.toLowerCase() ||
            circuit.destination.country.toLowerCase() === destination.toLowerCase()
        );
    }

    if (duration) {
        circuits = circuits.filter(circuit => 
            circuit.duration.days <= parseInt(duration)
        );
    }

    const results = circuits.map(circuit => ({
        id: circuit.id,
        title: circuit.title || circuit.name,
        description: circuit.description,
        destination: circuit.destination,
        duration: circuit.duration,
        highlights: circuit.highlights,
        itinerary: circuit.itinerary,
        pricing: {
            ...circuit.pricing,
            available: true, // En production, vérifier la vraie disponibilité
            startDate: startDate || null
        },
        thumbnail: `/images/circuits/${circuit.id}.jpg`
    }));

    res.json(results);
});

app.get('/api/sejours', checkApiKey, async (req, res) => {
    const { depart, destination, date, guests = 2, duration = 7 } = req.query;

    // Validation des paramètres
    if (!depart || !destination || !date || !isValidDate(date)) {
        return res.status(400).json({
            error: "Paramètres invalides",
            details: "Tous les champs (départ, destination, date) sont requis et la date doit être valide"
        });
    }

    try {
        // 1. Rechercher la ville de destination
        const destinationCity = db.cities.find(city => 
            city.code === destination || 
            city.name.toLowerCase() === destination.toLowerCase()
        );

        if (!destinationCity) {
            return res.status(404).json({
                error: "Destination non trouvée",
                details: "Cette destination n'est pas disponible dans notre système"
            });
        }

        // 2. Rechercher tous les circuits disponibles dans la destination
        const availableCircuits = db.circuits.filter(circuit => 
            (circuit.destination.city?.toLowerCase() === destinationCity.name.toLowerCase() ||
             circuit.destination.country.toLowerCase() === destinationCity.country.toLowerCase())
        ).map(circuit => ({
            ...circuit,
            image: `/assets/images/circuits/${circuit.id}.jpg`
        }));

        // 3. Pour chaque circuit, trouver les hôtels compatibles
        const availableHotels = db.hotels.filter(hotel => 
            hotel.city.toLowerCase() === destinationCity.name.toLowerCase() ||
            hotel.country.toLowerCase() === destinationCity.country.toLowerCase()
        ).map(hotel => {
            const appropriateRooms = hotel.rooms.filter(room => room.capacity >= guests);
            return {
                ...hotel,
                availableRooms: appropriateRooms,
                image: `/assets/images/hotels/${hotel.id}.jpg`
            };
        }).filter(hotel => hotel.availableRooms.length > 0);

        if (!availableCircuits.length || !availableHotels.length) {
            return res.status(404).json({
                error: "Aucun séjour disponible",
                details: "Pas d'hôtels ou de circuits disponibles pour cette destination"
            });
        }

        // 4. Générer les vols possibles (simulation - à remplacer par l'API réelle)
        const generateFlights = (date) => {
            const flights = [];
            const airlines = [
                { name: "Air France", code: "AF" },
                { name: "Air Congo", code: "AC" },
                { name: "Ethiopian Airlines", code: "ET" },
                { name: "Royal Air Maroc", code: "AT" },
                { name: "Kenya Airways", code: "KQ" }
            ];
            
            const departureTimes = ["07:00", "10:00", "14:00", "16:00", "19:00"];
            
            airlines.forEach(airline => {
                departureTimes.forEach(depTime => {
                    const flightDuration = Math.floor(2 + Math.random() * 4); // 2-6 heures
                    const arrivalTime = new Date(`2000-01-01T${depTime}`);
                    arrivalTime.setHours(arrivalTime.getHours() + flightDuration);
                    
                    flights.push({
                        compagnie: airline.name,
                        numero: `${airline.code}${Math.floor(1000 + Math.random() * 9000)}`,
                        prix: Math.floor(400 + Math.random() * 300), // 400-700€
                        duree: `${flightDuration}h00`,
                        heureDepart: depTime,
                        heureArrivee: arrivalTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    });
                });
            });
            
            return flights;
        };

        const possibleFlights = generateFlights(date);

        // 5. Générer toutes les combinaisons possibles
        let sejours = [];
        for (const circuit of availableCircuits) {
            const circuitDuration = circuit.duration.days || 3;
            
            // Calculer les durées de séjour possibles
            const possibleDurations = [];
            for (let d = circuitDuration; d <= Math.max(duration, circuitDuration + 3); d++) {
                possibleDurations.push(d);
            }

            for (const hotel of availableHotels) {
                for (const room of hotel.availableRooms) {
                    for (const vol of possibleFlights) {
                        for (const totalDuration of possibleDurations) {
                            // Calculer les dates
                            const dateDepart = new Date(date);
                            const dateRetour = new Date(dateDepart);
                            dateRetour.setDate(dateRetour.getDate() + totalDuration);

                            // Calculer le prix total du séjour
                            const hotelPrice = room.pricePerNight * totalDuration;
                            const circuitPrice = circuit.pricing.basePrice;
                            const flightPrice = vol.prix;
                            const totalPrice = hotelPrice + circuitPrice + flightPrice;

                            // Créer le séjour
                            sejours.push({
                                id: `${depart}-${destination}-${date}-${hotel.id}-${circuit.id}-${vol.numero}`,
                                vol: {
                                    ...vol,
                                    depart: depart,
                                    destination: destination,
                                    dateDepart: dateDepart.toISOString().split('T')[0],
                                    dateRetour: dateRetour.toISOString().split('T')[0]
                                },
                                hotel: {
                                    id: hotel.id,
                                    name: hotel.name,
                                    description: hotel.description,
                                    chambre: {
                                        ...room,
                                        totalNights: totalDuration
                                    },
                                    rating: hotel.rating,
                                    amenities: hotel.amenities,
                                    adresse: hotel.contact?.address,
                                    coordinates: hotel.location,
                                    image: hotel.image
                                },
                                circuit: {
                                    id: circuit.id,
                                    title: circuit.name || circuit.title,
                                    description: circuit.description,
                                    duration: circuit.duration,
                                    highlights: circuit.highlights,
                                    itinerary: circuit.itinerary,
                                    image: circuit.image
                                },
                                prix: {
                                    vol: flightPrice,
                                    hotel: hotelPrice,
                                    circuit: circuitPrice,
                                    total: totalPrice,
                                    parPersonne: Math.ceil(totalPrice / guests),
                                    currency: "EUR"
                                },
                                duration: totalDuration,
                                guests: parseInt(guests),
                                dates: {
                                    depart: dateDepart.toISOString().split('T')[0],
                                    retour: dateRetour.toISOString().split('T')[0]
                                }
                            });
                        }
                    }
                }
            }
        }

        // 6. Trier et filtrer les résultats
        sejours.sort((a, b) => a.prix.parPersonne - b.prix.parPersonne);

        // Regrouper les séjours similaires et garder les meilleurs prix
        const uniqueSejours = [];
        const seen = new Set();

        for (const sejour of sejours) {
            const key = `${sejour.hotel.id}-${sejour.circuit.id}-${sejour.duration}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueSejours.push(sejour);
            }
        }

        // Retourner les 20 meilleures combinaisons uniques
        res.json(uniqueSejours.slice(0, 20));

    } catch (error) {
        console.error('Erreur lors de la recherche de séjours:', error);
        res.status(500).json({
            error: "Une erreur est survenue lors de la recherche de séjours",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Fonction utilitaire pour calculer la distance (à implémenter selon vos besoins)
function calculateDistance(location) {
    // Implémentation fictive - à remplacer par un vrai calcul de distance
    return {
        center: Math.random() * 5, // Distance du centre en km
        beach: Math.random() * 10, // Distance de la plage en km
        airport: Math.random() * 15 // Distance de l'aéroport en km
    };
}

app.post('/api/test/load', checkApiKey, (req, res) => {
  res.json({ success: true, message: 'Données chargées avec succès' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Une erreur est survenue',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ MixedTrip API running on port ${port}`);
  console.log(`📚 Documentation available at http://localhost:${port}`);
}); 