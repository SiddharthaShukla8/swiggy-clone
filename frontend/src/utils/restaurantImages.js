/**
 * ============================================================
 * PERMANENT LOCAL IMAGE RESOLVER
 * ============================================================
 * All images are bundled locally — zero external dependencies.
 * No Unsplash, no CDN, no broken images ever.
 *
 * Strategy:
 *  1. Map cuisine keywords → relevant local images
 *  2. Use hash(restaurant._id) to pick deterministically
 *     within a cuisine bucket — same restaurant = same image,
 *     different restaurants = different images.
 *  3. No fallback ever touches an external URL.
 * ============================================================
 */

// ─── Static local imports ────────────────────────────────────
import biryaniImg       from "../assets/images/biryani.png";
import burgerImg        from "../assets/images/burger.png";
import chineseImg       from "../assets/images/chinese.png";
import dairyImg         from "../assets/images/dairy.png";
import dessertsImg      from "../assets/images/desserts.png";
import dineoutFineDine  from "../assets/images/dineout_fine_dine.png";
import dineoutPub       from "../assets/images/dineout_pub.png";
import foodHeroImg      from "../assets/images/food_hero.png";
import fruitsImg        from "../assets/images/fruits.png";
import masalasImg       from "../assets/images/masalas.png";
import northIndianImg   from "../assets/images/north_indian.png";
import pizzaImg         from "../assets/images/pizza.png";
import restaurantFallback from "../assets/images/restaurant_fallback.png";
import rollsImg         from "../assets/images/rolls.png";
import southIndianImg   from "../assets/images/south_indian.png";
import staplesImg       from "../assets/images/staples.png";
import vegetablesImg    from "../assets/images/vegetables.png";

// ─── Cuisine → image pool mapping ─────────────────────────────
// Each pool entry is an array of 2-4 LOCAL images.
// The hash function picks one deterministically per restaurant.
const CUISINE_MAP = {
    biryani:        [biryaniImg, foodHeroImg, northIndianImg],
    hyderabadi:     [biryaniImg, northIndianImg],
    mughlai:        [biryaniImg, northIndianImg, masalasImg],
    "north indian": [northIndianImg, biryaniImg, masalasImg],
    punjabi:        [northIndianImg, masalasImg, biryaniImg],
    rajasthani:     [northIndianImg, staplesImg],
    "south indian": [southIndianImg, vegetablesImg, foodHeroImg],
    kerala:         [southIndianImg, vegetablesImg],
    chettinad:      [southIndianImg, masalasImg],
    pizza:          [pizzaImg, dineoutFineDine, foodHeroImg],
    italian:        [pizzaImg, dineoutFineDine, dineoutPub],
    pasta:          [pizzaImg, dineoutFineDine],
    burger:         [burgerImg, foodHeroImg, rollsImg],
    "american":     [burgerImg, rollsImg, foodHeroImg],
    "fast food":    [burgerImg, rollsImg, foodHeroImg],
    wraps:          [rollsImg, burgerImg],
    rolls:          [rollsImg, burgerImg, foodHeroImg],
    chinese:        [chineseImg, foodHeroImg, masalasImg],
    asian:          [chineseImg, southIndianImg],
    "thai":         [chineseImg, vegetablesImg],
    japanese:       [chineseImg, dineoutFineDine],
    sushi:          [chineseImg, dineoutFineDine],
    ramen:          [chineseImg, foodHeroImg],
    desserts:       [dessertsImg, fruitsImg, dairyImg],
    bakery:         [dessertsImg, dairyImg],
    "ice cream":    [dessertsImg, fruitsImg],
    sweets:         [dessertsImg, dairyImg],
    cafe:           [dineoutPub, dineoutFineDine, dessertsImg],
    coffee:         [dineoutPub, dessertsImg],
    continental:    [dineoutFineDine, dineoutPub, pizzaImg],
    "fine dining":  [dineoutFineDine, dineoutPub],
    pub:            [dineoutPub, dineoutFineDine],
    bar:            [dineoutPub, dineoutFineDine],
    kebabs:         [northIndianImg, masalasImg, biryaniImg],
    grills:         [northIndianImg, burgerImg],
    seafood:        [southIndianImg, vegetablesImg, masalasImg],
    fish:           [southIndianImg, masalasImg],
    "healthy":      [vegetablesImg, fruitsImg, southIndianImg],
    salads:         [vegetablesImg, fruitsImg],
    vegan:          [vegetablesImg, fruitsImg, southIndianImg],
    vegetarian:     [vegetablesImg, northIndianImg, southIndianImg],
    grocery:        [vegetablesImg, fruitsImg, staplesImg, dairyImg],
    instamart:      [vegetablesImg, fruitsImg, staplesImg],
};

