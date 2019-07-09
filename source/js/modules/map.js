/* global document window console */
/* eslint-disable no-alert, no-console */
// 'use strict';

// const $ = require('jquery');

// $(document).ready(function () {
//   let mapContainer = document.querySelector('.map__container');
//   const mapBlock = document.querySelector('#map');

//   if(mapContainer) {
//     mapContainer.addEventListener('mouseenter', function() {
//       mapContainer.classList.add('map__container--hovered');
//     });
//   }

//   if (mapBlock) {
//     ymaps.ready(function () {
//       let myMap = new ymaps.Map('map', {
//         center: [55.16013857, 61.28671600],
//         zoom: 16,
//         controls: ['largeMapDefaultSet']
//       }, {
//         searchControlProvider: 'yandex#search'
//       });

//       const myPlacemark = new ymaps.Placemark([55.16013857, 61.28671600], {
//         hintContent: 'Мы находимся тут',
//         balloonContent: 'Челябинск, улица Академика Сахарова, 34'
//       },{
//         preset: 'islands#darkBluePocketIcon'
//       });

//       myMap.geoObjects.add(myPlacemark);
//     });
//   }
// });
