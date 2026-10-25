export const palettes = {
  Basic: ['#2d3142','#ffffff','#ec5d67','#f08a40','#f5c746','#71b85c','#3fb8a4','#438fdb'],
  Pastel: ['#ffc8c4','#ffd8a8','#fff0a8','#c8edc4','#bfe9e8','#c9ddff','#d8c9ff','#ffc9e2'],
  Bright: ['#ff3939','#ff7c1f','#ffce00','#46c936','#00b9b3','#138bea','#7849ea','#ee36a2'],
  Neon: ['#ff1977','#ff5d00','#f6f500','#40ff00','#00f5ed','#1685ff','#a900ff','#ff25df'],
  'Skin tones': ['#f9dfc1','#efc7a2','#daa77d','#bd865e','#a56d4e','#87583e','#704633','#4f322b'],
  Nature: ['#356e45','#5d9e4c','#9bc85b','#c5db72','#68aa9c','#467d89','#7b6952','#b29764'],
  Rainbow: ['#ec3b54','#f08335','#f7cb43','#58ad62','#3ba8ad','#407ed2','#8157ba','#ce55a2'],
  Candy: ['#ff6b8a','#ff9ecb','#ffc1d2','#fa7ac2','#cd8bf1','#a58cfa','#7cc8ff','#8ee6d4'],
  Ocean: ['#083d77','#136f91','#27a7bd','#62c6d4','#a0e3df','#246e8a','#5676b8','#b4d4e7'],
  Sunset: ['#8f3b76','#c65b7c','#ed795f','#ff9d56','#ffd166','#f6bd60','#e76f51','#9b5de5'],
  Galaxy: ['#181a48','#292d76','#5144a5','#845ec2','#bd6adf','#ed78ac','#75c9e8','#f0dbff'],
} as const;

export const allColors = [...new Set(Object.values(palettes).flat())];
