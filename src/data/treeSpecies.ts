/**
 * Tree species database — common British, European, and global notable species.
 * Each entry has a common name, scientific (Latin) name, and family.
 * Used for autocomplete in the Add Tree dialog and CSV import enrichment.
 */

export interface TreeSpecies {
  common: string;
  scientific: string;
  family: string;
  /** Optional alternate common names / regional names */
  aliases?: string[];
}

const TREE_SPECIES: TreeSpecies[] = [
  // ── Oaks ──
  { common: "English Oak", scientific: "Quercus robur", family: "Fagaceae", aliases: ["Pedunculate Oak", "Common Oak"] },
  { common: "Sessile Oak", scientific: "Quercus petraea", family: "Fagaceae", aliases: ["Durmast Oak"] },
  { common: "Holm Oak", scientific: "Quercus ilex", family: "Fagaceae", aliases: ["Evergreen Oak"] },
  { common: "Turkey Oak", scientific: "Quercus cerris", family: "Fagaceae" },
  { common: "Red Oak", scientific: "Quercus rubra", family: "Fagaceae", aliases: ["Northern Red Oak"] },
  { common: "Cork Oak", scientific: "Quercus suber", family: "Fagaceae" },
  { common: "White Oak", scientific: "Quercus alba", family: "Fagaceae" },
  { common: "Live Oak", scientific: "Quercus virginiana", family: "Fagaceae" },
  { common: "Kermes Oak", scientific: "Quercus coccifera", family: "Fagaceae" },
  { common: "Downy Oak", scientific: "Quercus pubescens", family: "Fagaceae" },

  // ── Yews ──
  { common: "English Yew", scientific: "Taxus baccata", family: "Taxaceae", aliases: ["Common Yew", "European Yew"] },
  { common: "Pacific Yew", scientific: "Taxus brevifolia", family: "Taxaceae" },
  { common: "Japanese Yew", scientific: "Taxus cuspidata", family: "Taxaceae" },
  { common: "Irish Yew", scientific: "Taxus baccata 'Fastigiata'", family: "Taxaceae" },

  // ── Ash ──
  { common: "Common Ash", scientific: "Fraxinus excelsior", family: "Oleaceae", aliases: ["European Ash"] },
  { common: "Narrow-leaved Ash", scientific: "Fraxinus angustifolia", family: "Oleaceae" },
  { common: "Manna Ash", scientific: "Fraxinus ornus", family: "Oleaceae", aliases: ["Flowering Ash"] },
  { common: "White Ash", scientific: "Fraxinus americana", family: "Oleaceae" },
  { common: "Green Ash", scientific: "Fraxinus pennsylvanica", family: "Oleaceae" },

  // ── Beech ──
  { common: "Common Beech", scientific: "Fagus sylvatica", family: "Fagaceae", aliases: ["European Beech"] },
  { common: "Copper Beech", scientific: "Fagus sylvatica f. purpurea", family: "Fagaceae" },
  { common: "American Beech", scientific: "Fagus grandifolia", family: "Fagaceae" },
  { common: "Oriental Beech", scientific: "Fagus orientalis", family: "Fagaceae" },

  // ── Birch ──
  { common: "Silver Birch", scientific: "Betula pendula", family: "Betulaceae" },
  { common: "Downy Birch", scientific: "Betula pubescens", family: "Betulaceae" },
  { common: "Paper Birch", scientific: "Betula papyrifera", family: "Betulaceae" },
  { common: "Himalayan Birch", scientific: "Betula utilis", family: "Betulaceae" },

  // ── Willow ──
  { common: "White Willow", scientific: "Salix alba", family: "Salicaceae" },
  { common: "Weeping Willow", scientific: "Salix babylonica", family: "Salicaceae" },
  { common: "Crack Willow", scientific: "Salix fragilis", family: "Salicaceae" },
  { common: "Goat Willow", scientific: "Salix caprea", family: "Salicaceae", aliases: ["Pussy Willow"] },
  { common: "Grey Willow", scientific: "Salix cinerea", family: "Salicaceae" },

  // ── Holly ──
  { common: "Common Holly", scientific: "Ilex aquifolium", family: "Aquifoliaceae", aliases: ["English Holly", "European Holly"] },
  { common: "American Holly", scientific: "Ilex opaca", family: "Aquifoliaceae" },

  // ── Hawthorn ──
  { common: "Common Hawthorn", scientific: "Crataegus monogyna", family: "Rosaceae", aliases: ["May", "Quickthorn"] },
  { common: "Midland Hawthorn", scientific: "Crataegus laevigata", family: "Rosaceae" },

  // ── Hazel ──
  { common: "Common Hazel", scientific: "Corylus avellana", family: "Betulaceae" },
  { common: "Turkish Hazel", scientific: "Corylus colurna", family: "Betulaceae" },

  // ── Elm ──
  { common: "English Elm", scientific: "Ulmus minor var. vulgaris", family: "Ulmaceae" },
  { common: "Wych Elm", scientific: "Ulmus glabra", family: "Ulmaceae", aliases: ["Scots Elm"] },
  { common: "Field Elm", scientific: "Ulmus minor", family: "Ulmaceae" },
  { common: "Dutch Elm", scientific: "Ulmus × hollandica", family: "Ulmaceae" },

  // ── Lime / Linden ──
  { common: "Small-leaved Lime", scientific: "Tilia cordata", family: "Malvaceae" },
  { common: "Large-leaved Lime", scientific: "Tilia platyphyllos", family: "Malvaceae" },
  { common: "Common Lime", scientific: "Tilia × europaea", family: "Malvaceae" },
  { common: "American Linden", scientific: "Tilia americana", family: "Malvaceae", aliases: ["Basswood"] },

  // ── Maple / Sycamore ──
  { common: "Sycamore", scientific: "Acer pseudoplatanus", family: "Sapindaceae" },
  { common: "Field Maple", scientific: "Acer campestre", family: "Sapindaceae" },
  { common: "Norway Maple", scientific: "Acer platanoides", family: "Sapindaceae" },
  { common: "Sugar Maple", scientific: "Acer saccharum", family: "Sapindaceae" },
  { common: "Japanese Maple", scientific: "Acer palmatum", family: "Sapindaceae" },
  { common: "Red Maple", scientific: "Acer rubrum", family: "Sapindaceae" },

  // ── Pine ──
  { common: "Scots Pine", scientific: "Pinus sylvestris", family: "Pinaceae" },
  { common: "Maritime Pine", scientific: "Pinus pinaster", family: "Pinaceae" },
  { common: "Stone Pine", scientific: "Pinus pinea", family: "Pinaceae", aliases: ["Umbrella Pine"] },
  { common: "Corsican Pine", scientific: "Pinus nigra subsp. laricio", family: "Pinaceae" },
  { common: "Austrian Pine", scientific: "Pinus nigra", family: "Pinaceae", aliases: ["Black Pine"] },
  { common: "Bristlecone Pine", scientific: "Pinus longaeva", family: "Pinaceae" },
  { common: "Monterey Pine", scientific: "Pinus radiata", family: "Pinaceae" },

  // ── Spruce ──
  { common: "Norway Spruce", scientific: "Picea abies", family: "Pinaceae" },
  { common: "Sitka Spruce", scientific: "Picea sitchensis", family: "Pinaceae" },
  { common: "Blue Spruce", scientific: "Picea pungens", family: "Pinaceae", aliases: ["Colorado Spruce"] },

  // ── Fir ──
  { common: "Silver Fir", scientific: "Abies alba", family: "Pinaceae", aliases: ["European Silver Fir"] },
  { common: "Douglas Fir", scientific: "Pseudotsuga menziesii", family: "Pinaceae" },
  { common: "Grand Fir", scientific: "Abies grandis", family: "Pinaceae" },
  { common: "Noble Fir", scientific: "Abies procera", family: "Pinaceae" },

  // ── Larch ──
  { common: "European Larch", scientific: "Larix decidua", family: "Pinaceae" },
  { common: "Japanese Larch", scientific: "Larix kaempferi", family: "Pinaceae" },
  { common: "Hybrid Larch", scientific: "Larix × marschlinsii", family: "Pinaceae" },

  // ── Cedar ──
  { common: "Cedar of Lebanon", scientific: "Cedrus libani", family: "Pinaceae" },
  { common: "Atlas Cedar", scientific: "Cedrus atlantica", family: "Pinaceae" },
  { common: "Deodar Cedar", scientific: "Cedrus deodara", family: "Pinaceae" },
  { common: "Western Red Cedar", scientific: "Thuja plicata", family: "Cupressaceae" },

  // ── Cherry / Prunus ──
  { common: "Wild Cherry", scientific: "Prunus avium", family: "Rosaceae", aliases: ["Gean", "Sweet Cherry"] },
  { common: "Bird Cherry", scientific: "Prunus padus", family: "Rosaceae" },
  { common: "Cherry Plum", scientific: "Prunus cerasifera", family: "Rosaceae" },
  { common: "Blackthorn", scientific: "Prunus spinosa", family: "Rosaceae", aliases: ["Sloe"] },
  { common: "Japanese Cherry", scientific: "Prunus serrulata", family: "Rosaceae", aliases: ["Sakura"] },

  // ── Apple / Pear ──
  { common: "Crab Apple", scientific: "Malus sylvestris", family: "Rosaceae" },
  { common: "Cultivated Apple", scientific: "Malus domestica", family: "Rosaceae" },
  { common: "Wild Pear", scientific: "Pyrus pyraster", family: "Rosaceae" },

  // ── Rowan / Whitebeam ──
  { common: "Rowan", scientific: "Sorbus aucuparia", family: "Rosaceae", aliases: ["Mountain Ash"] },
  { common: "Whitebeam", scientific: "Sorbus aria", family: "Rosaceae" },
  { common: "Wild Service Tree", scientific: "Sorbus torminalis", family: "Rosaceae" },

  // ── Alder ──
  { common: "Common Alder", scientific: "Alnus glutinosa", family: "Betulaceae" },
  { common: "Grey Alder", scientific: "Alnus incana", family: "Betulaceae" },
  { common: "Italian Alder", scientific: "Alnus cordata", family: "Betulaceae" },

  // ── Chestnut ──
  { common: "Sweet Chestnut", scientific: "Castanea sativa", family: "Fagaceae", aliases: ["Spanish Chestnut"] },
  { common: "Horse Chestnut", scientific: "Aesculus hippocastanum", family: "Sapindaceae", aliases: ["Conker Tree"] },
  { common: "American Chestnut", scientific: "Castanea dentata", family: "Fagaceae" },

  // ── Walnut ──
  { common: "Common Walnut", scientific: "Juglans regia", family: "Juglandaceae", aliases: ["English Walnut"] },
  { common: "Black Walnut", scientific: "Juglans nigra", family: "Juglandaceae" },

  // ── Poplar ──
  { common: "Black Poplar", scientific: "Populus nigra", family: "Salicaceae" },
  { common: "White Poplar", scientific: "Populus alba", family: "Salicaceae" },
  { common: "Lombardy Poplar", scientific: "Populus nigra 'Italica'", family: "Salicaceae" },
  { common: "Aspen", scientific: "Populus tremula", family: "Salicaceae" },

  // ── Hornbeam ──
  { common: "Common Hornbeam", scientific: "Carpinus betulus", family: "Betulaceae" },
  { common: "Hop Hornbeam", scientific: "Ostrya carpinifolia", family: "Betulaceae" },

  // ── Plane ──
  { common: "London Plane", scientific: "Platanus × acerifolia", family: "Platanaceae" },
  { common: "Oriental Plane", scientific: "Platanus orientalis", family: "Platanaceae" },
  { common: "American Sycamore", scientific: "Platanus occidentalis", family: "Platanaceae" },

  // ── Others – British & European ──
  { common: "Strawberry Tree", scientific: "Arbutus unedo", family: "Ericaceae" },
  { common: "Box", scientific: "Buxus sempervirens", family: "Buxaceae" },
  { common: "Bay Laurel", scientific: "Laurus nobilis", family: "Lauraceae", aliases: ["Sweet Bay"] },
  { common: "Elder", scientific: "Sambucus nigra", family: "Adoxaceae" },
  { common: "Spindle", scientific: "Euonymus europaeus", family: "Celastraceae" },
  { common: "Dogwood", scientific: "Cornus sanguinea", family: "Cornaceae" },
  { common: "Buckthorn", scientific: "Rhamnus cathartica", family: "Rhamnaceae" },
  { common: "Alder Buckthorn", scientific: "Frangula alnus", family: "Rhamnaceae" },
  { common: "Privet", scientific: "Ligustrum vulgare", family: "Oleaceae", aliases: ["Wild Privet"] },
  { common: "Juniper", scientific: "Juniperus communis", family: "Cupressaceae" },
  { common: "Ivy", scientific: "Hedera helix", family: "Araliaceae" },
  { common: "Medlar", scientific: "Mespilus germanica", family: "Rosaceae" },
  { common: "Mulberry", scientific: "Morus nigra", family: "Moraceae", aliases: ["Black Mulberry"] },
  { common: "Fig", scientific: "Ficus carica", family: "Moraceae", aliases: ["Common Fig"] },
  { common: "Guelder Rose", scientific: "Viburnum opulus", family: "Adoxaceae" },
  { common: "Wayfaring Tree", scientific: "Viburnum lantana", family: "Adoxaceae" },

  // ── Cypress ──
  { common: "Lawson Cypress", scientific: "Chamaecyparis lawsoniana", family: "Cupressaceae" },
  { common: "Leyland Cypress", scientific: "× Cuprocyparis leylandii", family: "Cupressaceae" },
  { common: "Italian Cypress", scientific: "Cupressus sempervirens", family: "Cupressaceae", aliases: ["Mediterranean Cypress"] },
  { common: "Monterey Cypress", scientific: "Cupressus macrocarpa", family: "Cupressaceae" },

  // ── Redwoods & Giant trees ──
  { common: "Coast Redwood", scientific: "Sequoia sempervirens", family: "Cupressaceae" },
  { common: "Giant Sequoia", scientific: "Sequoiadendron giganteum", family: "Cupressaceae", aliases: ["Wellingtonia", "Sierra Redwood"] },
  { common: "Dawn Redwood", scientific: "Metasequoia glyptostroboides", family: "Cupressaceae" },

  // ── Notable global species ──
  { common: "Baobab", scientific: "Adansonia digitata", family: "Malvaceae", aliases: ["African Baobab"] },
  { common: "Olive", scientific: "Olea europaea", family: "Oleaceae" },
  { common: "Monkey Puzzle", scientific: "Araucaria araucana", family: "Araucariaceae", aliases: ["Chile Pine"] },
  { common: "Ginkgo", scientific: "Ginkgo biloba", family: "Ginkgoaceae", aliases: ["Maidenhair Tree"] },
  { common: "Tulip Tree", scientific: "Liriodendron tulipifera", family: "Magnoliaceae" },
  { common: "Magnolia", scientific: "Magnolia grandiflora", family: "Magnoliaceae", aliases: ["Southern Magnolia"] },
  { common: "Kauri", scientific: "Agathis australis", family: "Araucariaceae" },
  { common: "Totara", scientific: "Podocarpus totara", family: "Podocarpaceae" },
  { common: "Pohutukawa", scientific: "Metrosideros excelsa", family: "Myrtaceae", aliases: ["New Zealand Christmas Tree"] },
  { common: "Rimu", scientific: "Dacrydium cupressinum", family: "Podocarpaceae", aliases: ["Red Pine"] },
  { common: "Matai", scientific: "Prumnopitys taxifolia", family: "Podocarpaceae", aliases: ["Black Pine"] },
  { common: "Kahikatea", scientific: "Dacrycarpus dacrydioides", family: "Podocarpaceae", aliases: ["White Pine"] },
  { common: "Silver Beech", scientific: "Lophozonia menziesii", family: "Nothofagaceae", aliases: ["Tawhai"] },
  { common: "Mountain Beech", scientific: "Fuscospora cliffortioides", family: "Nothofagaceae" },
  { common: "Northern Rata", scientific: "Metrosideros robusta", family: "Myrtaceae" },
  { common: "Southern Rata", scientific: "Metrosideros umbellata", family: "Myrtaceae" },
  { common: "Eucalyptus", scientific: "Eucalyptus globulus", family: "Myrtaceae", aliases: ["Blue Gum"] },
  { common: "Banyan", scientific: "Ficus benghalensis", family: "Moraceae" },
  { common: "Bodhi Tree", scientific: "Ficus religiosa", family: "Moraceae", aliases: ["Sacred Fig", "Peepal"] },
  { common: "Neem", scientific: "Azadirachta indica", family: "Meliaceae" },
  { common: "Teak", scientific: "Tectona grandis", family: "Lamiaceae" },
  { common: "Camphor Tree", scientific: "Cinnamomum camphora", family: "Lauraceae" },
  { common: "Dragon Tree", scientific: "Dracaena draco", family: "Asparagaceae" },
  { common: "Cypress Oak", scientific: "Quercus robur f. fastigiata", family: "Fagaceae" },
  { common: "Bald Cypress", scientific: "Taxodium distichum", family: "Cupressaceae", aliases: ["Swamp Cypress"] },
  { common: "Jacaranda", scientific: "Jacaranda mimosifolia", family: "Bignoniaceae" },
  { common: "Flame Tree", scientific: "Delonix regia", family: "Fabaceae", aliases: ["Royal Poinciana"] },
  { common: "Kapok", scientific: "Ceiba pentandra", family: "Malvaceae", aliases: ["Ceiba"] },
  { common: "Moringa", scientific: "Moringa oleifera", family: "Moringaceae", aliases: ["Drumstick Tree"] },
  { common: "Argan", scientific: "Argania spinosa", family: "Sapotaceae" },
  { common: "Frankincense", scientific: "Boswellia sacra", family: "Burseraceae" },
  { common: "Myrrh", scientific: "Commiphora myrrha", family: "Burseraceae" },

  // ── Japanese species ──
  { common: "Japanese Cedar", scientific: "Cryptomeria japonica", family: "Cupressaceae", aliases: ["Sugi"] },
  { common: "Hinoki Cypress", scientific: "Chamaecyparis obtusa", family: "Cupressaceae" },
  { common: "Japanese Beech", scientific: "Fagus crenata", family: "Fagaceae" },
  { common: "Japanese Zelkova", scientific: "Zelkova serrata", family: "Ulmaceae" },
  { common: "Japanese Black Pine", scientific: "Pinus thunbergii", family: "Pinaceae" },
  { common: "Japanese Red Pine", scientific: "Pinus densiflora", family: "Pinaceae" },

  // ── Russian / Siberian species ──
  { common: "Siberian Larch", scientific: "Larix sibirica", family: "Pinaceae" },
  { common: "Dahurian Larch", scientific: "Larix gmelinii", family: "Pinaceae" },
  { common: "Siberian Pine", scientific: "Pinus sibirica", family: "Pinaceae", aliases: ["Siberian Cedar Pine"] },
  { common: "Siberian Fir", scientific: "Abies sibirica", family: "Pinaceae" },
  { common: "Erman Birch", scientific: "Betula ermanii", family: "Betulaceae", aliases: ["Stone Birch"] },
  { common: "Yezo Spruce", scientific: "Picea jezoensis", family: "Pinaceae" },
  { common: "Korean Pine", scientific: "Pinus koraiensis", family: "Pinaceae" },
  { common: "Manchurian Elm", scientific: "Ulmus laciniata", family: "Ulmaceae" },
  { common: "Manchurian Ash", scientific: "Fraxinus mandshurica", family: "Oleaceae" },
  { common: "Greek Juniper", scientific: "Juniperus excelsa", family: "Cupressaceae" },
  { common: "Colchic Boxwood", scientific: "Buxus colchica", family: "Buxaceae" },

  // ── Colombian / Tropical species ──
  { common: "Wax Palm", scientific: "Ceroxylon quindiuense", family: "Arecaceae", aliases: ["Quindío Wax Palm"] },
  { common: "Rain Tree", scientific: "Samanea saman", family: "Fabaceae", aliases: ["Samán"] },
  { common: "Trumpet Tree", scientific: "Cecropia peltata", family: "Urticaceae", aliases: ["Yarumo"] },
  { common: "Colombian Oak", scientific: "Quercus humboldtii", family: "Fagaceae", aliases: ["Andean Oak"] },
  { common: "Spanish Cedar", scientific: "Cedrela odorata", family: "Meliaceae" },
  { common: "Mahogany", scientific: "Swietenia macrophylla", family: "Meliaceae", aliases: ["Big-leaf Mahogany"] },
  { common: "Rubber Tree", scientific: "Hevea brasiliensis", family: "Euphorbiaceae" },
  { common: "Moriche Palm", scientific: "Mauritia flexuosa", family: "Arecaceae" },
  { common: "Pink Trumpet Tree", scientific: "Tabebuia rosea", family: "Bignoniaceae" },
  { common: "Yellow Trumpet Tree", scientific: "Handroanthus chrysanthus", family: "Bignoniaceae", aliases: ["Guayacán Amarillo"] },
  { common: "Caracolí", scientific: "Anacardium excelsum", family: "Anacardiaceae" },
  { common: "Ice Cream Bean", scientific: "Inga edulis", family: "Fabaceae", aliases: ["Guamo"] },
  { common: "Salmwood", scientific: "Cordia alliodora", family: "Boraginaceae", aliases: ["Nogal Cafetero"] },
  { common: "Paper Bark Tree", scientific: "Polylepis quadrijuga", family: "Rosaceae", aliases: ["Polylepis"] },

  // ── Zimbabwe / African species ──
  { common: "Sycamore Fig", scientific: "Ficus sycomorus", family: "Moraceae" },
  { common: "Wild Fig", scientific: "Ficus natalensis", family: "Moraceae", aliases: ["Natal Fig", "Arterial Fig"] },
  { common: "Fever Tree", scientific: "Acacia xanthophloea", family: "Fabaceae" },
  { common: "Mopane", scientific: "Colophospermum mopane", family: "Fabaceae" },
  { common: "Msasa", scientific: "Brachystegia spiciformis", family: "Fabaceae" },
  { common: "Yellowwood", scientific: "Podocarpus latifolius", family: "Podocarpaceae" },
  { common: "Forest Newtonia", scientific: "Newtonia buchananii", family: "Fabaceae" },
  { common: "Red Mangrove", scientific: "Rhizophora mangle", family: "Rhizophoraceae" },

  // ── Chinese species ──
  { common: "Chinese Juniper", scientific: "Juniperus chinensis", family: "Cupressaceae" },
  { common: "Tibetan Juniper", scientific: "Juniperus tibetica", family: "Cupressaceae" },
  { common: "Chinese Arborvitae", scientific: "Platycladus orientalis", family: "Cupressaceae" },
  { common: "Huangshan Pine", scientific: "Pinus hwangshanensis", family: "Pinaceae" },
  { common: "Chinese Fir", scientific: "Cunninghamia lanceolata", family: "Cupressaceae" },
  { common: "Qinghai Spruce", scientific: "Picea crassifolia", family: "Pinaceae" },
  { common: "Yunnan Cypress", scientific: "Cupressus duclouxiana", family: "Cupressaceae" },
  { common: "Chinese Locust", scientific: "Sophora japonica", family: "Fabaceae", aliases: ["Japanese Pagoda Tree"] },
  { common: "Chinese Elm", scientific: "Ulmus pumila", family: "Ulmaceae", aliases: ["Siberian Elm"] },
  { common: "Masson Pine", scientific: "Pinus massoniana", family: "Pinaceae" },
  { common: "Chinese Tallow", scientific: "Triadica sebifera", family: "Euphorbiaceae" },
];

