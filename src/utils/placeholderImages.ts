
export const generateCardImage = (name: string, type: string, rarity: string): string => {
  // In a real app, we'd fetch actual images. Here we'll create colored blocks with text
  const colors: Record<string, string> = {
    "common": "bg-blue-600",
    "rare": "bg-purple-600",
    "epic": "bg-pink-600",
    "legendary": "bg-amber-500"
  };
  
  const typeColors: Record<string, string> = {
    "attack": "from-red-500 to-orange-500",
    "defense": "from-blue-500 to-cyan-500",
    "utility": "from-purple-500 to-fuchsia-500"
  };

  // Return a data URL that would represent a card
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <rect width="300" height="400" fill="${rarity === 'legendary' ? '#F59E0B' : rarity === 'epic' ? '#8B5CF6' : rarity === 'rare' ? '#3B82F6' : '#6B7280'}" rx="15" ry="15" />
    <rect x="15" y="15" width="270" height="370" fill="#1E293B" rx="10" ry="10" />
    <rect x="25" y="25" width="250" height="200" fill="${type === 'attack' ? '#EF4444' : type === 'defense' ? '#3B82F6' : '#8B5CF6'}" rx="5" ry="5" />
    <text x="150" y="250" fill="white" font-family="Arial" font-size="20" text-anchor="middle">${name}</text>
    <text x="150" y="290" fill="#94A3B8" font-family="Arial" font-size="16" text-anchor="middle">${type.charAt(0).toUpperCase() + type.slice(1)}</text>
    <text x="150" y="330" fill="#F59E0B" font-family="Arial" font-size="16" text-anchor="middle">${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</text>
  </svg>`;
};

export const generateAvatarImage = (username: string): string => {
  // Generate a simple avatar based on username
  const hue = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="hsl(${hue}, 70%, 50%)" />
    <text x="100" y="115" fill="white" font-family="Arial" font-size="60" text-anchor="middle">${username.charAt(0).toUpperCase()}</text>
  </svg>`;
};
