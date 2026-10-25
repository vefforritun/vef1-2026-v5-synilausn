import { sleep, error } from './helpers.js';

/** Hámarksfjöldi hráefna í svari frá API. */
const MAX_INGREDIENTS = 20;

/**
 * Athugar hvort gildi sé hlutur.
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

export class MealApi {
  /**
   * @param {string} baseUrl API base url.
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * @param {string} basePath API path.
   * @param {Record<string, string>} params Query parameters.
   * @returns {string} Full URL with query parameters.
   */
  buildUrl(basePath, params = {}) {
    const url = new URL(basePath, this.baseUrl);

    // Fyrir hvert stak í hlut, bæta við querystring
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  /**
   * Færir leitarniðurstöður á staðlað form eða skilar null ef gekk ekki
   * @param {unknown} json
   * @returns {import('./meal.types').MealSearchResultItem[] | null}
   */
  mapSearchResults(json) {
    if (!isRecord(json)) {
      console.error('invalid search results format');
      return null;
    }

    // API skilar `{ meals: null }` ef ekkert fannst.
    if (json.meals === null) {
      return [];
    }

    if (!Array.isArray(json.meals)) {
      console.error('invalid search results format');
      return null;
    }

    const results = [];
    for (const item of json.meals) {
      const result = this.mapSearchResultItem(item);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Færir staka uppskrift á staðlað form eða skilar null ef gekk ekki
   * @param {unknown} item
   * @returns {import('./meal.types').MealSearchResultItem | null}
   */
  mapSearchResultItem(item) {
    if (
      !isRecord(item) ||
      typeof item.idMeal !== 'string' ||
      typeof item.strMeal !== 'string' ||
      typeof item.strMealThumb !== 'string'
    ) {
      console.warn('invalid search result item format', item);
      return null;
    }

    return {
      id: item.idMeal,
      title: item.strMeal,
      thumbnailUrl: `${item.strMealThumb}/small`,
    };
  }

  /**
   * Færir innihaldsefni á staðlað form.
   * @param {Record<string, unknown>} meal
   * @returns {import('./meal.types').Ingredient[]}
   */
  mapIngredients(meal) {
    const ingredients = [];

    // Hráefni eru í `strIngredient1` til `strIngredient20`, tóm eða null ef ekki notuð.
    for (let i = 1; i <= MAX_INGREDIENTS; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (typeof ingredient !== 'string' || ingredient.trim() === '') {
        continue;
      }

      ingredients.push({
        ingredient: ingredient.trim(),
        measure: typeof measure === 'string' ? measure.trim() : '',
      });
    }

    return ingredients;
  }

  /**
   * Færa staka uppskrift á staðlað form
   * @param {unknown} json
   * @returns {import('./meal.types').Meal | null}
   */
  mapMeal(json) {
    // `meals` er null ef uppskrift fannst ekki.
    if (
      !isRecord(json) ||
      !Array.isArray(json.meals) ||
      json.meals.length === 0
    ) {
      console.error('meal not found or invalid format');
      return null;
    }

    return this.mapMealItem(json.meals[0]);
  }

  /**
   * Færir eitt stak í svari yfir á staðlað form
   * @param {unknown} meal
   * @returns {import('./meal.types').Meal | null}
   */
  mapMealItem(meal) {
    if (
      !isRecord(meal) ||
      typeof meal.strMeal !== 'string' ||
      typeof meal.strInstructions !== 'string' ||
      typeof meal.strMealThumb !== 'string'
    ) {
      console.warn('invalid meal format', meal);
      return null;
    }

    return {
      title: meal.strMeal,
      instructions: meal.strInstructions,
      imageUrl: meal.strMealThumb,
      ingredients: this.mapIngredients(meal),
    };
  }

  /**
   * Leitar eftir uppskriftum, styður `slow` og `error` til að herma eftir
   * hægagangi eða villu.
   * @param {string} query
   * @returns {Promise<import('./meal.types').MealSearchResultItem[] | null>}
   */
  async search(query) {
    if (query.includes('slow')) {
      query = query.replace('slow', '').trim();
      await sleep(2);
    }

    if (query.includes('error')) {
      query = query.replace('error', '').trim();
      error('simulated error');
    }

    const url = this.buildUrl('search.php', { s: query });
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`HTTP error, status: ${response.status}`);
      return null;
    }

    /** @type {unknown} */
    const json = await response.json();

    return this.mapSearchResults(json);
  }

  /**
   * Sækir staka uppskrift eftir id.
   * @param {string} id
   * @returns {Promise<import('./meal.types').Meal | null>}
   */
  async meal(id) {
    const url = this.buildUrl('lookup.php', { i: id });
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`HTTP error, status: ${response.status}`);
      return null;
    }

    /** @type {unknown} */
    const json = await response.json();

    return this.mapMeal(json);
  }
}