export default TREE_SPECIES;

/**
 * Map of common species names (lowercase) → botanical family.
 */
const familyMap = new Map<string, string>();
for (const sp of TREE_SPECIES) {
  familyMap.set(sp.common.toLowerCase(), sp.family);
  sp.aliases?.forEach(a => familyMap.set(a.toLowerCase(), sp.family));
}

export function getFamilyForSpecies(speciesName: string): string | undefined {
  return familyMap.get(speciesName.toLowerCase());
}

/** Get all unique families from the database, sorted alphabetically. */
export function getAllFamilies(): string[] {
  const families = new Set<string>();
  for (const sp of TREE_SPECIES) families.add(sp.family);
  return Array.from(families).sort();
}

/**
 * Try to match a species string to a known entry.
 * Returns the best match or undefined.
 */
export function matchSpecies(input: string): TreeSpecies | undefined {
  if (!input) return undefined;
  const q = input.toLowerCase().trim();

  // Exact match on common name or alias
  for (const sp of TREE_SPECIES) {
    if (sp.common.toLowerCase() === q) return sp;
    if (sp.aliases?.some(a => a.toLowerCase() === q)) return sp;
  }
  // Exact match on scientific name
  for (const sp of TREE_SPECIES) {
    if (sp.scientific.toLowerCase() === q) return sp;
  }
  // Partial: input is a substring of common name or vice versa
  for (const sp of TREE_SPECIES) {
    const c = sp.common.toLowerCase();
    if (c.includes(q) || q.includes(c)) return sp;
  }
  return undefined;
}

