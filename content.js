/* Lull content: breathing patterns, the Unhook course, sleep stories, swaps. All original writing. */
window.LULL = {};

LULL.patterns = [
  { id: 'sigh', name: 'Quick reset', tag: 'Fastest calm', desc: 'Two inhales, one long sigh out. The fastest way to take the edge off.', color: '#7fe0c3',
    phases: [['in', 'Breathe in', 2], ['in2', 'Top up', 1], ['out', 'Long sigh out', 6]] },
  { id: 'box', name: 'Box breathing', tag: 'Steady & focused', desc: 'Four equal sides. Used by people who need to stay calm under pressure.', color: '#a99cff',
    phases: [['in', 'Breathe in', 4], ['hold', 'Hold', 4], ['out', 'Breathe out', 4], ['hold2', 'Hold', 4]] },
  { id: '478', name: '4 · 7 · 8', tag: 'For sleep', desc: 'A long hold and slow exhale that tells your body it is safe to switch off.', color: '#8fb6ff',
    phases: [['in', 'Breathe in', 4], ['hold', 'Hold', 7], ['out', 'Breathe out slowly', 8]] },
  { id: 'coherent', name: 'Even breath', tag: 'Balance', desc: 'Slow, even breaths around six a minute. Gentle and easy to keep going.', color: '#ffc59e',
    phases: [['in', 'Breathe in', 5], ['out', 'Breathe out', 5]] },
  { id: 'long', name: 'Longer out', tag: 'Cravings & anxiety', desc: 'Out-breaths longer than in-breaths. Simple, and great in the middle of an urge.', color: '#ff9fb8',
    phases: [['in', 'Breathe in', 4], ['out', 'Breathe out', 6]] },
];