// Complete fallback pool — every local image we have for variety
const DEFAULT_POOL = [
    foodHeroImg,
    northIndianImg,
    southIndianImg,
    biryaniImg,
    burgerImg,
    pizzaImg,
    chineseImg,
    rollsImg,
    dessertsImg,
    dineoutFineDine,
    dineoutPub,
    restaurantFallback,
    masalasImg,
    vegetablesImg,
    fruitsImg,
    staplesImg,
    dairyImg,
];

// ─── Deterministic hash ────────────────────────────────────────
// Given the same string, always returns the same non-negative integer.
const hashString = (str = "") => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Returns a stable, cuisine-appropriate local image for a restaurant.
 *
 * @param {object} restaurant - Mongoose restaurant document or plain object
 * @returns {string} - Vite-bundled image URL (never an external URL)
 */
export const getRestaurantImage = (restaurant) => {
    if (!restaurant) return DEFAULT_POOL[0];

    // If restaurant has its own Cloudinary/S3 image, always prefer it
    if (
        restaurant.image &&
        typeof restaurant.image === "string" &&
        restaurant.image.length > 10 &&
        !restaurant.image.includes("placeholder") &&
        !restaurant.image.includes("unsplash")
    ) {
        return restaurant.image;
    }

    const id = String(restaurant._id || restaurant.name || "");
    const cuisines = (restaurant.cuisines || []).map((c) =>
        String(c).toLowerCase().trim()
    );

    // Try to match each cuisine keyword against our map
    for (const cuisine of cuisines) {
        for (const [key, pool] of Object.entries(CUISINE_MAP)) {
            if (cuisine.includes(key) || key.includes(cuisine)) {
                return pool[hashString(id) % pool.length];
            }
        }
    }

    // Default pool — deterministic so same restaurant always gets same image
    return DEFAULT_POOL[hashString(id) % DEFAULT_POOL.length];
};

/**
 * Returns a stable, name-appropriate local image for a food item.
 *
 * @param {object} item - Mongoose FoodItem document or plain object
 * @returns {string} - Vite-bundled image URL (never an external URL)
 */
export const getFoodItemImage = (item) => {
    if (!item) return foodHeroImg;

    // Prefer uploaded image (Cloudinary/S3), skip bad URLs
    if (
        item.image &&
        typeof item.image === "string" &&
        item.image.length > 10 &&
        !item.image.includes("placeholder") &&
        !item.image.includes("unsplash")
    ) {
        return item.image;
    }

    const name = String(item.name || "").toLowerCase();
    const id = String(item._id || item.name || "");

    for (const [key, pool] of Object.entries(CUISINE_MAP)) {
        if (name.includes(key)) {
            return pool[hashString(id) % pool.length];
        }
    }

    return DEFAULT_POOL[hashString(id) % DEFAULT_POOL.length];
};

/**
 * Returns a local image for a cuisine category tile (landing page, search).
 * Guaranteed to return a locally bundled image.
 *
 * @param {string} cuisineName
 * @returns {string}
 */
export const getCategoryImage = (cuisineName = "") => {
    const lower = cuisineName.toLowerCase().trim();
    for (const [key, pool] of Object.entries(CUISINE_MAP)) {
        if (lower.includes(key) || key.includes(lower)) {
            return pool[0]; // Always first in pool for category tiles
        }
    }
    return DEFAULT_POOL[hashString(cuisineName) % DEFAULT_POOL.length];
};
