import { stickers } from './drawingObjects';

export type Tutorial = { id: string; title: string; subtitle: string; emoji: string; steps: string[]; finish: string };
export const tutorials: Tutorial[] = [
  { id: 'smiley', title: 'Circle smiley', subtitle: 'A happy face from simple shapes', emoji: '☺️', steps: ['Draw one big, round circle for the face.', 'Add two little eyes near the top.', 'Give your smiley a curved, happy mouth.'], finish: 'You made a brand-new friend!' },
  { id: 'flower', title: 'Little flower', subtitle: 'Petals, a middle, and a stem', emoji: '🌼', steps: ['Draw a small circle in the middle.', 'Add five soft loops around the middle for petals.', 'Draw a long stem and two leaves.'], finish: 'Your flower is ready to grow!' },
  { id: 'butterfly', title: 'Butterfly', subtitle: 'Four wings and a tiny body', emoji: '🦋', steps: ['Draw a short, gentle line for the body.', 'Add two big round wings at the top.', 'Add two smaller wings below and little feelers.'], finish: 'Your butterfly can flutter away!' },
  { id: 'house', title: 'Cozy house', subtitle: 'A roof, a home, and a door', emoji: '🏠', steps: ['Draw a square for the house.', 'Add a triangle roof above it.', 'Draw a door, windows, and a path.'], finish: 'A lovely home for an imaginary friend!' },
  { id: 'car', title: 'Zoomy car', subtitle: 'A car made of easy shapes', emoji: '🚗', steps: ['Draw a long rectangle for the car body.', 'Add a smaller rounded shape for the windows.', 'Draw two circle wheels and a happy headlight.'], finish: 'Ready, set, zoom!' },
  { id: 'rocket', title: 'Rocket ship', subtitle: 'Ready for a space adventure', emoji: '🚀', steps: ['Draw a tall rounded body.', 'Add a pointy nose and two little fins.', 'Draw a round window and a wiggly flame.'], finish: 'Three, two, one… lovely drawing!' },
  { id: 'fish', title: 'Little fish', subtitle: 'A fish with a swishy tail', emoji: '🐟', steps: ['Draw a big oval for the fish body.', 'Add a triangle tail at the back.', 'Draw an eye, a fin, and a few bubbles.'], finish: 'Your fish is ready to swim!' },
  { id: 'robot', title: 'Friendly robot', subtitle: 'Boxes, buttons, and antennae', emoji: '🤖', steps: ['Draw a rounded rectangle for the robot head.', 'Add two eyes, a smile, and an antenna.', 'Draw a body, arms, and two helpful legs.'], finish: 'Your robot friend is complete!' },
];

const extraPreviews: Record<string, string> = {
  house: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M12 47 50 14l38 33M22 43v44h56V43" fill="#ffcf66" stroke="#525468" stroke-width="5" stroke-linejoin="round"/><path d="M42 87V60h17v27M30 54h10m20 0h10" fill="none" stroke="#525468" stroke-width="4" stroke-linecap="round"/><path d="M50 14V7m-4 0h8" stroke="#e96f68" stroke-width="4" stroke-linecap="round"/></svg>',
  robot: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="22" width="60" height="43" rx="12" fill="#83d5d3" stroke="#525468" stroke-width="5"/><path d="M50 22V11m-8 0h16" stroke="#525468" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="42" r="5" fill="#525468"/><circle cx="62" cy="42" r="5" fill="#525468"/><path d="M40 54q10 8 20 0M35 67v17m30-17v17M20 76H9m71 0h11" fill="none" stroke="#525468" stroke-width="5" stroke-linecap="round"/><rect x="30" y="66" width="40" height="24" rx="8" fill="#ffcf66" stroke="#525468" stroke-width="4"/></svg>',
};
export function tutorialPreview(id: string) {
  if (extraPreviews[id]) return extraPreviews[id];
  const stickerId = id === 'smiley' ? 'smiley' : id;
  return stickers.find((item) => item.id === stickerId)?.svg ?? stickers[0].svg;
}