// The Unhook course: 10 short daily lessons on stress eating, stress and sleep.
LULL.lessons = [
  { id: 'l1', title: 'The loop you learned', mins: 3, tool: 'pause',
    body: [
      'Stress eating is not a willpower problem. It is a loop your brain learned because it worked, at least for a few minutes.',
      'It goes like this: something stressful happens (the trigger), you reach for food (the behaviour), and you feel a little relief (the reward). Your brain notices the relief and files it away: "When stressed, eat." Do it enough times and the loop runs on autopilot.',
      'The good news is that loops can be unlearned. Not by fighting harder, but by getting curious about what the loop actually gives you.',
    ],
    tryThis: 'Next time you reach for a snack, just notice: what happened in the 10 minutes before? You do not need to stop. Just notice.' },
  { id: 'l2', title: 'Hunger or hurt?', mins: 3, tool: 'pause',
    body: [
      'Physical hunger and emotional hunger feel different once you know what to look for.',
      'Physical hunger builds slowly. It shows up in your stomach, a lot of different foods would do, and when you have eaten enough you stop and feel fine.',
      'Emotional hunger hits suddenly. It lives in your head and mouth, it wants one specific thing (usually sweet, salty or crunchy), it is hard to stop, and it often leaves guilt behind.',
      'A simple check is the apple test: would an apple, or a plain sandwich, sound good right now? If yes, you may genuinely be hungry, so eat. If only the chocolate will do, something else is probably asking for attention.',
    ],
    tryThis: 'Use the Pause button the next time a craving hits and answer the apple test honestly.' },
  { id: 'l3', title: 'HALT', mins: 2, tool: 'pause',
    body: [
      'Many cravings are really one of four needs in disguise: Hungry, Angry (or anxious), Lonely, or Tired.',
      'Food is quick, cheap and always in the cupboard, so it gets used for all four. But a biscuit cannot fix loneliness, and chips do not make up for a bad night of sleep.',
      'When an urge arrives, ask: am I hungry, angry, lonely or tired? Often just naming the real need makes the craving smaller, and shows you what would actually help.',
    ],
    tryThis: 'Today, check HALT three times: mid-morning, mid-afternoon and after supper.' },
  { id: 'l4', title: 'Surfing the urge', mins: 3, tool: 'surf',
    body: [
      'Urges feel like they will keep growing until you give in. They do not. They behave like waves: they build, they peak, and they pass.',
      'Urge surfing means riding the wave instead of fighting it or obeying it. You breathe, you notice where the craving lives in your body, and you watch it change. Tight jaw? Warm chest? Restless hands?',
      'Every time you surf an urge to the end, you teach your brain that the craving is survivable. The loop gets a little weaker each time.',
    ],
    tryThis: 'Try a 90-second urge surf, even with a small craving. Practise on small waves before the big ones.' },
  { id: 'l5', title: 'Curiosity beats willpower', mins: 3, tool: 'mindful',
    body: [
      'Willpower is like a phone battery: by the end of a stressful day it is flat. Curiosity does not run out.',
      'Try this experiment. Next time you eat a food you crave, eat it slowly and pay close attention. How does the first bite taste? The third? The tenth? Many people find the pleasure drops quickly, and the rest is just autopilot.',
      'When your brain sees the reward clearly, as it really is, it starts to update the value it places on that food on its own. No forcing needed.',
    ],
    tryThis: 'Choose one craved food this week and eat it mindfully, with no phone and no TV.' },
  { id: 'l6', title: 'The kind voice', mins: 3, tool: 'breathe',
    body: [
      'After a binge or a slip, most of us are harsh with ourselves: "You have no self-control. You have ruined everything."',
      'That inner critic feels like it keeps you in line, but it adds stress, and stress is the trigger that started the loop. Shame feeds the cycle.',
      'Try talking to yourself the way you would talk to a good friend: "That was a hard day. You were looking for comfort. That makes sense. Let us try again tomorrow."',
    ],
    tryThis: 'Write one kind sentence to yourself in your check-in note today.' },
  { id: 'l7', title: 'Your stress body', mins: 3, tool: 'breathe',
    body: [
      'Stress is not only a thought. It is a body state: faster heart, shallow breathing, tight shoulders, a mind scanning for danger.',
      'Your breath is the one part of that system you can steer directly. Slow breathing, and especially a long out-breath, nudges your nervous system from "alert" towards "rest".',
      'It does not have to take long. Even one or two minutes of slow breathing can lower that buzzing, on-edge feeling, and with it, the urge to self-soothe with food.',
    ],
    tryThis: 'Do one minute of Quick reset breathing before your next meal.' },
  { id: 'l8', title: 'Sleep and cravings', mins: 3, tool: 'sleep',
    body: [
      'A short night does not only make you tired. It shifts the hormones that run hunger: more of the one that says "eat", less of the one that says "you are full".',
      'Studies have found that sleep-deprived people tend to crave more high-sugar, high-fat foods, and have a harder time resisting them. The brain areas that weigh up "is this worth it?" are working at half power.',
      'So better sleep is one of the most powerful anti-craving tools there is. A wind-down routine, a fixed bedtime and a kitchen that closes after supper all help.',
    ],
    tryThis: 'Tonight, set a "kitchen closed" time and try the wind-down routine on the Sleep tab.' },
  { id: 'l9', title: 'Swap the reward', mins: 3, tool: 'pause',
    body: [
      'Food is doing a job for you when you stress eat. Maybe it gives you a break, comfort, a little pleasure, or something to do with your hands.',
      'The trick is not to remove the reward but to find a better route to it. A break could be a walk round the block. Comfort could be a hot shower or a voice note to a friend. Something to do could be a 5-minute tidy.',
      'Swaps work best when they match the real need. That is why Lull asks HALT questions before suggesting what to do.',
    ],
    tryThis: 'Write down the one swap you would most like to try, and keep it ready for the next urge.' },
  { id: 'l10', title: 'Slips are data', mins: 2, tool: 'journey',
    body: [
      'You will still stress eat sometimes. Everyone does. A slip is not a failure; it is information.',
      'What time was it? What happened before? How did you sleep? Over a few weeks, your Journey tab shows the patterns: maybe it is always 3 pm at work, or after a short night.',
      'Patterns you can see are patterns you can plan for. Keep logging, keep pausing, and be patient with yourself. That is how the loop loosens.',
    ],
    tryThis: 'Look at your Journey tab and find your most common trigger so far.' },
];

