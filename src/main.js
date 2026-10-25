import { MealApi } from './lib/api.js';
import { MealSearcher } from './lib/meals.js';

/** Grunnslóð á API, `1` er ókeypis prófunarlykill. */
const API_BASE = 'https://www.themealdb.com/api/json/v1/1/';

/** API virkni. */
const api = new MealApi(API_BASE);

/** Element sem birtir forritið okkar. */
const mealSearcherElement = document.querySelector('.meal-searcher');

/** ID á uppskrift eða null. */
const id = new URLSearchParams(window.location.search).get('id');

if (mealSearcherElement instanceof HTMLElement) {
  const mealSearcher = new MealSearcher(api, mealSearcherElement);
  mealSearcher.render(id);
} else {
  console.error('no meal searcher element found');
}
