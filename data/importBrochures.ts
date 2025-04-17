import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { HotelModel } from '../src/models/Hotel';
import { CircuitModel } from '../src/models/Circuit';

dotenv.config();

interface RawHotel {
  name: string;
  description: string;
  city: string;
  country: string;
  stars: number;
  pricePerNight: {
    amount: number;
    currency: string;
  };
  amenities: string[];
}

interface RawCircuit {
  title: string;
  description: string;
  duration: {
    days: number;
    nights: number;
  };
  price: {
    amount: number;
    currency: string;
  };
  destinations: {
    city: string;
    country: string;
    description: string;
    duration: number;
  }[];
}

async function extractHotelData(pdfPath: string): Promise<RawHotel[]> {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    const hotels: RawHotel[] = [];

    // Exemple d'extraction pour le Hilton BZV
    // Cette logique devrait être adaptée selon la structure exacte du PDF
    const lines = data.text.split('\n').filter(line => line.trim());
    
    let currentHotel: Partial<RawHotel> = {};
    
    for (const line of lines) {
      if (line.includes('Hilton')) {
        if (Object.keys(currentHotel).length > 0) {
          hotels.push(currentHotel as RawHotel);
        }
        currentHotel = {
          name: line.trim(),
          city: 'BZV',
          country: 'Congo',
          stars: 5,
          amenities: [],
          pricePerNight: {
            amount: 0,
            currency: 'EUR'
          }
        };
      } else if (line.includes('€') || line.includes('EUR')) {
        // Extraction du prix
        const priceMatch = line.match(/(\d+)[\s€]*(EUR)?/);
        if (priceMatch) {
          currentHotel.pricePerNight = {
            amount: parseInt(priceMatch[1], 10),
            currency: 'EUR'
          };
        }
      } else if (line.length > 30) {
        // Considérer les longues lignes comme description
        currentHotel.description = line.trim();
      } else if (line.includes('WiFi') || line.includes('Restaurant') || line.includes('Pool')) {
        currentHotel.amenities?.push(line.trim());
      }
    }

    if (Object.keys(currentHotel).length > 0) {
      hotels.push(currentHotel as RawHotel);
    }

    return hotels;
  } catch (error) {
    console.error(`Error extracting hotel data from ${pdfPath}:`, error);
    return [];
  }
}

async function extractCircuitData(pdfPath: string): Promise<RawCircuit[]> {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    const circuits: RawCircuit[] = [];

    // Exemple d'extraction pour Kamba Odzala Discovery
    const lines = data.text.split('\n').filter(line => line.trim());
    
    let currentCircuit: Partial<RawCircuit> = {};
    
    for (const line of lines) {
      if (line.includes('Discovery')) {
        if (Object.keys(currentCircuit).length > 0) {
          circuits.push(currentCircuit as RawCircuit);
        }
        currentCircuit = {
          title: line.trim(),
          destinations: [],
          duration: {
            days: 0,
            nights: 0
          },
          price: {
            amount: 0,
            currency: 'EUR'
          }
        };
      } else if (line.includes('jours') || line.includes('nuits')) {
        const daysMatch = line.match(/(\d+)\s*jours/);
        const nightsMatch = line.match(/(\d+)\s*nuits/);
        
        if (daysMatch && nightsMatch) {
          currentCircuit.duration = {
            days: parseInt(daysMatch[1], 10),
            nights: parseInt(nightsMatch[1], 10)
          };
        }
      } else if (line.includes('€') || line.includes('EUR')) {
        const priceMatch = line.match(/(\d+)[\s€]*(EUR)?/);
        if (priceMatch) {
          currentCircuit.price = {
            amount: parseInt(priceMatch[1], 10),
            currency: 'EUR'
          };
        }
      } else if (line.length > 50) {
        currentCircuit.description = line.trim();
      }
    }

    if (Object.keys(currentCircuit).length > 0) {
      circuits.push(currentCircuit as RawCircuit);
    }

    return circuits;
  } catch (error) {
    console.error(`Error extracting circuit data from ${pdfPath}:`, error);
    return [];
  }
}

async function importData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixedtrip');
    console.log('✅ Connected to MongoDB');

    // Nettoyage des collections
    await HotelModel.deleteMany({});
    await CircuitModel.deleteMany({});
    console.log('🧹 Cleaned existing data');

    // Import des hôtels
    const hotelPdfPath = path.join(__dirname, '../CircuitV1/Hilton BZV.pdf');
    const hotels = await extractHotelData(hotelPdfPath);
    
    if (hotels.length > 0) {
      await HotelModel.insertMany(hotels);
      console.log(`✅ Imported ${hotels.length} hotels`);
    }

    // Import des circuits
    const circuitPdfPaths = [
      path.join(__dirname, '../CircuitV1/Kamba Odzala Discovery - 4 Nuits 5 Jours.pdf'),
      path.join(__dirname, '../CircuitV1/Kamba Odzala Discovery - 7 Nuits 8 Jours.pdf')
    ];

    for (const pdfPath of circuitPdfPaths) {
      const circuits = await extractCircuitData(pdfPath);
      if (circuits.length > 0) {
        await CircuitModel.insertMany(circuits);
        console.log(`✅ Imported ${circuits.length} circuits from ${path.basename(pdfPath)}`);
      }
    }

    console.log('✨ Data import completed successfully');
  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Lancement de l'import
importData(); 