// Swap ideas matched to HALT needs.
LULL.swaps = {
  hungry: ['Eat a real snack: a piece of fruit with peanut butter, yoghurt, or a slice of toast.', 'Drink a big glass of water first, then eat something with protein.', 'Have a proper meal, slowly, sitting down.'],
  angry: ['Walk briskly around the block for 5 minutes.', 'Squeeze a pillow or a stress ball hard for 10 seconds, then let go.', 'Write down exactly what made you angry. Then close the notebook.', 'Splash cold water on your face.'],
  lonely: ['Send a voice note to someone you like.', 'Phone a friend or family member, even for two minutes.', 'Step outside and say hi to a neighbour, or go somewhere with people.', 'Cuddle a pet.'],
  tired: ['Take a 15-minute rest with your eyes closed.', 'Go to bed early tonight. The craving is often just tiredness.', 'Have a hot shower and put on comfy clothes.', 'Do a Quick reset breath and step into daylight.'],
  bored: ['Do a 5-minute tidy of one surface.', 'Put on one song and move to it.', 'Make a cup of rooibos tea and drink it slowly.', 'Go outside for a few minutes.'],
};

LULL.surfPrompts = [
  'Notice the urge. Just name it: "this is a craving."',
  'Where do you feel it in your body? Mouth? Chest? Hands?',
  'Let it be there. You do not have to fight it, or obey it.',
  'Breathe into the place where it feels strongest.',
  'Is it getting bigger, smaller, or changing shape?',
  'Urges peak and pass. You are riding this one.',
  'Soften your jaw. Drop your shoulders.',
  'What do you really need right now?',
  'You are still here. The wave is still moving.',
];

LULL.mindfulSteps = [
  'Put a normal portion on a plate. Put the packet away.',
  'Sit down somewhere. No phone, no screen.',
  'Look at it. Smell it. Take one breath.',
  'Take a small bite. Chew slowly. Notice the taste.',
  'Put it down between bites. Notice when the pleasure starts to fade.',
  'Stop when it stops being great. You can always have more later.',
];

