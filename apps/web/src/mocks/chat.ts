import type { ChatSession, ChatMessage } from '../types';

export const mockSessions: ChatSession[] = [
  { id: '1', title: 'How to descale my coffee maker', updatedAt: '2026-03-18T20:00:00Z' },
  { id: '2', title: 'TV remote pairing instructions', updatedAt: '2026-03-17T15:30:00Z' },
  { id: '3', title: 'Property boundary questions', updatedAt: '2026-03-15T11:00:00Z' },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'm1',
      role: 'user',
      content: 'How do I descale my DeLonghi coffee maker?',
      createdAt: '2026-03-18T20:00:00Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        'To descale your DeLonghi coffee maker, follow these steps:\n\n1. Fill the water tank with 1 litre of water mixed with the descaling solution.\n2. Place a container (at least 1.5L) under the steam wand and coffee spout.\n3. Press and hold the descaling button for 5 seconds until the light blinks orange.\n4. The machine will run the descaling cycle automatically — this takes about 25–30 minutes.\n5. When done, run two full tanks of clean water through to rinse.',
      citations: [{ chunkId: 'c1', documentId: 'doc_delonghi_manual', documentName: 'DeLonghi Coffee Maker Manual', page: 14 }],
      createdAt: '2026-03-18T20:00:05Z',
    },
  ],
  '2': [
    {
      id: 'm3',
      role: 'user',
      content: 'How do I pair a new remote to my Samsung TV?',
      createdAt: '2026-03-17T15:30:00Z',
    },
    {
      id: 'm4',
      role: 'assistant',
      content:
        'To pair a new remote with your Samsung TV:\n\n1. Point the remote at the TV from within 1 metre.\n2. Press and hold the **Return** and **Play/Pause** buttons simultaneously for 3 seconds.\n3. A pairing message will appear on screen — select **OK** to confirm.\n4. If pairing fails, replace the remote batteries and retry.',
      citations: [{ chunkId: 'c2', documentId: 'doc_samsung_tv_manual', documentName: 'Samsung 65" TV Manual', page: 32 }],
      createdAt: '2026-03-17T15:30:08Z',
    },
  ],
  '3': [
    {
      id: 'm5',
      role: 'user',
      content: 'Where exactly is the eastern boundary of my property?',
      createdAt: '2026-03-15T11:00:00Z',
    },
    {
      id: 'm6',
      role: 'assistant',
      content:
        "According to your Land Title Certificate, the eastern boundary runs along the cadastral line at bearing N 42° 15' E for a distance of 28.4 metres, terminating at survey peg DP 1234567. The boundary adjoins Lot 12 of the same deposited plan.",
      citations: [{ chunkId: 'c3', documentId: 'doc_land_title', documentName: 'Land Title Certificate', page: 2 }],
      createdAt: '2026-03-15T11:00:10Z',
    },
  ],
};
