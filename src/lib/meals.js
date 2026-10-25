import { el, empty } from './elements.js';

export class MealSearcher {
  /**
   * @param {import('./api.js').MealApi} api
   * @param {HTMLElement} baseElement
   */
  constructor(api, baseElement) {
    this.api = api;
    this.baseElement = baseElement;
  }

  /**
   * @param {HTMLElement} content
   */
  setResults(content) {
    const resultsEl = this.baseElement.querySelector('.results');
    if (!resultsEl) {
      console.error('no results element found');
      return;
    }

    empty(resultsEl);
    resultsEl.appendChild(content);
  }

  /**
   * @param {string} text
   */
  setMessage(text) {
    this.setResults(el('p', { class: 'message' }, text));
  }

  /**
   * @param {import('./meal.types').MealSearchResultItem[]} results
   * @returns {HTMLElement}
   */
  renderSearchResults(results) {
    if (results.length === 0) {
      return el('p', { class: 'message' }, 'Engar uppskriftir fundust.');
    }

    const resultsEl = el('ul', { class: 'results-list' });
    for (const result of results) {
      const resultItem = el(
        'li',
        { class: 'results-item' },
        el(
          'a',
          { href: `?id=${result.id}` },
          el('img', { src: result.thumbnailUrl, alt: '', loading: 'lazy' }),
          el('span', {}, result.title),
        ),
      );
      resultsEl.appendChild(resultItem);
    }
    return resultsEl;
  }

  /**
   * @param {SubmitEvent} event
   */
  async searchHandler(event) {
    event.preventDefault();

    if (!(event.target instanceof HTMLFormElement)) {
      console.error('event target is not a form element');
      return;
    }

    const formData = new FormData(event.target);
    const query = formData.get('query');

    if (typeof query !== 'string' || query.trim() === '') {
      this.setMessage('Vinsamlegast sláðu inn leitarorð.');
      return;
    }

    this.setMessage('Leita að uppskriftum...');

    try {
      const results = await this.api.search(query.trim());

      if (!results) {
        this.setMessage('Villa kom upp við leit að uppskriftum.');
        return;
      }

      this.setResults(this.renderSearchResults(results));
    } catch (error) {
      console.error('error searching for meals:', error);
      this.setMessage('Villa kom upp við leit að uppskriftum.');
    }
  }

  renderSearchForm() {
    const form = el(
      'form',
      { class: 'form' },
      el('label', { for: 'query' }, 'Leita að uppskrift:'),
      el(
        'div',
        { class: 'form-row' },
        el('input', {
          type: 'search',
          name: 'query',
          id: 'query',
          required: 'true',
        }),
        el('button', { type: 'submit' }, 'Leita'),
      ),
    );
    const results = el('div', { class: 'results' });

    form.addEventListener('submit', (event) => {
      this.searchHandler(event);
    });

    empty(this.baseElement);
    this.baseElement.appendChild(form);
    this.baseElement.appendChild(results);
  }

  /**
   * @param {import('./meal.types').Meal} meal
   * @returns {HTMLElement}
   */
  renderMealResult(meal) {
    const ingredientsEl = el('ul', { class: 'meal-ingredients' });
    for (const { ingredient, measure } of meal.ingredients) {
      const text = measure ? `${measure} ${ingredient}` : ingredient;
      ingredientsEl.appendChild(el('li', {}, text));
    }

    const instructionsEl = el('div', { class: 'meal-instructions' });
    const lines = meal.instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '');
    for (const line of lines) {
      instructionsEl.appendChild(el('p', {}, line));
    }

    return el(
      'article',
      { class: 'meal' },
      el('h2', {}, meal.title),
      el('img', { class: 'meal-image', src: meal.imageUrl, alt: meal.title }),
      el('h3', {}, 'Hráefni'),
      ingredientsEl,
      el('h3', {}, 'Leiðbeiningar'),
      instructionsEl,
    );
  }

  /**
   * @param {string} id ID uppskriftar sem á að birta.
   */
  async renderMeal(id) {
    empty(this.baseElement);
    this.baseElement.appendChild(
      el('a', { href: '/', class: 'back' }, '← Til baka'),
    );
    this.baseElement.appendChild(el('div', { class: 'results' }));

    this.setMessage('Sæki uppskrift...');

    try {
      const meal = await this.api.meal(id);

      if (!meal) {
        this.setMessage('Uppskrift fannst ekki.');
        return;
      }

      this.setResults(this.renderMealResult(meal));
    } catch (error) {
      console.error('error fetching meal:', error);
      this.setMessage('Villa kom upp við að sækja uppskrift.');
    }
  }

  /**
   * Birtir annaðhvort leitarform eða ákveðna uppskrift.
   * @param {string|null} id ID uppskriftar, ef ekki null er hún birt.
   */
  render(id = null) {
    if (id) {
      this.renderMeal(id);
    } else {
      this.renderSearchForm();
    }
  }
}
