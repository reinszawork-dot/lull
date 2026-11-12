/* Lull Pro content: extra sleep stories, signature soundscape mixes and the Steady course. All original writing. */
LULL.proStories = [
  { id: 'kalahari', scene: 'crickets', title: 'Stars over the Kalahari', mins: 9, sound: { crickets: 0.4, wind: 0.12, drone: 0.15 }, desc: 'A red-sand camp under the clearest sky on earth.',
    text: `The heat of the day has gone out of the sand. You are lying on a thin mattress on the roof of a small camp in the Kalahari, with a sleeping bag pulled up to your chin. The dunes around you are low and red, and soft in the last light. A camel thorn tree stands alone nearby, its branches spread like an open hand. The sun has slipped below the edge of the world, and the sky is turning from orange, to violet, to a deep and endless blue. One by one, the stars arrive. First the bright ones. Then the quieter ones behind them. Then so many that you stop trying to count. Out here there are no streetlights and no traffic. Only the slow dry wind, moving over the sand, and the crickets, singing in the grass. You can see the Milky Way now, a long pale river of light running from one side of the sky to the other. It has been there your whole life, waiting for a night as clear as this one. Somewhere far off, a jackal calls once, and then the desert is quiet again. You breathe in the cool air. It smells of dust and grass and something sweet you cannot name. You breathe out, long and slow. The sleeping bag is warm. The roof under you is solid and still. Above you, the stars turn so slowly that you cannot see them move. But they are moving, all night, without any effort, and they will carry the sky round until morning. You do not need to keep watch. The desert is keeping watch. Let your eyes close. Let the wind and the crickets fill the space where your thoughts were. There is only the sand, the stars, and the long, slow breath of the night.` },
  { id: 'knysna', scene: 'rain', title: 'Rain in the Knysna forest', mins: 9, sound: { rain: 0.5, fire: 0.2 }, desc: 'A wooden cabin among old yellowwood trees.',
    text: `Deep in the forest near Knysna there is a small wooden cabin, and tonight it is yours. The trees around it are very old. Yellowwoods and stinkwoods, taller than houses, with moss growing thick on their trunks and long beards of lichen hanging from their branches. It has been raining softly since the afternoon. Not a storm. Just a gentle, patient rain that drips from leaf to leaf on its long way down to the forest floor. Inside, a small fire is burning in the stove. You can hear the wood crackle and settle. A kettle has just boiled, and you are holding a mug of rooibos tea in both hands, letting the warmth soak into your fingers. Through the window, the forest is dark green and silver. Every so often a drop lands on the tin roof with a soft tick. Then another. Then a little run of them, like someone tapping out a slow tune. Somewhere out there, the forest elephants are sleeping, and the birds have tucked their heads under their wings. Everything in the forest knows how to rest. You set down your mug. You climb into a bed piled with soft blankets, and the mattress gives a little under you, holding you. The fire glows orange on the ceiling beams. The rain keeps falling. It will fall all night, filling the streams, feeding the ferns and the moss, and you do not have to help it at all. Let your body grow heavy, the way the forest floor is heavy with rain. Let your breath slow down to the pace of the drips on the roof. Nothing needs you now. The forest is keeping you safe, and the rain is singing you to sleep.` },
  { id: 'harbour', scene: 'ocean', title: 'The quiet harbour', mins: 8, sound: { ocean: 0.4, drone: 0.2, wind: 0.1 }, desc: 'A small boat, a calm bay and the lights of a fishing village.',
    text: `Tonight you are aboard a small wooden boat, tied up snugly in a quiet harbour. The fishing fleet came in hours ago. The nets are folded, the decks are rinsed, and the fishermen have gone home to their suppers. Now the harbour belongs to the water and the gulls. Your cabin is small, with a round window and a narrow bunk tucked under the deck. The sheets smell of salt and sunshine. You lie down and pull the blanket over you, and you feel the boat move. Just slightly. A slow lift, and a slow settle. A slow lift, and a slow settle. The water is breathing under the hull. Out of the round window you can see the lights of the village on the hill, warm yellow squares in the dark, one going out, and then another, as the village goes to bed. A rope creaks softly against the jetty. A small wave laps against the side of the boat and slips away. The harbour wall stands between you and the open sea, strong and old, built long ago to keep boats like this one safe on nights like this one. You do not need to steer. You do not need to check the ropes. They are tied well. All you need to do is lie here and let the water rock you. Lift, and settle. Lift, and settle. Your breathing finds the same rhythm. Your shoulders soften into the bunk. Your hands rest, open and easy. Far out past the harbour wall, the sea is wide and dark and calm. And in here, the water rocks you gently, and gently, and gently down into sleep.` },
];

