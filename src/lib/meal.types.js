/**
 * @typedef MealSearchResultItem
 * @property {string} id ID uppskriftar.
 * @property {string} title Nafn uppskriftar.
 * @property {string} thumbnailUrl Slóð á thumbnail mynd.
 */

/**
 * @typedef Ingredient
 * @property {string} ingredient Nafn hráefnis.
 * @property {string} measure Magn, getur verið tómur strengur.
 */

/**
 * @typedef Meal
 * @property {string} title Nafn uppskriftar.
 * @property {string} instructions Leiðbeiningar.
 * @property {string} imageUrl Slóð á mynd.
 * @property {Ingredient[]} ingredients Hráefni.
 */

// Verður að vera amk eitt export
export default {};
