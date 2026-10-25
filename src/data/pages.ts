export type PageCategory = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  soft: string;
  description: string;
  titles: readonly string[];
};

export type ColoringPage = {
  id: string;
  title: string;
  categoryId: string;
  variant: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
};

export const categories: readonly PageCategory[] = [
  { id: 'animals', name: 'Sweet animals', emoji: '🐻', color: '#ff8a72', soft: '#fff0e9', description: 'Meet your new furry friends', titles: ['Sleepy Bear', 'Happy Bunny', 'Curious Fox', 'Tiny Hedgehog', 'Friendly Lion', 'Puddle Puppy', 'Stripy Tiger', 'Little Panda', 'Silly Monkey', 'Gentle Giraffe'] },
  { id: 'birds', name: 'Bird buddies', emoji: '🐦', color: '#44b8b0', soft: '#e7f8f5', description: 'Feathered friends are flying by', titles: ['Songbird on a Branch', 'Little Penguin', 'Proud Peacock', 'Baby Owl', 'Parrot Pal', 'Flamingo Friend', 'Duckling Splash', 'Hummingbird Hello', 'Swan on a Lake', 'Rooster at Sunrise'] },
  { id: 'flowers', name: 'Flower garden', emoji: '🌼', color: '#f4ad39', soft: '#fff6dc', description: 'Grow a garden of your own', titles: ['Sunny Sunflower', 'Daisy Daydream', 'Tulip Time', 'Rose in Bloom', 'Happy Poppy', 'Garden Bouquet', 'Lily Pond Flower', 'Dancing Daffodil', 'Sweet Pea Vine', 'Rainbow Garden'] },
  { id: 'vehicles', name: 'Things that go', emoji: '🚂', color: '#5586ee', soft: '#eaf0ff', description: 'Ready, set, let’s go!', titles: ['Zooming Race Car', 'School Bus Ride', 'Chugging Train', 'Sailing Boat', 'Rocket to the Moon', 'Little Airplane', 'Fire Truck Helper', 'Happy Tractor', 'Scooter Spin', 'Hot Air Balloon', 'Friendly Bicycle', 'Busy Garbage Truck', 'Mountain Camper Van', 'City Tram', 'Rescue Helicopter'] },
  { id: 'dinosaurs', name: 'Dino explorers', emoji: '🦕', color: '#62b96d', soft: '#eaf8e9', description: 'Roar into prehistoric fun', titles: ['Long-Neck Dino', 'Tiny T-Rex', 'Triceratops Pal', 'Stegosaurus Stroll', 'Baby Pterodactyl', 'Dino Egg Hatchling', 'Spiky Ankylosaurus', 'Dino Family Picnic', 'Fossil Finder', 'Volcano Valley'] },
  { id: 'space', name: 'Outer space', emoji: '🪐', color: '#8c72d9', soft: '#f0edff', description: 'Blast off to a starry place', titles: ['Ringed Planet', 'Moon and Stars', 'Friendly Alien', 'Rocket Adventure', 'Astronaut Wave', 'Comet Zoom', 'Space Station', 'Little Earth', 'Galaxy Cat', 'Starry Night Sky'] },
  { id: 'fruits', name: 'Fruit picnic', emoji: '🍓', color: '#ef7191', soft: '#fff0f4', description: 'A basket full of tasty colors', titles: ['Strawberry Smiles', 'Apple for You', 'Banana Bunch', 'Pineapple Party', 'Watermelon Slice', 'Cherries Together', 'Juicy Orange', 'Grapes on a Vine', 'Peachy Keen', 'Fruit Picnic Basket'] },
  { id: 'underwater', name: 'Under the sea', emoji: '🐙', color: '#39a8cf', soft: '#e6f7fc', description: 'Dive down to say hello', titles: ['Clownfish Coral', 'Waving Octopus', 'Sea Turtle Swim', 'Happy Whale', 'Seahorse Dance', 'Jellyfish Float', 'Crab on the Sand', 'Dolphin Leap', 'Starfish Beach', 'Underwater Castle'] },
  { id: 'fantasy', name: 'Magic meadow', emoji: '🦄', color: '#bb7acb', soft: '#f8ecfa', description: 'A little sparkle and a lot of magic', titles: ['Rainbow Unicorn', 'Dragon with a Heart', 'Friendly Castle', 'Fairy Garden', 'Magic Mushroom', 'Flying Carpet', 'Mermaid Hello', 'Cloud Castle', 'Wizard’s Hat', 'Dragon Egg'] },
  { id: 'shapes', name: 'Shape adventures', emoji: '🌈', color: '#e68c49', soft: '#fff0e0', description: 'Big shapes, little shapes, lots of ideas', titles: ['Rainbow and Clouds', 'Shape House', 'Silly Robot', 'Kite in the Sky', 'Balloon Bunch', 'Shape Rocket', 'Cozy Treehouse', 'Friendly Sun', 'Pattern Parade', 'Big City Shapes'] },
];

export const coloringPages: readonly ColoringPage[] = categories.flatMap((category) =>
  category.titles.map((title, variant) => ({
    id: `${category.id}-${variant + 1}`,
    title,
    categoryId: category.id,
    variant,
    difficulty: variant < 3 ? 'Easy' : variant < 7 ? 'Medium' : 'Advanced',
  })),
);

export function getPage(id: string | null | undefined): ColoringPage | undefined {
  return coloringPages.find((page) => page.id === id);
}

export function getCategory(id: string | null | undefined): PageCategory | undefined {
  return categories.find((category) => category.id === id);
}