// Signature mixes built from the live sound layers.
LULL.proMixes = {
  'Thunderstorm': { rain: 0.7, brown: 0.35, wind: 0.25 },
  'Kalahari camp': { fire: 0.45, crickets: 0.35, wind: 0.1 },
  'Harbour night': { ocean: 0.45, drone: 0.25, wind: 0.1 },
  'Forest rain': { rain: 0.45, crickets: 0.18, brown: 0.2 },
  'Deep focus': { brown: 0.5, rain: 0.2 },
};

// Steady: the 7-day follow-on course after Unhook.
LULL.steady = [
  { id: 's1', title: 'After the course', mins: 3, tool: 'journey',
    body: [
      'Finishing Unhook is a real step. You now know the loop, the apple test, HALT and urge surfing. The question is how to keep it going when life gets busy again.',
      'Most people do not slip back because they forget the tools. They slip back because the tools only get used on calm days. Steady is about the hard days: deadlines, family stress, short nights and the long weekend.',
      'Over the next seven days you will build a small, personal plan for those moments, so you are not deciding what to do in the middle of a craving.',
    ],
    tryThis: 'Open your Journey and write down your top trigger and your best swap. That is the start of your plan.' },
  { id: 's2', title: 'Your high-risk times', mins: 3, tool: 'journey',
    body: [
      'Cravings are rarely random. For most people there are two or three moments a week that cause most of the trouble: Sunday evenings, the drive home, the hour after the kids are in bed.',
      'Once you can name those moments, you can plan for them in advance. A snack you actually like, ready at 15:00. A walk booked in after a hard meeting. Supper a little earlier on the nights you work late.',
      'Planning is not about control. It is about making the kind choice the easy choice.',
    ],
    tryThis: 'Name your two highest-risk times this week, and one small thing you will set up before each.' },
  { id: 's3', title: 'If this, then that', mins: 3, tool: 'pause',
    body: [
      'Psychologists call them implementation intentions, but they are just simple "if, then" plans: "If I get home and head for the cupboard, then I will make a cup of tea first."',
      'They work because they hand the decision to your past self, who was calm and thinking clearly. In the moment, you only have to remember one line.',
      'Keep them small and specific. "Eat better" is a wish. "If it is after 20:00 and I want a snack, then I will brush my teeth" is a plan.',
    ],
    tryThis: 'Write one "if, then" plan for your biggest trigger and keep it in your check-in note.' },
  { id: 's4', title: 'Stress before it builds', mins: 3, tool: 'breathe',
    body: [
      'Urge surfing is for when a craving has arrived. But a lot of stress eating starts hours earlier, when stress quietly builds and nobody lets it out.',
      'Short, regular resets keep the level down: a minute of slow breathing between meetings, a walk at lunch, five quiet minutes in the car before going inside.',
      'Think of it like a kettle. If you let off a little steam often, it never gets to the whistle.',
    ],
    tryThis: 'Put three one-minute Quick reset breaks into your day today, before you feel you need them.' },
  { id: 's5', title: 'Food, people and pressure', mins: 3, tool: 'pause',
    body: [
      'Braais, birthdays, office treats and the auntie who insists on seconds. Social eating is part of a good life, and it does not need to be avoided.',
      'What helps is deciding on purpose. Before you arrive, choose what you really want to enjoy. Eat that slowly and fully. Skip what you do not love.',
      'And if you have more than you planned, that is fine. It is one meal among many. The kind voice applies at a party too.',
    ],
    tryThis: 'Before your next social meal, pick the one food you most want to enjoy, and eat it mindfully.' },
  { id: 's6', title: 'Sleep as a habit', mins: 3, tool: 'sleep',
    body: [
      'You learned that short nights make cravings louder. The steady fix is a regular sleep time, not a perfect one.',
      'Your body clock likes routine. Going to bed and getting up at roughly the same time, even on weekends, makes falling asleep easier and keeps hunger hormones calmer the next day.',
      'If you are an hour off most nights, move your bedtime by 15 minutes every few days rather than all at once.',
    ],
    tryThis: 'Set your bedtime on the Sleep dial and keep it within 30 minutes for the next five nights.' },
  { id: 's7', title: 'Your steady plan', mins: 3, tool: 'journey',
    body: [
      'You now have the pieces of a plan: your high-risk times, your "if, then" lines, small daily resets, a way to handle social eating and a regular bedtime.',
      'Put them together in a few lines. Keep it short enough to remember. This is not a rulebook; it is a note from you to you, for the days when things get hard.',
      'You will still have tough weeks. When you do, come back to this plan, to Pause and to the kind voice. That is what being steady means: not never wobbling, but always coming back.',
    ],
    tryThis: 'Write your steady plan in a check-in note. Read it again the next time a hard week starts.' },
];