/**
 * Enrich a species string: returns { species, lineage } where lineage
 * is the scientific name if a match is found.
 */
export function enrichSpecies(input: string): { species: string; lineage?: string; family?: string } {
  const match = matchSpecies(input);
  if (match) {
    return {
      species: match.common,
      lineage: match.scientific,
      family: match.family,
    };
  }
  return { species: input };
}

/**
 * Search species by common name, scientific name, or aliases.
 * Returns matches sorted by relevance (starts-with first, then includes).
 */
export function searchSpecies(query: string, limit = 12): TreeSpecies[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();

  const scored: { species: TreeSpecies; score: number }[] = [];

  for (const sp of TREE_SPECIES) {
    const common = sp.common.toLowerCase();
    const sci = sp.scientific.toLowerCase();
    const allNames = [common, sci, ...(sp.aliases?.map(a => a.toLowerCase()) || [])];

    let bestScore = 0;
    for (const name of allNames) {
      if (name === q) { bestScore = 100; break; }
      if (name.startsWith(q)) { bestScore = Math.max(bestScore, 80); }
      else if (name.includes(q)) { bestScore = Math.max(bestScore, 60); }
      const words = name.split(/\s+/);
      for (const w of words) {
        if (w.startsWith(q)) { bestScore = Math.max(bestScore, 70); }
      }
    }

    if (bestScore > 0) {
      scored.push({ species: sp, score: bestScore });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.species);
}
