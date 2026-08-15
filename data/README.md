# 🌱 Plant Database for Smart Garden

This directory contains the complete plant database for the MyZubster smart garden system.

## 📁 Files

- **`plants.json`** — JSON format for API import
- **`plants.csv`** — CSV format for spreadsheet compatibility
- **`plants.js`** — JavaScript module for direct use in Node.js
- **`README.md`** — This documentation

## 📊 Plant Parameters

| Parameter | Description | Unit | Range/Type |
|-----------|-------------|------|------------|
| `scientificName` | Scientific name of the plant | - | String |
| `commonName` | Common name in English | - | String |
| `family` | Plant family (botanical classification) | - | String |
| `type` | Plant type category | - | `fruit`, `leafy`, `root`, `herb`, `legume`, `berry`, `grain`, `vegetable` |
| `idealPhMin` | Minimum ideal pH | pH | 4.5 - 8.0 |
| `idealPhMax` | Maximum ideal pH | pH | 4.5 - 8.0 |
| `idealEcMin` | Minimum ideal electrical conductivity | µS/cm | 1.0 - 3.5 |
| `idealEcMax` | Maximum ideal electrical conductivity | µS/cm | 1.0 - 3.5 |
| `temperatureMin` | Minimum ideal temperature | °C | 5 - 25 |
| `temperatureMax` | Maximum ideal temperature | °C | 20 - 35 |
| `humidityIdeal` | Ideal humidity level | % | 40 - 85 |
| `growthCycleDays` | Growth cycle duration (harvest) | days | 20 - 150 |
| `waterNeeds` | Water requirement level | - | `low`, `medium`, `high` |
| `sunlight` | Sunlight requirement | - | `full`, `partial`, `shade` |
| `sources` | Scientific references | - | Array of strings |

## 🌿 Plant List (33 species)

### 🍅 Fruiting Vegetables (6)
- Tomato, Bell Pepper, Cucumber, Zucchini, Eggplant, Corn

### 🌿 Leafy Greens (6)
- Lettuce, Spinach, Kale, Swiss Chard, Cabbage, Chicory

### 🥕 Root Vegetables (6)
- Carrot, Potato, Radish, Beetroot, Onion, Garlic

### 🌿 Herbs (7)
- Basil, Parsley, Mint, Rosemary, Thyme, Oregano, Cilantro

### 🌱 Legumes (2)
- Green Bean, Pea

### 🍓 Berries (2)
- Strawberry, Blueberry

### 🌾 Grains (2)
- Corn, Sunflower

### 🥬 Other Vegetables (4)
- Asparagus, Rhubarb, Artichoke, Chicory

## 📚 Sources

The data is compiled from the following scientific sources:

- **FAO** — Food and Agriculture Organization of the United Nations
- **USDA** — United States Department of Agriculture Plant Database
- **RHS** — Royal Horticultural Society
- **Peer-reviewed agricultural journals**
- **Academic research papers**

## 💻 Usage Examples

### JavaScript (Node.js)

```javascript
const PlantDB = require('./plants.js');

// Get all plants
const allPlants = PlantDB.getAll();
console.log(`Total plants: ${allPlants.length}`);

// Find by scientific name
const tomato = PlantDB.findByScientificName('Solanum lycopersicum');
console.log(`Tomato pH: ${tomato.idealPhMin} - ${tomato.idealPhMax}`);

// Find by type
const herbs = PlantDB.findByType('herb');
console.log(`Herbs: ${herbs.map(p => p.commonName).join(', ')}`);

// Get recommendations based on conditions
const recommendations = PlantDB.getRecommendations({
  ph: 6.5,
  ec: 2.0,
  temperature: 22,
  humidity: 65
});
console.log('Recommended plants:', recommendations.map(p => p.commonName));JSON Import
javascript

const plants = require('./plants.json');
const tomato = plants.plants.find(p => p.scientificName === 'Solanum lycopersicum');
console.log(tomato.commonName); // "Tomato"

CSV Import (Python)
python

import pandas as pd
plants_df = pd.read_csv('plants.csv')
tomato = plants_df[plants_df['scientificName'] == 'Solanum lycopersicum']
print(tomato['commonName'].values[0])  # "Tomato"

API Integration
bash

# Import via API (example)
curl -X POST http://localhost:3009/api/plants/import \
  -H "Content-Type: application/json" \
  -d @data/plants.json

🔧 Validation

To validate the database structure:
bash

# Check JSON syntax
node -e "require('./plants.json')"

# Run validation script
npm run validate-plants

🤝 Contributing

To add a new plant, please:

    Fork the repository

    Add the plant entry to plants.json and plants.csv

    Provide scientific sources for all parameters

    Test the entry with the validation script

    Submit a Pull Request

Entry Template
json

{
  "scientificName": "Scientificus nameus",
  "commonName": "Common Name",
  "family": "Family Name",
  "type": "fruit|leafy|root|herb|legume|berry|grain|vegetable",
  "idealPhMin": 6.0,
  "idealPhMax": 7.0,
  "idealEcMin": 2.0,
  "idealEcMax": 3.0,
  "temperatureMin": 18,
  "temperatureMax": 28,
  "humidityIdeal": 65,
  "growthCycleDays": 70,
  "waterNeeds": "medium|high|low",
  "sunlight": "full|partial|shade",
  "sources": ["Source 1", "Source 2"]
}

📄 License

This database is licensed under the MIT License.

🌱 Built with ❤️ for the MyZubster Smart Garden System
