
import { QUOTES_DATA } from "../data/quotes";

// --- EXTERNAL PUBLIC APIS SERVICE ---

// 1. MOTIVATION QUOTES (Local Indonesian Database for Stability & Language)
export const getDailyQuote = async () => {
  return new Promise<{text: string, author: string} | null>((resolve) => {
      const random = QUOTES_DATA[Math.floor(Math.random() * QUOTES_DATA.length)];
      resolve(random);
  });
};

// 2. OPEN FOOD FACTS
export const searchFoodProduct = async (query: string) => {
  try {
    const url = `https://id.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.products && Array.isArray(data.products)) {
      return data.products.map(transformProductData);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const getProductByBarcode = async (barcode: string) => {
    try {
        const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
        const res = await fetch(url);
        if(!res.ok) return null;
        const data = await res.json();
        if(data.status === 1 && data.product) {
            return transformProductData(data.product);
        }
        return null;
    } catch (e) {
        return null;
    }
};

const transformProductData = (p: any) => ({
    id: p._id || String(Math.random()),
    name: p.product_name || p.product_name_id || "Tanpa Nama",
    brand: p.brands || "Unknown Brand",
    image: p.image_front_small_url || p.image_front_url || p.image_url,
    nutriscore: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : '?',
    calories: p.nutriments?.['energy-kcal_100g'] || 0,
    sugar: p.nutriments?.sugars_100g || 0,
    protein: p.nutriments?.proteins_100g || 0
});

// 3. NOMINATIM OPENSTREETMAP (Nearby Facilities)
export const findNearbyFacilities = async (lat: number, lon: number, type: 'hospital' | 'pharmacy') => {
  try {
    const delta = 0.05; 
    const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
    const query = type === 'hospital' ? 'hospital' : 'pharmacy';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=15&viewbox=${viewbox}&bounded=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        address: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type
    }));
  } catch (e) {
    return [];
  }
};

// NEW: Improved Manual Search (Smart Logic)
export const searchFacilitiesManual = async (queryText: string, type: 'hospital' | 'pharmacy') => {
    try {
      const lowerQ = queryText.toLowerCase();
      // Keywords that indicate the user is searching for a specific place name
      const specificKeywords = ['rs', 'sakit', 'hospital', 'klinik', 'apotek', 'farma', 'pharmacy', 'medika', 'puskesmas', 'bidan', 'dokter'];
      
      const isSpecificSearch = specificKeywords.some(k => lowerQ.includes(k));
      
      let finalQuery = queryText;

      if (!isSpecificSearch) {
          // If query looks like just a city/area name (e.g. "Bandung"), append the facility type
          const prefix = type === 'hospital' ? 'Rumah Sakit' : 'Apotek';
          finalQuery = `${prefix} di ${queryText}`;
      }

      // addressdetails=1 gives us clean address components
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&limit=15&addressdetails=1`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      
      return data.map((item: any) => ({
          id: item.place_id,
          name: item.display_name.split(',')[0], // Usually the place name
          address: item.display_name, // Full address
          lat: item.lat,
          lon: item.lon,
          type: type 
      }));
    } catch (e) {
      console.error("Manual search error", e);
      return [];
    }
};

// 4. OPENFDA (Drug Search)
export const searchDrugOpenFDA = async (query: string) => {
  try {
    const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9 ]/g, ""); 
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${sanitizedQuery}"*+OR+openfda.generic_name:"${sanitizedQuery}"*&limit=10`;
    
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    
    if (data.results && Array.isArray(data.results)) {
        return data.results.map((item: any) => ({
            id: item.id || String(Math.random()),
            brand_name: item.openfda?.brand_name ? item.openfda.brand_name[0] : (item.openfda?.generic_name ? item.openfda.generic_name[0] : "Obat Tanpa Merk"),
            generic_name: item.openfda?.generic_name ? item.openfda.generic_name[0] : "",
            manufacturer: item.openfda?.manufacturer_name ? item.openfda.manufacturer_name[0] : "",
            route: item.openfda?.route ? item.openfda.route[0] : ""
        }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

// 5. WIKIPEDIA API
export const searchWikipedia = async (query: string) => {
    try {
        const url = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.query && data.query.search) {
            return data.query.search.map((item: any) => ({
                id: item.pageid,
                title: item.title,
                snippet: item.snippet.replace(/<[^>]*>/g, '') 
            }));
        }
        return [];
    } catch (e) {
        console.error("Wiki search error", e);
        return [];
    }
};

export const getWikipediaDetail = async (pageId: number) => {
    try {
        const url = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.query && data.query.pages && data.query.pages[pageId]) {
            return data.query.pages[pageId].extract;
        }
        return null;
    } catch (e) {
        return null;
    }
};