// Sleep stories (read aloud with the device voice). Sentences are paced one by one.
LULL.stories = [
  { id: 'karoo', title: 'Rain on the Karoo', mins: 8, sound: { rain: 0.6, wind: 0.15 }, desc: 'A farmhouse, a long dry summer, and the first rain in weeks.',
    text: `It has been a long, hot summer on the farm. The veld has turned the colour of toast, and the windmill has been creaking slowly all afternoon. Now the evening is cooling. You are sitting on the stoep of an old farmhouse, in a wide, comfortable chair, with a blanket over your knees. Far away, over the koppies, the clouds are building. They are tall and grey and soft at the edges. The air smells different now. Earthy. Sweet. The smell of rain that has not arrived yet. A few swallows dip low over the dam. A dog stretches out on the cool stone floor beside you and sighs. You can feel your own breath slowing to match his. The first drop lands on the tin roof. Then another. Then a gentle, steady patter, like fingers drumming softly on a table. The dry ground drinks it in. You do not have to do anything. There is nowhere to go. The rain will water the veld all night without any help from you. Inside, a lamp glows warm and yellow. Your bed is made, with heavy cotton sheets and a thick, soft duvet. You walk slowly to it, and lie down, and listen. The rain keeps its rhythm on the roof. Steady. Soft. Unhurried. Each drop is one less thing to think about. Your shoulders sink into the mattress. Your hands are heavy and warm. Outside, the rain falls across the whole wide Karoo, on the koppies and the dam and the sleeping sheep. And here, under a strong roof, you are warm and dry and safe. Let the sound carry you. There is nothing left to do tonight but rest.` },
  { id: 'train', title: 'The slow night train', mins: 9, sound: { brown: 0.45, drone: 0.15 }, desc: 'A sleeper carriage rolling gently towards the coast.',
    text: `Tonight you are on a slow train heading for the coast. Your compartment is small and cosy, with wood panels and a little lamp beside the bunk. The bed has been turned down for you, with crisp white sheets and a folded wool blanket. You change into soft clothes and slide under the covers. The train rocks gently from side to side. Not much. Just enough to feel like being carried. Through the window, the last of the evening light is fading over wide, empty fields. A farm light glows in the distance and then slips away. The wheels hum along the track, a low, even sound, steady as a heartbeat. Somewhere down the corridor, a door clicks softly shut. Someone laughs quietly and then the carriage is still again. You do not need to watch where you are going. The driver knows the way. The track has been laid for you, mile after mile, all the way to the sea. All you have to do is lie here. You notice your feet, warm under the blanket. Your legs, heavy and loose. Your belly rising and falling slowly. The train passes through a sleeping town. The station lights flicker past, gold, gold, gold, and then darkness again. The rocking continues. Gentle. Patient. You think about the morning: the smell of salt in the air, the sound of waves, a hot cup of coffee on the platform. But that is hours away. For now there is only the hum, the sway, and the dark, quiet country rolling past. Let the train carry you. Let the rhythm rock you down, and down, and down into sleep.` },
  { id: 'lighthouse', title: 'The lighthouse keeper', mins: 8, sound: { ocean: 0.6, wind: 0.2 }, desc: 'Keeping one light burning on a calm night at sea.',
    text: `On a quiet point at the edge of the land there is a lighthouse, white and red, and tonight you are its keeper. The work for the day is done. You have polished the great lens until it shines. You have checked the lamp, and wound the clockwork, and written in the log book in neat handwriting: Wind light. Sea calm. All well. Now you climb the spiral stairs slowly, one step at a time, your hand sliding along the cool iron rail. At the top, the light turns gently above you, sending its long, soft beam out across the water. Round and round. Steady and patient. You sit in your chair by the window with a warm mug of tea. Below, the waves roll in, and draw back. Roll in, and draw back. The sea is breathing, and you find yourself breathing with it. In, as the wave rises. Out, as it sighs onto the sand. Far out on the water, a fishing boat's light glows, and you know that your beam is helping it home. That is enough. One light, kept burning, is enough. The stars are coming out now, more and more of them, until the sky is full. A soft wind moves around the tower, a low, comforting sound. Your eyelids are getting heavy. The lamp will keep turning all night on its own; it has done so for a hundred years. You can rest. You set down your mug. You let your head lean back. The beam turns, the waves roll in and draw back, and you drift, slowly and easily, into a deep and peaceful sleep.` },
  { id: 'bodyscan', title: 'Body scan for sleep', mins: 10, sound: { brown: 0.35 }, desc: 'Release the day, one part of your body at a time.',
    text: `Lie on your back, or in whatever position feels most comfortable. Let your arms rest by your sides. Let your eyes close. Take a slow breath in through your nose, and a long, slow breath out through your mouth. Once more. In, and a long, slow out. Now let your breathing go back to its own rhythm. You do not need to control it. Bring your attention to your feet. Notice how they feel. Warm or cool. Heavy or light. Let them soften, as if they are sinking into the bed. Now your ankles and your calves. Let any tightness there melt away. Your knees. Your thighs. Feel the weight of your legs, fully supported, with nothing to hold up. Now your hips and your lower back. Let them be heavy. Let the bed take all of the weight. Your belly rises and falls with each breath. Let it be soft. There is nothing to hold in. Your chest. Your upper back. Your shoulders, often the place where the day collects. Let your shoulders drop, just a little further, away from your ears. Your arms. Your elbows. Your wrists. Your hands. Let your fingers uncurl. Your neck, long and loose. Your jaw. Let your teeth part slightly. Let your tongue rest. Your cheeks. The little muscles around your eyes. Your forehead, smooth and wide. Now feel your whole body at once, heavy, warm and still. If a thought comes, that is fine. Let it drift past like a cloud, and come back to the feeling of resting. You have done enough for today. There is nothing more you need to do. Just rest. Just breathe. And let sleep come.` },
];

LULL.windDown = [
  { id: 'kitchen', label: 'Kitchen closed', hint: 'Done eating for the day' },
  { id: 'screens', label: 'Screens on dim', hint: 'Night mode on, brightness down' },
  { id: 'lights', label: 'Lights low', hint: 'Lamps instead of overhead lights' },
  { id: 'dump', label: 'Brain dump', hint: 'Get tomorrow out of your head' },
  { id: 'breathe', label: '4·7·8 breathing', hint: 'Three minutes in bed' },
  { id: 'sound', label: 'Sleep sound on', hint: 'Pick a soundscape and a timer' },
];

LULL.sounds = [
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'wind', name: 'Wind', icon: '🍃' },
  { id: 'fire', name: 'Fireplace', icon: '🔥' },
  { id: 'crickets', name: 'Crickets', icon: '🦗' },
  { id: 'brown', name: 'Brown noise', icon: '🟤' },
  { id: 'drone', name: 'Night hum', icon: '🌙' },
];

LULL.quotes = [
  'You do not have to earn rest.',
  'An urge is a wave, not a command.',
  'Curious, not critical.',
  'One slow breath is a good start.',
  'Feelings are visitors. Let them come and go.',
  'Progress, not perfection.',
  'Be the kind voice today.',
];
