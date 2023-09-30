// Імпортуємо необхідні стилі та залежності
import './css/style.css';
import { PixabayAPI } from './js/pixabay-api';
import createPhotoCard from './templates/card-template.hbs';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// Вибираємо DOM-елементи
const formSearchEl = document.querySelector('.search-form');
const galleryEl = document.querySelector('.gallery');
const loadMoreBtnEl = document.querySelector('.load-more');

// Створюємо екземпляр класу для взаємодії з Pixabay API
const pixabayApi = new PixabayAPI();

// Ініціалізуємо SimpleLightbox для перегляду зображень
let gallery = new SimpleLightbox('.gallery a');

// Функція для обробки подання форми пошуку фотографій
const handleSearchFoto = async ev => {
  ev.preventDefault();
  galleryEl.innerHTML = '';
  loadMoreBtnEl.classList.add('is-hidden');
  pixabayApi.page = 1;

  // Отримуємо пошуковий запит від користувача
  const searchItemEl = ev.target.elements['searchQuery'].value.trim();

  pixabayApi.q = searchItemEl;

  if (!searchItemEl) {
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
    galleryEl.innerHTML = createPhotoCard(data.hits);

    // Виводимо сповіщення про успішний пошук та кількість знайдених зображень
    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);

    // Оновлюємо галерею
    gallery.refresh();

    // Визначаємо максимальну кількість фотографій, яку хочемо відобразити
    const maxPhotosPerPage = 40; // Наприклад, встановіть 40 як максимум

    console.log(data.totalHits)
    console.log(maxPhotosPerPage)

    if (data.totalHits > maxPhotosPerPage) {
      // Показуємо кнопку "Завантажити ще", якщо є більше результатів
      loadMoreBtnEl.classList.remove('is-hidden');
    }
  } catch (error) {
    console.log(error);
  }
}

// Функція для обробки кліку на кнопці "Завантажити ще"
function handleLoadMoreBtnClick() {
  pixabayApi.page += 1;
  searchMorePhoto();
}

// Асинхронна функція для завантаження додаткових фотографій
async function searchMorePhoto() {
  try {
    // Виконуємо запит до Pixabay API для отримання додаткових фотографій
    const { data } = await pixabayApi.fetchPhoto();

    // Додаємо нові картки зображень до існуючих
    galleryEl.insertAdjacentHTML('beforeend', createPhotoCard(data.hits));
    
    // Оновлюємо галерею
    gallery.refresh();

    if (data.hits.length < pixabayApi.per_page) {
      // Приховуємо кнопку "Завантажити ще" і виводимо інформаційне сповіщення, якщо результатів більше немає
      loadMoreBtnEl.classList.add('is-hidden');
      Notiflix.Notify.info("Вибачте, ви досягли кінця результатів пошуку.");
    }
  } catch (error) {
    console.log(error);
  }
}

// Додаємо обробники подій:
// - Відправка форми запускає функцію обробки пошуку фотографій
formSearchEl.addEventListener('submit', handleSearchFoto);
// - Клік на кнопці "Завантажити ще" запускає функцію обробки завантаження додаткових фотографій
loadMoreBtnEl.addEventListener('click', handleLoadMoreBtnClick);
