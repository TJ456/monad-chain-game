
export const generateCardImage = (name: string, type: string, rarity: string): string => {
  // Generate a hash from the name to get consistent but unique patterns
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Define colors based on rarity and type
  const rarityColors: Record<string, { primary: string, secondary: string, accent: string }> = {
    "common": { primary: '#4B5563', secondary: '#374151', accent: '#9CA3AF' },
    "rare": { primary: '#3B82F6', secondary: '#2563EB', accent: '#60A5FA' },
    "epic": { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
    "legendary": { primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24' }
  };

  const typeColors: Record<string, { primary: string, secondary: string }> = {
    "attack": { primary: '#EF4444', secondary: '#DC2626' },
    "defense": { primary: '#3B82F6', secondary: '#2563EB' },
    "utility": { primary: '#8B5CF6', secondary: '#7C3AED' }
  };

  // Get colors for this card
  const cardRarityColors = rarityColors[rarity] || rarityColors.common;
  const cardTypeColors = typeColors[type] || typeColors.attack;

  // Generate a pattern based on the name hash
  const patternElements = [];
  const patternCount = 5 + (nameHash % 8); // 5-12 elements

  for (let i = 0; i < patternCount; i++) {
    const size = 20 + ((nameHash * (i + 1)) % 40); // 20-60px
    const x = ((nameHash * (i + 2)) % 250) + 25; // 25-275px
    const y = ((nameHash * (i + 3)) % 150) + 25; // 25-175px
    const opacity = 0.1 + ((nameHash * (i + 4)) % 5) / 10; // 0.1-0.6

    patternElements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${cardTypeColors.primary}" opacity="${opacity}" />`);
  }

  // Create a gradient background based on type
  const gradientId = `grad-${nameHash}`;

  // Return a data URL that would represent a card with enhanced visuals
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${cardTypeColors.primary}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${cardTypeColors.secondary}" stop-opacity="0.9" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Card border with glow effect based on rarity -->
    <rect width="300" height="400" rx="15" ry="15" fill="${cardRarityColors.primary}" />
    <rect x="10" y="10" width="280" height="380" rx="10" ry="10" fill="#0F172A" />

    <!-- Card art area with pattern -->
    <rect x="20" y="20" width="260" height="200" rx="5" ry="5" fill="url(#${gradientId})" />
    ${patternElements.join('')}

    <!-- Card name with rarity-colored glow -->
    <text x="150" y="250" fill="white" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" filter="url(#glow)">${name}</text>

    <!-- Card type with icon suggestion -->
    <circle cx="40" cy="280" r="15" fill="${cardTypeColors.primary}" />
    <text x="40" y="285" fill="white" font-family="Arial" font-size="12" text-anchor="middle">${type.charAt(0).toUpperCase()}</text>
    <text x="150" y="285" fill="#94A3B8" font-family="Arial" font-size="16" text-anchor="middle">${type.charAt(0).toUpperCase() + type.slice(1)}</text>

    <!-- Rarity indicator -->
    <rect x="20" y="310" width="260" height="30" rx="5" ry="5" fill="#1E293B" />
    <text x="150" y="330" fill="${cardRarityColors.accent}" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</text>

    <!-- MONAD branding -->
    <text x="270" y="380" fill="#10B981" font-family="monospace" font-size="10" text-anchor="end">MONAD</text>
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
