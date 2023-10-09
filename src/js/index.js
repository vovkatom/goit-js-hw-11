// Імпортуємо необхідні стилі та залежності
import '../css/style.css';
import { PixabayAPI } from '../js/api';
import createPhotoCard from '../templates/card-template.hbs';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// Вибираємо DOM-елементи
const formSearch = document.querySelector('.search-form');
const infiniteScrollContainer = document.querySelector('.scroll-container');

// Створюємо екземпляр класу для взаємодії з Pixabay API
const pixabayApi = new PixabayAPI();

// Ініціалізуємо SimpleLightbox для перегляду зображень
let gallery = new SimpleLightbox('.gallery a');

// Ініціалізуємо змінну для відстеження статусу запиту
let isLoading = false;
let hasError = false; // змінна для відстеження наявності помилки

// Функція для обробки подання форми пошуку фотографій
const handleSearchFoto = async ev => {
  ev.preventDefault();
  infiniteScrollContainer.innerHTML = '';
  pixabayApi.page = 1;
  hasError = false; // При новому пошуку скидаємо прапор помилки

  // Отримуємо пошуковий запит від користувача
  const searchItem = ev.target.elements['searchQuery'].value.trim();

  pixabayApi.q = searchItem;

  if (!searchItem) {
    // Виводимо сповіщення про помилку, якщо пошуковий запит порожній
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }

  // Виконуємо пошук фотографій
  searchGallery();
};

// Асинхронна функція для пошуку фотографій
async function searchGallery() {
  try {
    // Виконуємо запит до Pixabay API для отримання фотографій
    const { data } = await pixabayApi.fetchPhoto();

    if (data.totalHits === 0) {
      // Виводимо сповіщення про помилку, якщо немає відповідних фотографій
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    
    // Генеруємо і вставляємо HTML-код для карток зображень
    infiniteScrollContainer.innerHTML = createPhotoCard(data.hits);

    // Виводимо сповіщення про успішний пошук та кількість знайдених зображень
    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);

    // Оновлюємо галерею
    gallery.refresh();

    // Визначаємо максимальну кількість фотографій, яку хочемо відобразити
    const maxPhotosPerPage = 40;
    if (data.totalHits > maxPhotosPerPage) {
      // Показуємо кнопку "Завантажити ще", якщо є більше результатів
      loadMoreImages(); // Викликаємо функцію завантаження при першому завантаженні
      window.addEventListener('scroll', loadMoreImages); // Додаємо обробник прокручування
    }
  } catch (error) {
    console.log(error);
    hasError = true; // Встановлюємо значення hasError на true у випадку помилки
  }
}

// Функція для завантаження додаткових фотографій при прокручуванні
function loadMoreImages() {
  if (isLoading || hasError) {
    // Якщо вже виконується запит або є помилка, не робити новий запит
    return;
  }

  const containerHeight = infiniteScrollContainer.offsetHeight;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;

  // Перевірка, чи користувач дійшов до кінця сторінки
  if (containerHeight - (scrollTop + windowHeight) < 200) {
    isLoading = true; // Позначити, що почався новий запит
    pixabayApi.page += 1;
    searchMorePhoto().then(() => {
      isLoading = false; // Позначити, що запит завершено
    });
  }
}

// Асинхронна функція для завантаження додаткових фотографій
async function searchMorePhoto() {
  try {
    // Виконуємо запит до Pixabay API для отримання додаткових фотографій
    const { data } = await pixabayApi.fetchPhoto();

    // Додаємо нові картки зображень до існуючих
    infiniteScrollContainer.insertAdjacentHTML('beforeend', createPhotoCard(data.hits));
    
    // Оновлюємо галерею
    gallery.refresh();

    if (data.hits.length < pixabayApi.per_page) {
      // Відключаємо обробник прокручування і приховуємо кнопку "Завантажити ще", якщо результатів більше немає
      window.removeEventListener('scroll', loadMoreImages);
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
    }
  } catch (error) {
    console.log(error);
    hasError = true; // Встановлюємо значення hasError на true у випадку помилки
  } finally {
    isLoading = false; // Позначити, що завершено запит (навіть якщо сталася помилка)
  }
}

// Додаємо обробники подій:
// - Відправка форми запускає функцію обробки пошуку фотографій
formSearch.addEventListener('submit', handleSearchFoto);
