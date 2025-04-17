const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function processImages() {
    try {
        // Créer les dossiers de destination s'ils n'existent pas
        await fs.mkdir(path.join(__dirname, '../public/assets/images/hotels'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../public/assets/images/circuits'), { recursive: true });

        // Traiter les images des hôtels
        const hotelImages = await fs.readdir(path.join(__dirname, '../CircuitV1'));
        for (const file of hotelImages) {
            if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
                if (file.toLowerCase().includes('hilton')) {
                    console.log('Processing hotel image:', file);
                    // Redimensionner et optimiser l'image
                    await sharp(path.join(__dirname, '../CircuitV1', file))
                        .resize(800, 600, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: 80 })
                        .toFile(path.join(__dirname, '../public/assets/images/hotels/hilton_bzv.jpg'));

                    // Créer une version thumbnail
                    await sharp(path.join(__dirname, '../CircuitV1', file))
                        .resize(400, 300, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: 70 })
                        .toFile(path.join(__dirname, '../public/assets/images/hotels/hilton_bzv_thumb.jpg'));
                }
            }
        }

        // Traiter les images des circuits
        const circuitFiles = await fs.readdir(path.join(__dirname, '../CircuitV1'));
        for (const file of circuitFiles) {
            if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
                if (file.toLowerCase().includes('kamba') || file.toLowerCase().includes('odzala')) {
                    console.log('Processing circuit image:', file);
                    // Redimensionner et optimiser l'image
                    await sharp(path.join(__dirname, '../CircuitV1', file))
                        .resize(800, 600, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: 80 })
                        .toFile(path.join(__dirname, '../public/assets/images/circuits/kamba_odzala.jpg'));

                    // Créer une version thumbnail
                    await sharp(path.join(__dirname, '../CircuitV1', file))
                        .resize(400, 300, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: 70 })
                        .toFile(path.join(__dirname, '../public/assets/images/circuits/kamba_odzala_thumb.jpg'));
                }
            }
        }

        console.log('✅ Images traitées avec succès');
    } catch (error) {
        console.error('❌ Erreur lors du traitement des images:', error);
    }
}

processImages(); 