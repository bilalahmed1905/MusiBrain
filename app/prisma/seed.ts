import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID || randomUUID();
  const email = process.env.SEED_USER_EMAIL || 'seed-user@example.com';

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      displayName: 'Seed User',
      email,
    },
    create: {
      id: userId,
      displayName: 'Seed User',
      email,
    },
  });

  await prisma.favourite.deleteMany({ where: { userId } });
  await prisma.tasteProfile.deleteMany({ where: { userId } });
  await prisma.playlist.deleteMany({ where: { userId } });
  await prisma.trackFeedback.deleteMany({ where: { userId } });

  const favourites = [
    {
      trackName: 'Nights',
      artistName: 'Frank Ocean',
      albumName: 'Blonde',
      loveReason: 'The switch-up feels like two emotions colliding in the best way.',
      moodAnswer: 'Late-night introspection with a soft edge.',
      tags: ['nostalgic', 'melancholy', 'atmospheric'],
    },
    {
      trackName: 'Holocene',
      artistName: 'Bon Iver',
      albumName: 'Bon Iver',
      loveReason: 'It feels wide-open and fragile at the same time.',
      moodAnswer: 'Quiet, reflective, and grounded.',
      tags: ['dreamy', 'cinematic'],
    },
    {
      trackName: 'Midnight City',
      artistName: 'M83',
      albumName: 'Hurry Up, We\'re Dreaming',
      loveReason: 'The synths feel like neon nostalgia.',
      moodAnswer: 'Driving with the windows down.',
      tags: ['uplifting', 'nostalgic'],
    },
    {
      trackName: 'Motion Picture Soundtrack',
      artistName: 'Radiohead',
      albumName: 'Kid A',
      loveReason: 'The ending feels like an emotional release.',
      moodAnswer: 'Bittersweet closure.',
      tags: ['melancholy', 'cinematic'],
    },
    {
      trackName: 'Intro',
      artistName: 'The xx',
      albumName: 'xx',
      loveReason: 'Minimal but charged with tension.',
      moodAnswer: 'Focused and calm.',
      tags: ['atmospheric', 'background'],
    },
  ];

  await prisma.favourite.createMany({
    data: favourites.map((fav, index) => ({
      userId,
      trackId: `${fav.artistName}::${fav.trackName}`.toLowerCase(),
      trackName: fav.trackName,
      artistName: fav.artistName,
      albumName: fav.albumName,
      loveReason: fav.loveReason,
      moodAnswer: fav.moodAnswer,
      tags: JSON.stringify(fav.tags),
      orderIndex: index,
      isFinalized: true,
    })),
  });

  await prisma.tasteProfile.create({
    data: {
      userId,
      semanticTags: JSON.stringify([
        'melancholy indie with glowing synths',
        'cinematic slow builds',
        'late-night introspection',
      ]),
      moods: JSON.stringify(['reflective solitude', 'quiet determination', 'nostalgic warmth']),
      summaryText:
        'You gravitate toward songs that feel like open night skies: moody, textured, and quietly intense. You love emotional arcs that start restrained and bloom into cathartic releases.\n\nYour favorites lean cinematic and atmospheric, with a preference for subtle dynamics and rich ambience rather than loud, constant energy.',
      internalNotes:
        'Prefer mid-tempo tracks with warm synths, slow builds, and spacious production. Avoid overly bright pop or aggressive EDM unless it has emotional weight.',
      tagIntensities: JSON.stringify({
        'melancholy indie with glowing synths': 0.9,
        'cinematic slow builds': 0.8,
        'late-night introspection': 0.7,
      }),
    },
  });

  await prisma.playlist.create({
    data: {
      userId,
      context: 'late-night-drive',
      name: 'MusiBrain - Late Night Drive - Seed',
      description: 'A moody, cinematic mix for late-night drives and quiet reflection.',
      tracks: JSON.stringify([
        {
          name: 'Nightcall',
          artist: 'Kavinsky',
          reason: 'Neon-lit synth textures with a steady, nocturnal pulse.',
          platformLinks: {},
        },
        {
          name: 'Wait',
          artist: 'M83',
          reason: 'Slow-burn emotional build that peaks with cinematic release.',
          platformLinks: {},
        },
        {
          name: 'Retrograde',
          artist: 'James Blake',
          reason: 'Sparse, intimate atmosphere with deep emotional resonance.',
          platformLinks: {},
        },
      ]),
      cachedAt: new Date(),
      cacheExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log('Seed complete');
  console.log(`User ID: ${userId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
