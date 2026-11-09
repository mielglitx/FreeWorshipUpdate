import { SongItem, BibleVerse, MediaAsset, ThemeTemplate, ScheduleItem } from '../types/worship';

export const DEFAULT_MEDIA_POOL: MediaAsset[] = [
  {
    id: 'bg-aurora',
    name: 'Heavenly Aurora Drift',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'aurora',
    previewGradient: 'linear-gradient(135deg, #091326 0%, #10375c 45%, #1b6ca8 80%, #0a192f 100%)',
  },
  {
    id: 'bg-warm-worship',
    name: 'Golden Sanctuary Embers',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'warm-worship',
    previewGradient: 'linear-gradient(135deg, #1a0b05 0%, #4a1c09 45%, #8f3d14 80%, #1f0d05 100%)',
  },
  {
    id: 'bg-particles',
    name: 'Celestial Starlight Dust',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'particles',
    previewGradient: 'linear-gradient(135deg, #070714 0%, #171738 50%, #2e1f5e 100%)',
  },
  {
    id: 'bg-deep-ocean',
    name: 'Living Waters Wave',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'deep-ocean',
    previewGradient: 'linear-gradient(135deg, #04151f 0%, #0d3b4c 55%, #146173 100%)',
  },
  {
    id: 'bg-nebula',
    name: 'Majesty Violet Nebula',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'nebula',
    previewGradient: 'linear-gradient(135deg, #12061f 0%, #311042 50%, #5c164e 100%)',
  },
  {
    id: 'bg-royal-gold',
    name: 'Cathedral Radiance',
    category: 'Motion Loop',
    type: 'motion-canvas',
    motionPreset: 'royal-gold',
    previewGradient: 'linear-gradient(135deg, #141106 0%, #3b2d0d 50%, #6b4e16 100%)',
  },
  {
    id: 'bg-slate-minimal',
    name: 'Sermon Slate Dark',
    category: 'Still Background',
    type: 'gradient',
    previewGradient: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 100%)',
  },
  {
    id: 'bg-emerald-grace',
    name: 'Psalms Forest Calm',
    category: 'Still Background',
    type: 'gradient',
    previewGradient: 'linear-gradient(160deg, #051c14 0%, #0b3b2c 50%, #04120d 100%)',
  },
];

export const DEFAULT_THEMES: ThemeTemplate[] = [
  {
    id: 'theme-sanctuary-center',
    name: 'Sanctuary Main (Centered)',
    description: 'High-contrast bold centered lyrics with deep drop shadow for main projectors & LED walls',
    fontFamily: 'display',
    fontSizeScale: 1.05,
    textAlign: 'center',
    verticalAlign: 'center',
    uppercase: false,
    textShadow: 'strong',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    lowerThirdBand: false,
  },
  {
    id: 'theme-scripture-classic',
    name: 'Scripture Reading (Serif)',
    description: 'Editorial serif typography with verse reference callout bar',
    fontFamily: 'serif',
    fontSizeScale: 0.96,
    textAlign: 'left',
    verticalAlign: 'center',
    uppercase: false,
    textShadow: 'strong',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    lowerThirdBand: false,
  },
  {
    id: 'theme-broadcast-lower',
    name: 'Broadcast Lower-Thirds',
    description: 'Bottom-anchored 2-line translucent bar for hybrid projector + livestream cameras',
    fontFamily: 'sans',
    fontSizeScale: 0.88,
    textAlign: 'center',
    verticalAlign: 'bottom',
    uppercase: true,
    textShadow: 'box',
    textColor: '#ffffff',
    accentColor: '#f59e0b',
    lowerThirdBand: true,
  },
  {
    id: 'theme-modern-caps',
    name: 'Modern Arena All-Caps',
    description: 'Tracked-out uppercase sans-serif with crisp stroke outline',
    fontFamily: 'display',
    fontSizeScale: 1.0,
    textAlign: 'center',
    verticalAlign: 'center',
    uppercase: true,
    textShadow: 'outline',
    textColor: '#ffffff',
    accentColor: '#a78bfa',
    lowerThirdBand: false,
  },
];

export const DEFAULT_SONGS: SongItem[] = [
  {
    id: 'song-amazing-grace',
    title: 'Amazing Grace (Chains Are Gone)',
    author: 'John Newton / Traditional',
    ccliNumber: '22025',
    musicalKey: 'G',
    bpm: 72,
    defaultBackgroundId: 'bg-warm-worship',
    slides: [
      {
        id: 'ag-v1',
        tag: 'Verse 1',
        lines: [
          'Amazing grace how sweet the sound',
          'That saved a wretch like me',
          'I once was lost, but now am found',
          'Was blind, but now I see',
        ],
        chords: 'G   | C/G  | G   | D/F#',
      },
      {
        id: 'ag-v2',
        tag: 'Verse 2',
        lines: [
          "'Twas grace that taught my heart to fear",
          'And grace my fears relieved',
          'How precious did that grace appear',
          'The hour I first believed',
        ],
        chords: 'G   | C/G  | Em  | D   G',
      },
      {
        id: 'ag-c1',
        tag: 'Chorus',
        lines: [
          'My chains are gone, I’ve been set free',
          'My God, my Savior has ransomed me',
          'And like a flood His mercy reigns',
          'Unending love, amazing grace',
        ],
        chords: 'C/G | G   | C/G | D   G',
      },
      {
        id: 'ag-v3',
        tag: 'Verse 3',
        lines: [
          'The Lord has promised good to me',
          'His word my hope secures',
          'He will my shield and portion be',
          'As long as life endures',
        ],
        chords: 'G   | C/G  | G/B | D   G',
      },
      {
        id: 'ag-v4',
        tag: 'Verse 4',
        lines: [
          'When we’ve been there ten thousand years',
          'Bright shining as the sun',
          'We’ve no less days to sing God’s praise',
          'Than when we’d first begun',
        ],
        chords: 'G   | C    | G   | D   G',
      },
    ],
  },
  {
    id: 'song-way-in-wilderness',
    title: 'God of Revival & Light',
    author: 'FreeWorship Original Praise',
    ccliNumber: '7100492',
    musicalKey: 'Bb',
    bpm: 68,
    defaultBackgroundId: 'bg-aurora',
    slides: [
      {
        id: 'gr-v1',
        tag: 'Verse 1',
        lines: [
          'You are here, moving in our midst',
          'We worship You, we worship You',
          'You are here, working in this place',
          'We worship You, Lord we worship You',
        ],
        chords: 'Eb  | Bb   | F   | Gm',
      },
      {
        id: 'gr-c1',
        tag: 'Chorus',
        lines: [
          'Maker of heaven, Healer of hearts',
          'Promise Keeper, Light in the dark',
          'My God, that is who You are',
          'My God, that is who You are',
        ],
        chords: 'Eb  | Bb   | F/A | Gm',
      },
      {
        id: 'gr-v2',
        tag: 'Verse 2',
        lines: [
          'You are here, turning lives around',
          'We worship You, we worship You',
          'You are here, healing every heart',
          'We worship You, Lord we worship You',
        ],
        chords: 'Eb  | Bb   | F   | Gm',
      },
      {
        id: 'gr-b1',
        tag: 'Bridge',
        lines: [
          'Even when I don’t see it, You’re working',
          'Even when I don’t feel it, You’re working',
          'You never stop, You never stop working',
          'You never stop, You never stop working',
        ],
        chords: 'Eb  | F    | Gm  | Bb/D',
      },
      {
        id: 'gr-tag',
        tag: 'Tag',
        lines: [
          'That is who You are',
          'Forever faithful, forever strong',
        ],
        chords: 'Eb  | F    | Gm',
      },
    ],
  },
  {
    id: 'song-holy-holy-holy',
    title: 'Holy, Holy, Holy',
    author: 'Reginald Heber / John B. Dykes',
    ccliNumber: '1156',
    musicalKey: 'D',
    bpm: 76,
    defaultBackgroundId: 'bg-royal-gold',
    slides: [
      {
        id: 'hh-v1',
        tag: 'Verse 1',
        lines: [
          'Holy, holy, holy! Lord God Almighty!',
          'Early in the morning our song shall rise to Thee;',
          'Holy, holy, holy, merciful and mighty!',
          'God in three Persons, blessed Trinity!',
        ],
        chords: 'D  Bm | A  D | G  D | A  D',
      },
      {
        id: 'hh-v2',
        tag: 'Verse 2',
        lines: [
          'Holy, holy, holy! All the saints adore Thee,',
          'Casting down their golden crowns around the glassy sea;',
          'Cherubim and seraphim falling down before Thee,',
          'Which wert, and art, and evermore shalt be.',
        ],
        chords: 'D  Bm | A  D | G  D | A  D',
      },
      {
        id: 'hh-v3',
        tag: 'Verse 3',
        lines: [
          'Holy, holy, holy! Though the darkness hide Thee,',
          'Though the eye of sinful man Thy glory may not see;',
          'Only Thou art holy; there is none beside Thee,',
          'Perfect in power, in love, and purity.',
        ],
        chords: 'D  Bm | A  D | G  D | A  D',
      },
      {
        id: 'hh-v4',
        tag: 'Verse 4',
        lines: [
          'Holy, holy, holy! Lord God Almighty!',
          'All Thy works shall praise Thy name in earth and sky and sea;',
          'Holy, holy, holy, merciful and mighty!',
          'God in three Persons, blessed Trinity!',
        ],
        chords: 'D  Bm | A  D | G  D | A  D',
      },
      {
        id: 'hh-c1',
        tag: 'Chorus',
        lines: [
          'Holy, holy, holy is the Lord God Almighty',
          'Who was and is and is to come',
          'With all creation I sing praise to the King of kings',
          'You are my everything and I will adore You',
        ],
        chords: 'G  A  | D  Bm | G  A | D',
      },
    ],
  },
  {
    id: 'song-to-god-be-the-glory',
    title: 'To God Be The Glory',
    author: 'Fanny J. Crosby / William H. Doane',
    ccliNumber: '23426',
    musicalKey: 'G',
    bpm: 104,
    defaultBackgroundId: 'bg-royal-gold',
    slides: [
      {
        id: 'tgbg-v1',
        tag: 'Verse 1',
        lines: [
          'To God be the glory, great things He hath done!',
          'So loved He the world that He gave us His Son,',
          'Who yielded His life an atonement for sin,',
          'And opened the lifegate that all may go in.',
        ],
        chords: 'G  | D7 | G  | A7  D',
      },
      {
        id: 'tgbg-c1',
        tag: 'Chorus',
        lines: [
          'Praise the Lord, praise the Lord, let the earth hear His voice!',
          'Praise the Lord, praise the Lord, let the people rejoice!',
          'O come to the Father through Jesus the Son,',
          'And give Him the glory, great things He hath done!',
        ],
        chords: 'G  | D7 | G  | C  G  D7  G',
      },
      {
        id: 'tgbg-v2',
        tag: 'Verse 2',
        lines: [
          'O perfect redemption, the purchase of blood,',
          'To every believer the promise of God;',
          'The vilest offender who truly believes,',
          'That moment from Jesus a pardon receives.',
        ],
        chords: 'G  | D7 | G  | A7  D',
      },
      {
        id: 'tgbg-v3',
        tag: 'Verse 3',
        lines: [
          'Great things He hath taught us, great things He hath done,',
          'And great our rejoicing through Jesus the Son;',
          'But purer, and higher, and greater will be',
          'Our wonder, our transport, when Jesus we see.',
        ],
        chords: 'G  | D7 | G  | A7  D',
      },
    ],
  },
  {
    id: 'song-wonderful-grace-of-jesus',
    title: 'Wonderful Grace of Jesus',
    author: 'Haldor Lillenas',
    ccliNumber: '17255',
    musicalKey: 'C',
    bpm: 100,
    defaultBackgroundId: 'bg-warm-worship',
    slides: [
      {
        id: 'wgj-v1',
        tag: 'Verse 1',
        lines: [
          'Wonderful grace of Jesus, greater than all my sin;',
          'How shall my tongue describe it, where shall its praise begin?',
          'Taking away my burden, setting my spirit free;',
          'For the wonderful grace of Jesus reaches me.',
        ],
        chords: 'C  | G7 | C  | F  C  G7  C',
      },
      {
        id: 'wgj-c1',
        tag: 'Chorus',
        lines: [
          'Wonderful the matchless grace of Jesus,',
          'Deeper than the mighty rolling sea;',
          'Higher than the mountain, sparkling like a fountain,',
          'All-sufficient grace for even me!',
          'Broader than the scope of my transgressions,',
          'Greater far than all my sin and shame;',
          'O magnify the precious name of Jesus,',
          'Praise His name!',
        ],
        chords: 'F  | C  | G7 | C',
      },
      {
        id: 'wgj-v2',
        tag: 'Verse 2',
        lines: [
          'Wonderful grace of Jesus, reaching to all the lost,',
          'By it I have been pardoned, saved to the uttermost;',
          'Chains have been torn asunder, giving us liberty;',
          'For the wonderful grace of Jesus reaches me.',
        ],
        chords: 'C  | G7 | C  | F  C  G7  C',
      },
      {
        id: 'wgj-v3',
        tag: 'Verse 3',
        lines: [
          'Wonderful grace of Jesus, reaching the most defiled,',
          'By its transforming power, making him God’s own child,',
          'Purchasing peace and heaven, for all eternity;',
          'And the wonderful grace of Jesus reaches me.',
        ],
        chords: 'C  | G7 | C  | F  C  G7  C',
      },
    ],
  },
  {
    id: 'song-battle-hymn-republic',
    title: 'The Battle Hymn of Republic',
    author: 'Julia Ward Howe / William Steffe',
    ccliNumber: '28638',
    musicalKey: 'Bb',
    bpm: 88,
    defaultBackgroundId: 'bg-aurora',
    slides: [
      {
        id: 'bhr-v1',
        tag: 'Verse 1',
        lines: [
          'Mine eyes have seen the glory of the coming of the Lord;',
          'He is trampling out the vintage where the grapes of wrath are stored;',
          'He hath loosed the fateful lightning of His terrible swift sword;',
          'His truth is marching on.',
        ],
        chords: 'Bb | Eb | Bb | F7  Bb',
      },
      {
        id: 'bhr-c1',
        tag: 'Chorus',
        lines: [
          'Glory, glory, hallelujah!',
          'Glory, glory, hallelujah!',
          'Glory, glory, hallelujah!',
          'His truth is marching on.',
        ],
        chords: 'Bb | Eb | Bb | F7  Bb',
      },
      {
        id: 'bhr-v2',
        tag: 'Verse 2',
        lines: [
          'I have seen Him in the watchfires of a hundred circling camps;',
          'They have builded Him an altar in the evening dews and damps;',
          'I can read His righteous sentence by the dim and flaring lamps;',
          'His day is marching on.',
        ],
        chords: 'Bb | Eb | Bb | F7  Bb',
      },
      {
        id: 'bhr-v3',
        tag: 'Verse 3',
        lines: [
          'He has sounded forth the trumpet that shall never call retreat;',
          'He is sifting out the hearts of men before His judgment seat;',
          'O be swift, my soul, to answer Him; be jubilant, my feet!',
          'Our God is marching on.',
        ],
        chords: 'Bb | Eb | Bb | F7  Bb',
      },
      {
        id: 'bhr-v4',
        tag: 'Verse 4',
        lines: [
          'In the beauty of the lilies Christ was born across the sea,',
          'With a glory in His bosom that transfigures you and me;',
          'As He died to make men holy, let us live to make men free,',
          'While God is marching on.',
        ],
        chords: 'Bb | Eb | Bb | F7  Bb',
      },
    ],
  },
  {
    id: 'song-love-lifted-me',
    title: 'Love Lifted Me',
    author: 'James Rowe / Howard E. Smith',
    ccliNumber: '29871',
    musicalKey: 'Bb',
    bpm: 96,
    defaultBackgroundId: 'bg-deep-ocean',
    slides: [
      {
        id: 'llm-v1',
        tag: 'Verse 1',
        lines: [
          'I was sinking deep in sin, far from the peaceful shore,',
          'Very deeply stained within, sinking to rise no more;',
          'But the Master of the sea heard my despairing cry,',
          'From the waters lifted me, now safe am I.',
        ],
        chords: 'Bb | F7 | Bb  Eb | Bb  F7  Bb',
      },
      {
        id: 'llm-c1',
        tag: 'Chorus',
        lines: [
          'Love lifted me! Love lifted me!',
          'When nothing else could help, love lifted me.',
          'Love lifted me! Love lifted me!',
          'When nothing else could help, love lifted me.',
        ],
        chords: 'Bb | F7 | Bb  Eb | Bb  F7  Bb',
      },
      {
        id: 'llm-v2',
        tag: 'Verse 2',
        lines: [
          'All my heart to Him I give, ever to Him I’ll cling,',
          'In His blessed presence live, ever His praises sing;',
          'Love so mighty and so true merits my soul’s best songs;',
          'Faithful, loving service, too, to Him belongs.',
        ],
        chords: 'Bb | F7 | Bb  Eb | Bb  F7  Bb',
      },
      {
        id: 'llm-v3',
        tag: 'Verse 3',
        lines: [
          'Souls in danger, look above, Jesus completely saves;',
          'He will lift you by His love out of the angry waves;',
          'He’s the Master of the sea, billows His will obey;',
          'He your Savior wants to be, be saved today.',
        ],
        chords: 'Bb | F7 | Bb  Eb | Bb  F7  Bb',
      },
    ],
  },
  {
    id: 'song-stand-up-for-jesus',
    title: 'Stand up, Stand up for Jesus',
    author: 'George Duffield Jr. / George J. Webb',
    ccliNumber: '39433',
    musicalKey: 'Bb',
    bpm: 104,
    defaultBackgroundId: 'bg-royal-gold',
    slides: [
      {
        id: 'suj-v1',
        tag: 'Verse 1',
        lines: [
          'Stand up, stand up for Jesus, ye soldiers of the cross;',
          'Lift high His royal banner, it must not suffer loss.',
          'From victory unto victory His army shall He lead,',
          'Till every foe is vanquished, and Christ is Lord indeed.',
        ],
        chords: 'Bb | Eb  Bb | F  Bb | Eb  F7  Bb',
      },
      {
        id: 'suj-v2',
        tag: 'Verse 2',
        lines: [
          'Stand up, stand up for Jesus, the trumpet call obey;',
          'Forth to the mighty conflict, in this His glorious day.',
          'Ye that are men now serve Him against unnumbered foes;',
          'Let courage rise with danger, and strength to strength oppose.',
        ],
        chords: 'Bb | Eb  Bb | F  Bb | Eb  F7  Bb',
      },
      {
        id: 'suj-v3',
        tag: 'Verse 3',
        lines: [
          'Stand up, stand up for Jesus, stand in His strength alone;',
          'The arm of flesh will fail you, ye dare not trust your own.',
          'Put on the Gospel armor, each piece put on with prayer;',
          'Where duty calls or danger, be never wanting there.',
        ],
        chords: 'Bb | Eb  Bb | F  Bb | Eb  F7  Bb',
      },
      {
        id: 'suj-v4',
        tag: 'Verse 4',
        lines: [
          'Stand up, stand up for Jesus, the strife will not be long;',
          'This day the noise of battle, the next the victor’s song.',
          'To him that overcometh a crown of life shall be;',
          'He with the King of Glory shall reign eternally.',
        ],
        chords: 'Bb | Eb  Bb | F  Bb | Eb  F7  Bb',
      },
    ],
  },
  {
    id: 'song-banner-of-the-cross',
    title: 'The Banner of The Cross',
    author: 'Daniel W. Whittle / James McGranahan',
    ccliNumber: '47621',
    musicalKey: 'G',
    bpm: 108,
    defaultBackgroundId: 'bg-royal-gold',
    slides: [
      {
        id: 'botc-v1',
        tag: 'Verse 1',
        lines: [
          'There’s a royal banner given for display',
          'To the soldiers of the King;',
          'As an ensign fair we lift it up today,',
          'While as ransomed ones we sing.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
      {
        id: 'botc-c1',
        tag: 'Chorus',
        lines: [
          'Marching on, marching on,',
          'For Christ count everything but loss!',
          'And to crown Him King, toil and sing,',
          '’Neath the banner of the cross!',
        ],
        chords: 'G | D7 | G | C  G  D7  G',
      },
      {
        id: 'botc-v2',
        tag: 'Verse 2',
        lines: [
          'Though the foe may rage and gather as the flood,',
          'Let the standard be displayed;',
          'And beneath its folds as soldiers of the Lord,',
          'For the truth be not dismayed.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
      {
        id: 'botc-v3',
        tag: 'Verse 3',
        lines: [
          'Over land and sea, wherever man may dwell,',
          'Make the glorious tidings known;',
          'Of the crimson banner now the story tell,',
          'While the Lord shall claim His own.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
      {
        id: 'botc-v4',
        tag: 'Verse 4',
        lines: [
          'When the great Commander from the vaulted sky',
          'Sounds the resurrection day,',
          'Then before His throne with victory we’ll cry,',
          'As our arms we cast away.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
    ],
  },
  {
    id: 'song-the-fight-is-on',
    title: 'The Fight is On',
    author: 'C. H. Morris',
    ccliNumber: '58129',
    musicalKey: 'Bb',
    bpm: 112,
    defaultBackgroundId: 'bg-aurora',
    slides: [
      {
        id: 'tfio-v1',
        tag: 'Verse 1',
        lines: [
          'The fight is on, the trumpet sound is ringing out,',
          'The cry to arms is heard afar and near;',
          'The Lord of hosts is marching on to victory,',
          'The triumph of the Christ will soon appear.',
        ],
        chords: 'Bb | F7 | Bb | C7  F',
      },
      {
        id: 'tfio-c1',
        tag: 'Chorus',
        lines: [
          'The fight is on, O Christian soldier,',
          'And face to face in stern array,',
          'With armor gleaming, and colors streaming,',
          'The right and wrong engage today!',
          'The fight is on, but be not weary;',
          'Be strong, and in His might hold fast;',
          'If God be for us, His banner o’er us,',
          'We’ll sing the victor’s song at last!',
        ],
        chords: 'Bb | F7 | Bb | Eb  Bb  F7  Bb',
      },
      {
        id: 'tfio-v2',
        tag: 'Verse 2',
        lines: [
          'The fight is on, arouse, ye soldiers brave and true!',
          'Jehovah leads, and victory will assure;',
          'Go buckle on the armor God has given you,',
          'And in His strength unto the end endure.',
        ],
        chords: 'Bb | F7 | Bb | C7  F',
      },
      {
        id: 'tfio-v3',
        tag: 'Verse 3',
        lines: [
          'The Lord is leading on to certain victory,',
          'The bow of promise spans the vaulted sky;',
          'His glorious name in every land shall honored be,',
          'The morn will break, the dawn of peace is nigh.',
        ],
        chords: 'Bb | F7 | Bb | C7  F',
      },
    ],
  },
  {
    id: 'song-victory-in-jesus',
    title: 'Victory in Jesus',
    author: 'E. M. Bartlett',
    ccliNumber: '62887',
    musicalKey: 'G',
    bpm: 96,
    defaultBackgroundId: 'bg-warm-worship',
    slides: [
      {
        id: 'vij-v1',
        tag: 'Verse 1',
        lines: [
          'I heard an old, old story, how a Savior came from glory,',
          'How He gave His life on Calvary to save a wretch like me;',
          'I heard about His groaning, of His precious blood’s atoning,',
          'Then I repented of my sins and won the victory.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
      {
        id: 'vij-c1',
        tag: 'Chorus',
        lines: [
          'O victory in Jesus, my Savior forever!',
          'He sought me and bought me with His redeeming blood;',
          'He loved me ere I knew Him, and all my love is due Him;',
          'He plunged me to victory beneath the cleansing flood.',
        ],
        chords: 'G | C | G  Em | C  G  D7  G',
      },
      {
        id: 'vij-v2',
        tag: 'Verse 2',
        lines: [
          'I heard about His healing, of His cleansing pow’r revealing,',
          'How He made the lame to walk again and caused the blind to see;',
          'And then I cried, “Dear Jesus, come and heal my broken spirit,”',
          'And somehow Jesus came and brought to me the victory.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
      {
        id: 'vij-v3',
        tag: 'Verse 3',
        lines: [
          'I heard about a mansion He has built for me in glory,',
          'And I heard about the streets of gold beyond the crystal sea;',
          'About the angels singing and the old redemption story,',
          'And some sweet day I’ll sing up there the song of victory.',
        ],
        chords: 'G | C | G  Em | A7  D',
      },
    ],
  },
  {
    id: 'song-10000-reasons',
    title: 'Bless the Lord, O My Soul',
    author: 'Traditional / Modern Doxology',
    ccliNumber: '6016351',
    musicalKey: 'C',
    bpm: 73,
    defaultBackgroundId: 'bg-particles',
    slides: [
      {
        id: 'bl-c1',
        tag: 'Chorus',
        lines: [
          'Bless the Lord, O my soul, O my soul',
          'Worship His holy name',
          'Sing like never before, O my soul',
          'I’ll worship Your holy name',
        ],
        chords: 'F  C | G  Am | F  C | G  C',
      },
      {
        id: 'bl-v1',
        tag: 'Verse 1',
        lines: [
          'The sun comes up, it’s a new day dawning',
          'It’s time to sing Your song again',
          'Whatever may pass and whatever lies before me',
          'Let me be singing when the evening comes',
        ],
        chords: 'F  C | G  Am | F  C | G  C',
      },
      {
        id: 'bl-v2',
        tag: 'Verse 2',
        lines: [
          'You’re rich in love and You’re slow to anger',
          'Your name is great and Your heart is kind',
          'For all Your goodness I will keep on singing',
          'Ten thousand reasons for my heart to find',
        ],
        chords: 'F  C | G  Am | F  C | G  C',
      },
      {
        id: 'bl-v3',
        tag: 'Verse 3',
        lines: [
          'And on that day when my strength is failing',
          'The end draws near and my time has come',
          'Still my soul will sing Your praise unending',
          'Ten thousand years and then forevermore',
        ],
        chords: 'F  C | G  Am | F  C | G  C',
      },
    ],
  },
  {
    "id": "song-in-the-garden",
    "title": "In The Garden",
    "author": "C. Austin Miles (1912)",
    "ccliNumber": "62505",
    "musicalKey": "Ab",
    "bpm": 84,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "itg-v1",
        "tag": "Verse 1",
        "lines": [
          "I come to the garden alone",
          "While the dew is still on the roses",
          "And the voice I hear falling on my ear",
          "The Son of God discloses"
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      },
      {
        "id": "itg-c1",
        "tag": "Chorus",
        "lines": [
          "And He walks with me, and He talks with me",
          "And He tells me I am His own",
          "And the joy we share as we tarry there",
          "None other has ever known"
        ],
        "chords": "Ab | Eb7 | Ab | Db Eb7 Ab"
      },
      {
        "id": "itg-v2",
        "tag": "Verse 2",
        "lines": [
          "He speaks, and the sound of His voice",
          "Is so sweet the birds hush their singing",
          "And the melody that He gave to me",
          "Within my heart is ringing"
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      },
      {
        "id": "itg-v3",
        "tag": "Verse 3",
        "lines": [
          "I’d stay in the garden with Him",
          "Though the night around me be falling",
          "But He bids me go; through the voice of woe",
          "His voice to me is calling"
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      }
    ]
  },
  {
    "id": "song-he-lives",
    "title": "He Lives",
    "author": "Alfred H. Ackley (1933)",
    "ccliNumber": "17597",
    "musicalKey": "Bb",
    "bpm": 108,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "hl-v1",
        "tag": "Verse 1",
        "lines": [
          "I serve a risen Savior, He’s in the world today",
          "I know that He is living, whatever men may say",
          "I see His hand of mercy, I hear His voice of cheer",
          "And just the time I need Him He’s always near"
        ],
        "chords": "Bb | Eb Bb | F7 | C7 F7"
      },
      {
        "id": "hl-c1",
        "tag": "Chorus",
        "lines": [
          "He lives! He lives! Christ Jesus lives today!",
          "He walks with me and talks with me along life’s narrow way",
          "He lives! He lives! Salvation to impart!",
          "You ask me how I know He lives? He lives within my heart"
        ],
        "chords": "Bb | Eb Bb | G7 C7 | F7 Bb"
      },
      {
        "id": "hl-v2",
        "tag": "Verse 2",
        "lines": [
          "In all the world around me I see His loving care",
          "And though my heart grows weary, I never will despair",
          "I know that He is leading through all the stormy blast",
          "The day of His appearing will come at last"
        ],
        "chords": "Bb | Eb Bb | F7 | C7 F7"
      },
      {
        "id": "hl-v3",
        "tag": "Verse 3",
        "lines": [
          "Rejoice, rejoice, O Christian! Lift up your voice and sing",
          "Eternal hallelujahs to Jesus Christ, the King!",
          "The Hope of all who seek Him, the Help of all who find",
          "None other is so loving, so good and kind"
        ],
        "chords": "Bb | Eb Bb | F7 | C7 F7"
      }
    ]
  },
  {
    "id": "song-at-the-cross",
    "title": "At the cross",
    "author": "Isaac Watts / Ralph E. Hudson (1885)",
    "ccliNumber": "29499",
    "musicalKey": "E",
    "bpm": 88,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "atc-v1",
        "tag": "Verse 1",
        "lines": [
          "Alas! and did my Savior bleed,",
          "And did my Sovereign die?",
          "Would He devote that sacred head",
          "For such a worm as I?"
        ],
        "chords": "E | A | E | B7 E"
      },
      {
        "id": "atc-c1",
        "tag": "Chorus",
        "lines": [
          "At the cross, at the cross where I first saw the light,",
          "And the burden of my heart rolled away,",
          "It was there by faith I received my sight,",
          "And now I am happy all the day!"
        ],
        "chords": "E | B7 | E A | B7 E"
      },
      {
        "id": "atc-v2",
        "tag": "Verse 2",
        "lines": [
          "Was it for crimes that I had done",
          "He groaned upon the tree?",
          "Amazing pity! grace unknown!",
          "And love beyond degree!"
        ],
        "chords": "E | A | E | B7 E"
      },
      {
        "id": "atc-v3",
        "tag": "Verse 3",
        "lines": [
          "Well might the sun in darkness hide,",
          "And shut his glories in,",
          "When Christ, the mighty Maker, died",
          "For man the creature’s sin."
        ],
        "chords": "E | A | E | B7 E"
      },
      {
        "id": "atc-v4",
        "tag": "Verse 4",
        "lines": [
          "But drops of grief can ne’er repay",
          "The debt of love I owe:",
          "Here, Lord, I give myself away,",
          "’Tis all that I can do."
        ],
        "chords": "E | A | E | B7 E"
      }
    ]
  },
  {
    "id": "song-at-calvary",
    "title": "At Calvary",
    "author": "William R. Newell / Daniel B. Towner (1895)",
    "ccliNumber": "27237",
    "musicalKey": "C",
    "bpm": 100,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "ac-v1",
        "tag": "Verse 1",
        "lines": [
          "Years I spent in vanity and pride,",
          "Caring not my Lord was crucified,",
          "Knowing not it was for me He died",
          "On Calvary."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "ac-c1",
        "tag": "Chorus",
        "lines": [
          "Mercy there was great, and grace was free;",
          "Pardon there was multiplied to me;",
          "There my burdened soul found liberty",
          "At Calvary."
        ],
        "chords": "F | C | G7 | C"
      },
      {
        "id": "ac-v2",
        "tag": "Verse 2",
        "lines": [
          "By God’s Word at last my sin I learned;",
          "Then I trembled at the law I’d spurned,",
          "Till my guilty soul imploring turned",
          "To Calvary."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "ac-v3",
        "tag": "Verse 3",
        "lines": [
          "Now I’ve giv’n to Jesus ev’rything,",
          "Now I gladly own Him as my King,",
          "Now my raptured soul can only sing",
          "Of Calvary!"
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "ac-v4",
        "tag": "Verse 4",
        "lines": [
          "Oh, the love that drew salvation’s plan!",
          "Oh, the grace that brought it down to man!",
          "Oh, the mighty gulf that God did span",
          "At Calvary!"
        ],
        "chords": "C | G7 | C | G7 C"
      }
    ]
  },
  {
    "id": "song-because-he-lives",
    "title": "Because He Lives",
    "author": "Bill & Gloria Gaither (1971)",
    "ccliNumber": "16880",
    "musicalKey": "Ab",
    "bpm": 80,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "bhl-v1",
        "tag": "Verse 1",
        "lines": [
          "God sent His Son, they called Him Jesus;",
          "He came to love, heal and forgive.",
          "He lived and died to buy my pardon;",
          "An empty grave is there to prove my Savior lives."
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      },
      {
        "id": "bhl-c1",
        "tag": "Chorus",
        "lines": [
          "Because He lives, I can face tomorrow;",
          "Because He lives, all fear is gone;",
          "Because I know He holds the future,",
          "And life is worth the living just because He lives."
        ],
        "chords": "Ab | Db | Ab Fm | Bbm Eb7 Ab"
      },
      {
        "id": "bhl-v2",
        "tag": "Verse 2",
        "lines": [
          "How sweet to hold a newborn baby,",
          "And feel the pride and joy he gives;",
          "But greater still the calm assurance:",
          "This child can face uncertain days because He lives."
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      },
      {
        "id": "bhl-v3",
        "tag": "Verse 3",
        "lines": [
          "And then one day, I’ll cross the river;",
          "I’ll fight life’s final war with pain.",
          "And then, as death gives way to victory,",
          "I’ll see the lights of glory and I’ll know He reigns."
        ],
        "chords": "Ab | Db | Ab | Eb7 Ab"
      }
    ]
  },
  {
    "id": "song-beulah-land",
    "title": "Beulah Land",
    "author": "Edgar P. Stites / John R. Sweney (1876)",
    "ccliNumber": "66087",
    "musicalKey": "G",
    "bpm": 96,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "bld-v1",
        "tag": "Verse 1",
        "lines": [
          "I’ve reached the land of corn and wine,",
          "And all its riches freely mine;",
          "Here shines undimmed one blissful day,",
          "For all my night has passed away."
        ],
        "chords": "G | D7 | G | C D7 G"
      },
      {
        "id": "bld-c1",
        "tag": "Chorus",
        "lines": [
          "O Beulah Land, sweet Beulah Land,",
          "As on thy highest mount I stand,",
          "I look away across the sea,",
          "Where mansions are prepared for me,",
          "And view the shining glory shore,",
          "My heav’n, my home forevermore!"
        ],
        "chords": "D7 G | D7 G | C G | D7 G"
      },
      {
        "id": "bld-v2",
        "tag": "Verse 2",
        "lines": [
          "My Savior comes and walks with me,",
          "And sweet communion here have we;",
          "He gently leads me with His hand,",
          "For this is Heaven’s borderland."
        ],
        "chords": "G | D7 | G | C D7 G"
      },
      {
        "id": "bld-v3",
        "tag": "Verse 3",
        "lines": [
          "A sweet perfume upon the breeze",
          "Is borne from ever-vernal trees,",
          "And flow’rs that, never fading, grow",
          "Where streams of life forever flow."
        ],
        "chords": "G | D7 | G | C D7 G"
      }
    ]
  },
  {
    "id": "song-i-stand-amazed",
    "title": "I stand amaze",
    "author": "Charles H. Gabriel (1905)",
    "ccliNumber": "25297",
    "musicalKey": "Ab",
    "bpm": 88,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "isa-v1",
        "tag": "Verse 1",
        "lines": [
          "I stand amazed in the presence",
          "Of Jesus the Nazarene,",
          "And wonder how He could love me,",
          "A sinner, condemned, unclean."
        ],
        "chords": "Ab | Eb7 | Ab Db | Ab Eb7 Ab"
      },
      {
        "id": "isa-c1",
        "tag": "Chorus",
        "lines": [
          "How marvelous! how wonderful!",
          "And my song shall ever be:",
          "How marvelous! how wonderful",
          "Is my Savior’s love for me!"
        ],
        "chords": "Eb7 | Ab | Db Ab | Eb7 Ab"
      },
      {
        "id": "isa-v2",
        "tag": "Verse 2",
        "lines": [
          "For me it was in the garden",
          "He prayed: “Not My will, but Thine.”",
          "He had no tears for His own griefs,",
          "But sweat drops of blood for mine."
        ],
        "chords": "Ab | Eb7 | Ab Db | Ab Eb7 Ab"
      },
      {
        "id": "isa-v3",
        "tag": "Verse 3",
        "lines": [
          "He took my sins and my sorrows,",
          "He made them His very own;",
          "He bore the burden to Calv’ry,",
          "And suffered and died alone."
        ],
        "chords": "Ab | Eb7 | Ab Db | Ab Eb7 Ab"
      },
      {
        "id": "isa-v4",
        "tag": "Verse 4",
        "lines": [
          "When with the ransomed in glory",
          "His face I at last shall see,",
          "’Twill be my joy through the ages",
          "To sing of His love for me."
        ],
        "chords": "Ab | Eb7 | Ab Db | Ab Eb7 Ab"
      }
    ]
  },
  {
    "id": "song-now-i-belong-to-jesus",
    "title": "Now I belong to Jesus",
    "author": "Norman J. Clayton (1938)",
    "ccliNumber": "10048",
    "musicalKey": "Eb",
    "bpm": 84,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "nibj-v1",
        "tag": "Verse 1",
        "lines": [
          "Jesus, my Lord will love me forever,",
          "From Him no pow’r of evil can sever,",
          "He gave His life to ransom my soul;",
          "Now I belong to Him!"
        ],
        "chords": "Eb | Ab | Eb Bb7 | Eb"
      },
      {
        "id": "nibj-c1",
        "tag": "Chorus",
        "lines": [
          "Now I belong to Jesus,",
          "Jesus belongs to me,",
          "Not for the years of time alone,",
          "But for eternity!"
        ],
        "chords": "Eb | Bb7 | Eb Ab | Eb Bb7 Eb"
      },
      {
        "id": "nibj-v2",
        "tag": "Verse 2",
        "lines": [
          "Once I was lost in sin’s degradation,",
          "Jesus came down to bring me salvation,",
          "Lifted me up from the sorr’wing and shame;",
          "Now I belong to Him!"
        ],
        "chords": "Eb | Ab | Eb Bb7 | Eb"
      },
      {
        "id": "nibj-v3",
        "tag": "Verse 3",
        "lines": [
          "Joy floods my soul, for Jesus has saved me,",
          "Freed me from every sin that enslaved me,",
          "His precious blood was shed on the tree;",
          "Now I belong to Him!"
        ],
        "chords": "Eb | Ab | Eb Bb7 | Eb"
      }
    ]
  },
  {
    "id": "song-standing-on-the-promises",
    "title": "Standing on the promises",
    "author": "Russell Kelso Carter (1886)",
    "ccliNumber": "31803",
    "musicalKey": "Bb",
    "bpm": 112,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "sotp-v1",
        "tag": "Verse 1",
        "lines": [
          "Standing on the promises of Christ my King,",
          "Through eternal ages let His praises ring;",
          "Glory in the highest, I will shout and sing,",
          "Standing on the promises of God."
        ],
        "chords": "Bb | Eb | F7 | Bb"
      },
      {
        "id": "sotp-c1",
        "tag": "Chorus",
        "lines": [
          "Standing, standing,",
          "Standing on the promises of God my Savior;",
          "Standing, standing,",
          "I’m standing on the promises of God."
        ],
        "chords": "Bb | Eb | Bb F7 | Bb"
      },
      {
        "id": "sotp-v2",
        "tag": "Verse 2",
        "lines": [
          "Standing on the promises that cannot fail,",
          "When the howling storms of doubt and fear assail,",
          "By the living Word of God I shall prevail,",
          "Standing on the promises of God."
        ],
        "chords": "Bb | Eb | F7 | Bb"
      },
      {
        "id": "sotp-v3",
        "tag": "Verse 3",
        "lines": [
          "Standing on the promises of Christ the Lord,",
          "Bound to Him eternally by love’s strong cord,",
          "Overcoming daily with the Spirit’s sword,",
          "Standing on the promises of God."
        ],
        "chords": "Bb | Eb | F7 | Bb"
      },
      {
        "id": "sotp-v4",
        "tag": "Verse 4",
        "lines": [
          "Standing on the promises I cannot fall,",
          "List’ning every moment to the Spirit’s call,",
          "Resting in my Savior as my all in all,",
          "Standing on the promises of God."
        ],
        "chords": "Bb | Eb | F7 | Bb"
      }
    ]
  },
  {
    "id": "song-showers-of-blessing",
    "title": "Showers of Blessings",
    "author": "Daniel W. Whittle / James McGranahan (1883)",
    "ccliNumber": "44805",
    "musicalKey": "Bb",
    "bpm": 100,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "sob-v1",
        "tag": "Verse 1",
        "lines": [
          "There shall be showers of blessing:",
          "This is the promise of love;",
          "There shall be seasons refreshing,",
          "Sent from the Savior above."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      },
      {
        "id": "sob-c1",
        "tag": "Chorus",
        "lines": [
          "Showers of blessing,",
          "Showers of blessing we need;",
          "Mercy-drops round us are falling,",
          "But for the showers we plead."
        ],
        "chords": "Bb | F7 | Bb Eb | Bb F7 Bb"
      },
      {
        "id": "sob-v2",
        "tag": "Verse 2",
        "lines": [
          "There shall be showers of blessing—",
          "Precious reviving again;",
          "Over the hills and the valleys,",
          "Sound of abundance of rain."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      },
      {
        "id": "sob-v3",
        "tag": "Verse 3",
        "lines": [
          "There shall be showers of blessing;",
          "Send them upon us, O Lord!",
          "Grant to us now a refreshing;",
          "Come, and now honor Thy Word."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      }
    ]
  },
  {
    "id": "song-bringing-in-the-sheaves",
    "title": "Bringing in the sheaves",
    "author": "Knowles Shaw / George A. Minor (1874)",
    "ccliNumber": "47124",
    "musicalKey": "C",
    "bpm": 108,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "bits-v1",
        "tag": "Verse 1",
        "lines": [
          "Sowing in the morning, sowing seeds of kindness,",
          "Sowing in the noontide and the dewy eve;",
          "Waiting for the harvest, and the time of reaping,",
          "We shall come rejoicing, bringing in the sheaves."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "bits-c1",
        "tag": "Chorus",
        "lines": [
          "Bringing in the sheaves, bringing in the sheaves,",
          "We shall come rejoicing, bringing in the sheaves;",
          "Bringing in the sheaves, bringing in the sheaves,",
          "We shall come rejoicing, bringing in the sheaves."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "bits-v2",
        "tag": "Verse 2",
        "lines": [
          "Sowing in the sunshine, sowing in the shadows,",
          "Fearing neither clouds nor winter’s chilling breeze;",
          "By and by the harvest, and the labor ended,",
          "We shall come rejoicing, bringing in the sheaves."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "bits-v3",
        "tag": "Verse 3",
        "lines": [
          "Going forth with weeping, sowing for the Master,",
          "Though the loss sustained our spirit often grieves;",
          "When our weeping’s over, He will bid us welcome,",
          "We shall come rejoicing, bringing in the sheaves."
        ],
        "chords": "C | G7 | C | G7 C"
      }
    ]
  },
  {
    "id": "song-blessed-assurance",
    "title": "Blessed assurance",
    "author": "Fanny J. Crosby / Phoebe P. Knapp (1873)",
    "ccliNumber": "22324",
    "musicalKey": "D",
    "bpm": 92,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "ba-v1",
        "tag": "Verse 1",
        "lines": [
          "Blessed assurance, Jesus is mine!",
          "Oh, what a foretaste of glory divine!",
          "Heir of salvation, purchase of God,",
          "Born of His Spirit, washed in His blood."
        ],
        "chords": "D | G D | A7 | D A7 D"
      },
      {
        "id": "ba-c1",
        "tag": "Chorus",
        "lines": [
          "This is my story, this is my song,",
          "Praising my Savior all the day long;",
          "This is my story, this is my song,",
          "Praising my Savior all the day long."
        ],
        "chords": "D | G D | G D | A7 D"
      },
      {
        "id": "ba-v2",
        "tag": "Verse 2",
        "lines": [
          "Perfect submission, perfect delight,",
          "Visions of rapture now burst on my sight;",
          "Angels, descending, bring from above",
          "Echoes of mercy, whispers of love."
        ],
        "chords": "D | G D | A7 | D A7 D"
      },
      {
        "id": "ba-v3",
        "tag": "Verse 3",
        "lines": [
          "Perfect submission, all is at rest,",
          "I in my Savior am happy and blest,",
          "Watching and waiting, looking above,",
          "Filled with His goodness, lost in His love."
        ],
        "chords": "D | G D | A7 | D A7 D"
      }
    ]
  },
  {
    "id": "song-draw-me-nearer",
    "title": "Draw me nearer",
    "author": "Fanny J. Crosby / William H. Doane (1875)",
    "ccliNumber": "27213",
    "musicalKey": "G",
    "bpm": 88,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "dmn-v1",
        "tag": "Verse 1",
        "lines": [
          "I am Thine, O Lord, I have heard Thy voice,",
          "And it told Thy love to me;",
          "But I long to rise in the arms of faith,",
          "And be closer drawn to Thee."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "dmn-c1",
        "tag": "Chorus",
        "lines": [
          "Draw me nearer, nearer, blessed Lord,",
          "To the cross where Thou hast died;",
          "Draw me nearer, nearer, nearer, blessed Lord,",
          "To Thy precious, bleeding side."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "dmn-v2",
        "tag": "Verse 2",
        "lines": [
          "Consecrate me now to Thy service, Lord,",
          "By the pow’r of grace divine;",
          "Let my soul look up with a steadfast hope,",
          "And my will be lost in Thine."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "dmn-v3",
        "tag": "Verse 3",
        "lines": [
          "Oh, the pure delight of a single hour",
          "That before Thy throne I spend,",
          "When I kneel in pray’r, and with Thee, my God,",
          "I commune as friend with friend!"
        ],
        "chords": "G | C | G | D7 G"
      }
    ]
  },
  {
    "id": "song-great-is-thy-faithfulness",
    "title": "Great is thy faithfulness",
    "author": "Thomas O. Chisholm / William M. Runyan (1923)",
    "ccliNumber": "18723",
    "musicalKey": "D",
    "bpm": 84,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "gitf-v1",
        "tag": "Verse 1",
        "lines": [
          "Great is Thy faithfulness, O God my Father;",
          "There is no shadow of turning with Thee;",
          "Thou changest not, Thy compassions, they fail not;",
          "As Thou hast been, Thou forever wilt be."
        ],
        "chords": "D | G | A7 | D"
      },
      {
        "id": "gitf-c1",
        "tag": "Chorus",
        "lines": [
          "Great is Thy faithfulness! Great is Thy faithfulness!",
          "Morning by morning new mercies I see;",
          "All I have needed Thy hand hath provided—",
          "Great is Thy faithfulness, Lord, unto me!"
        ],
        "chords": "A7 D | B7 Em | G D | A7 D"
      },
      {
        "id": "gitf-v2",
        "tag": "Verse 2",
        "lines": [
          "Summer and winter and springtime and harvest,",
          "Sun, moon, and stars in their courses above",
          "Join with all nature in manifold witness",
          "To Thy great faithfulness, mercy, and love."
        ],
        "chords": "D | G | A7 | D"
      },
      {
        "id": "gitf-v3",
        "tag": "Verse 3",
        "lines": [
          "Pardon for sin and a peace that endureth,",
          "Thine own dear presence to cheer and to guide;",
          "Strength for today and bright hope for tomorrow,",
          "Blessings all mine, with ten thousand beside!"
        ],
        "chords": "D | G | A7 | D"
      }
    ]
  },
  {
    "id": "song-power-in-the-blood",
    "title": "There is power in the blood",
    "author": "Lewis E. Jones (1899)",
    "ccliNumber": "21370",
    "musicalKey": "Bb",
    "bpm": 108,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "pitb-v1",
        "tag": "Verse 1",
        "lines": [
          "Would you be free from the burden of sin?",
          "There’s pow’r in the blood, pow’r in the blood;",
          "Would you o’er evil a victory win?",
          "There’s wonderful pow’r in the blood."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      },
      {
        "id": "pitb-c1",
        "tag": "Chorus",
        "lines": [
          "There is pow’r, pow’r, wonder-working pow’r",
          "In the blood of the Lamb;",
          "There is pow’r, pow’r, wonder-working pow’r",
          "In the precious blood of the Lamb."
        ],
        "chords": "Bb | F7 | Bb Eb | Bb F7 Bb"
      },
      {
        "id": "pitb-v2",
        "tag": "Verse 2",
        "lines": [
          "Would you be free from your passion and pride?",
          "There’s pow’r in the blood, pow’r in the blood;",
          "Come for a cleansing to Calvary’s tide;",
          "There’s wonderful pow’r in the blood."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      },
      {
        "id": "pitb-v3",
        "tag": "Verse 3",
        "lines": [
          "Would you be whiter, much whiter than snow?",
          "There’s pow’r in the blood, pow’r in the blood;",
          "Sin-stains are lost in its life-giving flow;",
          "There’s wonderful pow’r in the blood."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      },
      {
        "id": "pitb-v4",
        "tag": "Verse 4",
        "lines": [
          "Would you do service for Jesus your King?",
          "There’s pow’r in the blood, pow’r in the blood;",
          "Would you live daily His praises to sing?",
          "There’s wonderful pow’r in the blood."
        ],
        "chords": "Bb | F7 | Bb | Eb F7 Bb"
      }
    ]
  },
  {
    "id": "song-leaning-on-arms",
    "title": "Leaning on the everlasting arms",
    "author": "Elisha A. Hoffman / Anthony J. Showalter (1887)",
    "ccliNumber": "31340",
    "musicalKey": "G",
    "bpm": 100,
    "defaultBackgroundId": "bg-warm-worship",
    "slides": [
      {
        "id": "loa-v1",
        "tag": "Verse 1",
        "lines": [
          "What a fellowship, what a joy divine,",
          "Leaning on the everlasting arms;",
          "What a blessedness, what a peace is mine,",
          "Leaning on the everlasting arms."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "loa-c1",
        "tag": "Chorus",
        "lines": [
          "Leaning, leaning,",
          "Safe and secure from all alarms;",
          "Leaning, leaning,",
          "Leaning on the everlasting arms."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "loa-v2",
        "tag": "Verse 2",
        "lines": [
          "Oh, how sweet to walk in this pilgrim way,",
          "Leaning on the everlasting arms;",
          "Oh, how bright the path grows from day to day,",
          "Leaning on the everlasting arms."
        ],
        "chords": "G | C | G | D7 G"
      },
      {
        "id": "loa-v3",
        "tag": "Verse 3",
        "lines": [
          "What have I to dread, what have I to fear,",
          "Leaning on the everlasting arms?",
          "I have blessed peace with my Lord so near,",
          "Leaning on the everlasting arms."
        ],
        "chords": "G | C | G | D7 G"
      }
    ]
  },
  {
    "id": "song-ill-fly-away",
    "title": "I’ll fly away",
    "author": "Albert E. Brumley (1929)",
    "ccliNumber": "26399",
    "musicalKey": "G",
    "bpm": 116,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "ifa-v1",
        "tag": "Verse 1",
        "lines": [
          "Some glad morning when this life is o’er,",
          "I’ll fly away;",
          "To a home on God’s celestial shore,",
          "I’ll fly away."
        ],
        "chords": "G | C G | G | D7 G"
      },
      {
        "id": "ifa-c1",
        "tag": "Chorus",
        "lines": [
          "I’ll fly away, O glory, I’ll fly away;",
          "When I die, Hallelujah, by and by,",
          "I’ll fly away."
        ],
        "chords": "G | C G | G | D7 G"
      },
      {
        "id": "ifa-v2",
        "tag": "Verse 2",
        "lines": [
          "When the shadows of this life have grown,",
          "I’ll fly away;",
          "Like a bird from prison bars has flown,",
          "I’ll fly away."
        ],
        "chords": "G | C G | G | D7 G"
      },
      {
        "id": "ifa-v3",
        "tag": "Verse 3",
        "lines": [
          "Just a few more weary days and then,",
          "I’ll fly away;",
          "To a land where joy shall never end,",
          "I’ll fly away."
        ],
        "chords": "G | C G | G | D7 G"
      }
    ]
  },
  {
    "id": "song-mansion-over-hilltop",
    "title": "Mansion over the hilltop",
    "author": "Ira F. Stanphill (1949)",
    "ccliNumber": "21935",
    "musicalKey": "C",
    "bpm": 88,
    "defaultBackgroundId": "bg-royal-gold",
    "slides": [
      {
        "id": "moth-v1",
        "tag": "Verse 1",
        "lines": [
          "I’m satisfied with just a cottage below,",
          "A little silver and a little gold;",
          "But in that city where the ransomed will shine,",
          "I want a gold one that’s silver-lined."
        ],
        "chords": "C | F C | G7 | C"
      },
      {
        "id": "moth-c1",
        "tag": "Chorus",
        "lines": [
          "I’ve got a mansion just over the hilltop,",
          "In that bright land where we’ll never grow old;",
          "And someday yonder we will nevermore wander,",
          "But walk the streets that are purest gold."
        ],
        "chords": "F | C | G7 | C"
      },
      {
        "id": "moth-v2",
        "tag": "Verse 2",
        "lines": [
          "Don’t think me poor or deserted or lonely,",
          "I’m not discouraged, I’m heaven-bound;",
          "I’m just a pilgrim in search of a city,",
          "I want a mansion, a harp, and a crown."
        ],
        "chords": "C | F C | G7 | C"
      },
      {
        "id": "moth-v3",
        "tag": "Verse 3",
        "lines": [
          "Though often tempted, tormented, and tested,",
          "And, like the prophet, my pillow a stone,",
          "And though I find here no permanent dwelling,",
          "I know He’ll give me a mansion my own."
        ],
        "chords": "C | F C | G7 | C"
      }
    ]
  },
  {
    "id": "song-when-we-all-get-to-heaven",
    "title": "when we all get to heaven",
    "author": "Eliza E. Hewitt / Emily D. Wilson (1898)",
    "ccliNumber": "30571",
    "musicalKey": "C",
    "bpm": 104,
    "defaultBackgroundId": "bg-aurora",
    "slides": [
      {
        "id": "wwagth-v1",
        "tag": "Verse 1",
        "lines": [
          "Sing the wondrous love of Jesus,",
          "Sing His mercy and His grace;",
          "In the mansions fair and blessed",
          "He’ll prepare for us a place."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "wwagth-c1",
        "tag": "Chorus",
        "lines": [
          "When we all get to heaven,",
          "What a day of rejoicing that will be!",
          "When we all see Jesus,",
          "We’ll sing and shout the victory!"
        ],
        "chords": "C | G7 | C F | C G7 C"
      },
      {
        "id": "wwagth-v2",
        "tag": "Verse 2",
        "lines": [
          "While we walk the pilgrim pathway,",
          "Clouds will overspread the sky;",
          "But when trav’ling days are over,",
          "Not a shadow, not a sigh."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "wwagth-v3",
        "tag": "Verse 3",
        "lines": [
          "Let us then be true and faithful,",
          "Trusting, serving every day;",
          "Just one glimpse of Him in glory",
          "Will the toils of life repay."
        ],
        "chords": "C | G7 | C | G7 C"
      },
      {
        "id": "wwagth-v4",
        "tag": "Verse 4",
        "lines": [
          "Onward to the prize before us!",
          "Soon His beauty we’ll behold;",
          "Soon the pearly gates will open;",
          "We shall tread the streets of gold."
        ],
        "chords": "C | G7 | C | G7 C"
      }
    ]
  },
];

export const BIBLE_DATABASE: BibleVerse[] = [
  // Psalm 23
  { book: 'Psalms', chapter: 23, verse: 1, translation: 'KJV', text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Psalms', chapter: 23, verse: 2, translation: 'KJV', text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
  { book: 'Psalms', chapter: 23, verse: 3, translation: 'KJV', text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.' },
  { book: 'Psalms', chapter: 23, verse: 4, translation: 'KJV', text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
  { book: 'Psalms', chapter: 23, verse: 5, translation: 'KJV', text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
  { book: 'Psalms', chapter: 23, verse: 6, translation: 'KJV', text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' },
  // Psalm 23 NIV
  { book: 'Psalms', chapter: 23, verse: 1, translation: 'NIV', text: 'The LORD is my shepherd, I lack nothing.' },
  { book: 'Psalms', chapter: 23, verse: 2, translation: 'NIV', text: 'He makes me lie down in green pastures, he leads me beside quiet waters,' },
  { book: 'Psalms', chapter: 23, verse: 3, translation: 'NIV', text: 'he refreshes my soul. He guides me along the right paths for his name’s sake.' },
  { book: 'Psalms', chapter: 23, verse: 4, translation: 'NIV', text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.' },
  { book: 'Psalms', chapter: 23, verse: 5, translation: 'NIV', text: 'You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.' },
  { book: 'Psalms', chapter: 23, verse: 6, translation: 'NIV', text: 'Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever.' },
  // Psalm 23 NASB
  { book: 'Psalms', chapter: 23, verse: 1, translation: 'NASB', text: 'The LORD is my shepherd, I will not be in need.' },
  { book: 'Psalms', chapter: 23, verse: 2, translation: 'NASB', text: 'He lets me lie down in green pastures; He leads me beside quiet waters.' },
  { book: 'Psalms', chapter: 23, verse: 3, translation: 'NASB', text: 'He restores my soul; He guides me in the paths of righteousness For the sake of His name.' },
  { book: 'Psalms', chapter: 23, verse: 4, translation: 'NASB', text: 'Even though I walk through the valley of the shadow of death, I fear no evil, for You are with me; Your rod and Your staff, they comfort me.' },
  { book: 'Psalms', chapter: 23, verse: 5, translation: 'NASB', text: 'You prepare a table before me in the presence of my enemies; You have anointed my head with oil; My cup overflows.' },
  { book: 'Psalms', chapter: 23, verse: 6, translation: 'NASB', text: 'Certainly goodness and faithfulness will follow me all the days of my life, And my dwelling will be in the house of the LORD forever.' },
  // Psalm 23 ESV
  { book: 'Psalms', chapter: 23, verse: 1, translation: 'ESV', text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Psalms', chapter: 23, verse: 2, translation: 'ESV', text: 'He makes me lie down in green pastures. He leads me beside still waters.' },
  { book: 'Psalms', chapter: 23, verse: 3, translation: 'ESV', text: 'He restores my soul. He leads me in paths of righteousness for his name’s sake.' },
  { book: 'Psalms', chapter: 23, verse: 4, translation: 'ESV', text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.' },
  { book: 'Psalms', chapter: 23, verse: 5, translation: 'ESV', text: 'You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.' },
  { book: 'Psalms', chapter: 23, verse: 6, translation: 'ESV', text: 'Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever.' },
  // Psalm 23 MBB 1901 (Ang Biblia 1901)
  { book: 'Psalms', chapter: 23, verse: 1, translation: 'MBB 1901', text: 'Ang Panginoon ay aking pastor; hindi ako mangangailangan.' },
  { book: 'Psalms', chapter: 23, verse: 2, translation: 'MBB 1901', text: 'Kaniyang pinahihiga ako sa mga sariwang pastulan: pinapatnubayan niya ako sa tabi ng mga tubig na pahingahan.' },
  { book: 'Psalms', chapter: 23, verse: 3, translation: 'MBB 1901', text: 'Kaniyang pinapananauli ang aking kaluluwa: pinapatnubayan niya ako sa mga landas ng katuwiran alangalang sa kaniyang pangalan.' },
  { book: 'Psalms', chapter: 23, verse: 4, translation: 'MBB 1901', text: 'Oo, bagaman ako’y lumalakad sa libis ng lilim ng kamatayan, wala akong katatakutang kasamaan; sapagka’t ikaw ay sumasa akin: ang iyong pamalo at ang iyong tungkod, siyang umaaliw sa akin.' },
  { book: 'Psalms', chapter: 23, verse: 5, translation: 'MBB 1901', text: 'Iyong pinaghahandaan ako ng dulang sa harap ko sa harapan ng aking mga kaaway: iyong pinahiran ang aking ulo ng langis; ang aking kopa ay umaapaw.' },
  { book: 'Psalms', chapter: 23, verse: 6, translation: 'MBB 1901', text: 'Tunay na ang kabutihan at kaawaan ay susunod sa akin sa lahat ng mga kaarawan ng aking buhay: at ako’y tatahan sa bahay ng Panginoon magpakailan man.' },
  // Psalm 100
  { book: 'Psalms', chapter: 100, verse: 1, translation: 'KJV', text: 'Make a joyful noise unto the LORD, all ye lands.' },
  { book: 'Psalms', chapter: 100, verse: 2, translation: 'KJV', text: 'Serve the LORD with gladness: come before his presence with singing.' },
  { book: 'Psalms', chapter: 100, verse: 3, translation: 'KJV', text: 'Know ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.' },
  { book: 'Psalms', chapter: 100, verse: 4, translation: 'KJV', text: 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.' },
  { book: 'Psalms', chapter: 100, verse: 5, translation: 'KJV', text: 'For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.' },
  // John 3
  { book: 'John', chapter: 3, verse: 16, translation: 'KJV', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { book: 'John', chapter: 3, verse: 17, translation: 'KJV', text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' },
  // John 3 NIV
  { book: 'John', chapter: 3, verse: 16, translation: 'NIV', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { book: 'John', chapter: 3, verse: 17, translation: 'NIV', text: 'For God did not send his Son into the world to condemn the world, but to save the world through him.' },
  // John 3 NASB
  { book: 'John', chapter: 3, verse: 16, translation: 'NASB', text: 'For God so loved the world, that He gave His only Son, so that everyone who believes in Him will not perish, but have eternal life.' },
  { book: 'John', chapter: 3, verse: 17, translation: 'NASB', text: 'For God did not send the Son into the world to judge the world, but so that the world might be saved through Him.' },
  // John 3 ESV
  { book: 'John', chapter: 3, verse: 16, translation: 'ESV', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { book: 'John', chapter: 3, verse: 17, translation: 'ESV', text: 'For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.' },
  // John 3 MBB 1901
  { book: 'John', chapter: 3, verse: 16, translation: 'MBB 1901', text: 'Sapagka’t gayon na lamang ang pagsinta ng Dios sa sanglibutan, na ibinigay niya ang kaniyang bugtong na Anak, upang ang sinomang sa kaniya’y sumampalataya ay huwag mapahamak, kundi magkaroon ng buhay na walang hanggan.' },
  { book: 'John', chapter: 3, verse: 17, translation: 'MBB 1901', text: 'Sapagka’t hindi sinugo ng Dios ang Anak sa sanglibutan upang hatulan ang sanglibutan; kundi upang ang sanglibutan ay maligtas sa pamamagitan niya.' },
  // Additional Sanctuary Anchor Verses in NIV, NASB, ESV, MBB 1901
  { book: 'Romans', chapter: 8, verse: 28, translation: 'NIV', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'NASB', text: 'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'ESV', text: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'MBB 1901', text: 'At nalalaman natin na ang lahat ng mga bagay ay nagkakalakip na gumagawa sa ikabubuti ng mga nagsisiibig sa Dios, sa makatuwid baga’y niyaong mga tinawag alinsunod sa kaniyang nasa.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'NIV', text: 'I can do all this through him who gives me strength.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'NASB', text: 'I can do all things through Him who strengthens me.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'ESV', text: 'I can do all things through him who strengthens me.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'MBB 1901', text: 'Lahat ng mga bagay ay aking magagawa doon sa nagpapalakas sa akin.' },
  { book: 'Genesis', chapter: 1, verse: 1, translation: 'NIV', text: 'In the beginning God created the heavens and the earth.' },
  { book: 'Genesis', chapter: 1, verse: 1, translation: 'NASB', text: 'In the beginning God created the heavens and the earth.' },
  { book: 'Genesis', chapter: 1, verse: 1, translation: 'ESV', text: 'In the beginning, God created the heavens and the earth.' },
  { book: 'Genesis', chapter: 1, verse: 1, translation: 'MBB 1901', text: 'Nang pasimula ay nilikha ng Dios ang langit at ang lupa.' },
  // Romans 8
  { book: 'Romans', chapter: 8, verse: 28, translation: 'KJV', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 31, translation: 'KJV', text: 'What shall we then say to these things? If God be for us, who can be against us?' },
  { book: 'Romans', chapter: 8, verse: 38, translation: 'KJV', text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,' },
  { book: 'Romans', chapter: 8, verse: 39, translation: 'KJV', text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' },
  // Isaiah 40
  { book: 'Isaiah', chapter: 40, verse: 28, translation: 'KJV', text: 'Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.' },
  { book: 'Isaiah', chapter: 40, verse: 29, translation: 'KJV', text: 'He giveth power to the faint; and to them that have no might he increaseth strength.' },
  { book: 'Isaiah', chapter: 40, verse: 30, translation: 'KJV', text: 'Even the youths shall faint and be weary, and the young men shall utterly fall:' },
  { book: 'Isaiah', chapter: 40, verse: 31, translation: 'KJV', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
  // Philippians 4
  { book: 'Philippians', chapter: 4, verse: 4, translation: 'KJV', text: 'Rejoice in the Lord alway: and again I say, Rejoice.' },
  { book: 'Philippians', chapter: 4, verse: 6, translation: 'KJV', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
  { book: 'Philippians', chapter: 4, verse: 7, translation: 'KJV', text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'KJV', text: 'I can do all things through Christ which strengtheneth me.' },
  // Matthew 5
  { book: 'Matthew', chapter: 5, verse: 14, translation: 'KJV', text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.' },
  { book: 'Matthew', chapter: 5, verse: 15, translation: 'KJV', text: 'Neither do men light a candle, and put it under a bushel, but on a candlestick; and it giveth light unto all that are in the house.' },
  { book: 'Matthew', chapter: 5, verse: 16, translation: 'KJV', text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.' },
  // Genesis 1
  { book: 'Genesis', chapter: 1, verse: 1, translation: 'KJV', text: 'In the beginning God created the heaven and the earth.' },
  { book: 'Genesis', chapter: 1, verse: 2, translation: 'KJV', text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
  { book: 'Genesis', chapter: 1, verse: 3, translation: 'KJV', text: 'And God said, Let there be light: and there was light.' },
  // Foundational Verses Across the 66-Book Canon (Pre-installed Offline Seed)
  { book: 'Exodus', chapter: 14, verse: 14, translation: 'KJV', text: 'The LORD shall fight for you, and ye shall hold your peace.' },
  { book: 'Leviticus', chapter: 19, verse: 18, translation: 'KJV', text: 'Thou shalt love thy neighbour as thyself: I am the LORD.' },
  { book: 'Numbers', chapter: 6, verse: 24, translation: 'KJV', text: 'The LORD bless thee, and keep thee:' },
  { book: 'Numbers', chapter: 6, verse: 25, translation: 'KJV', text: 'The LORD make his face shine upon thee, and be gracious unto thee:' },
  { book: 'Numbers', chapter: 6, verse: 26, translation: 'KJV', text: 'The LORD lift up his countenance upon thee, and give thee peace.' },
  { book: 'Deuteronomy', chapter: 31, verse: 6, translation: 'KJV', text: 'Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.' },
  { book: 'Joshua', chapter: 1, verse: 9, translation: 'KJV', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
  { book: 'Judges', chapter: 6, verse: 12, translation: 'KJV', text: 'And the angel of the LORD appeared unto him, and said unto him, The LORD is with thee, thou mighty man of valour.' },
  { book: 'Ruth', chapter: 1, verse: 16, translation: 'KJV', text: 'For whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God:' },
  { book: '1 Samuel', chapter: 16, verse: 7, translation: 'KJV', text: 'For the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.' },
  { book: '2 Samuel', chapter: 22, verse: 2, translation: 'KJV', text: 'The LORD is my rock, and my fortress, and my deliverer;' },
  { book: '1 Kings', chapter: 8, verse: 56, translation: 'KJV', text: 'Blessed be the LORD, that hath given rest unto his people Israel, according to all that he promised.' },
  { book: '2 Kings', chapter: 6, verse: 16, translation: 'KJV', text: 'Fear not: for they that be with us are more than they that be with them.' },
  { book: '1 Chronicles', chapter: 16, verse: 34, translation: 'KJV', text: 'O give thanks unto the LORD; for he is good; for his mercy endureth for ever.' },
  { book: '2 Chronicles', chapter: 7, verse: 14, translation: 'KJV', text: 'If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.' },
  { book: 'Ezra', chapter: 3, verse: 11, translation: 'KJV', text: 'And they sang together by course in praising and giving thanks unto the LORD; because he is good, for his mercy endureth for ever toward Israel.' },
  { book: 'Nehemiah', chapter: 8, verse: 10, translation: 'KJV', text: 'Neither be ye sorry; for the joy of the LORD is your strength.' },
  { book: 'Esther', chapter: 4, verse: 14, translation: 'KJV', text: 'And who knoweth whether thou art come to the kingdom for such a time as this?' },
  { book: 'Job', chapter: 19, verse: 25, translation: 'KJV', text: 'For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth:' },
  { book: 'Proverbs', chapter: 3, verse: 5, translation: 'KJV', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { book: 'Proverbs', chapter: 3, verse: 6, translation: 'KJV', text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
  { book: 'Ecclesiastes', chapter: 3, verse: 1, translation: 'KJV', text: 'To every thing there is a season, and a time to every purpose under the heaven:' },
  { book: 'Song of Solomon', chapter: 2, verse: 4, translation: 'KJV', text: 'He brought me to the banqueting house, and his banner over me was love.' },
  { book: 'Jeremiah', chapter: 29, verse: 11, translation: 'KJV', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
  { book: 'Lamentations', chapter: 3, verse: 22, translation: 'KJV', text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not.' },
  { book: 'Lamentations', chapter: 3, verse: 23, translation: 'KJV', text: 'They are new every morning: great is thy faithfulness.' },
  { book: 'Ezekiel', chapter: 36, verse: 26, translation: 'KJV', text: 'A new heart also will I give you, and a new spirit will I put within you:' },
  { book: 'Daniel', chapter: 3, verse: 17, translation: 'KJV', text: 'If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king.' },
  { book: 'Hosea', chapter: 6, verse: 3, translation: 'KJV', text: 'Then shall we know, if we follow on to know the LORD: his going forth is prepared as the morning;' },
  { book: 'Joel', chapter: 2, verse: 28, translation: 'KJV', text: 'And it shall come to pass afterward, that I will pour out my spirit upon all flesh;' },
  { book: 'Amos', chapter: 5, verse: 24, translation: 'KJV', text: 'But let judgment run down as waters, and righteousness as a mighty stream.' },
  { book: 'Obadiah', chapter: 1, verse: 21, translation: 'KJV', text: 'And saviours shall come up on mount Zion to judge the mount of Esau; and the kingdom shall be the LORD’s.' },
  { book: 'Jonah', chapter: 2, verse: 9, translation: 'KJV', text: 'But I will sacrifice unto thee with the voice of thanksgiving; I will pay that that I have vowed. Salvation is of the LORD.' },
  { book: 'Micah', chapter: 6, verse: 8, translation: 'KJV', text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' },
  { book: 'Nahum', chapter: 1, verse: 7, translation: 'KJV', text: 'The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.' },
  { book: 'Habakkuk', chapter: 3, verse: 18, translation: 'KJV', text: 'Yet I will rejoice in the LORD, I will joy in the God of my salvation.' },
  { book: 'Zephaniah', chapter: 3, verse: 17, translation: 'KJV', text: 'The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy;' },
  { book: 'Haggai', chapter: 2, verse: 9, translation: 'KJV', text: 'The glory of this latter house shall be greater than of the former, saith the LORD of hosts: and in this place will I give peace.' },
  { book: 'Zechariah', chapter: 4, verse: 6, translation: 'KJV', text: 'Not by might, nor by power, but by my spirit, saith the LORD of hosts.' },
  { book: 'Malachi', chapter: 3, verse: 10, translation: 'KJV', text: 'Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts.' },
  { book: 'Mark', chapter: 10, verse: 45, translation: 'KJV', text: 'For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.' },
  { book: 'Luke', chapter: 4, verse: 18, translation: 'KJV', text: 'The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted.' },
  { book: 'Acts', chapter: 1, verse: 8, translation: 'KJV', text: 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me.' },
  { book: '1 Corinthians', chapter: 13, verse: 4, translation: 'KJV', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,' },
  { book: '1 Corinthians', chapter: 13, verse: 13, translation: 'KJV', text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.' },
  { book: '2 Corinthians', chapter: 5, verse: 17, translation: 'KJV', text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' },
  { book: 'Galatians', chapter: 5, verse: 22, translation: 'KJV', text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,' },
  { book: 'Ephesians', chapter: 2, verse: 8, translation: 'KJV', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:' },
  { book: 'Colossians', chapter: 3, verse: 16, translation: 'KJV', text: 'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs.' },
  { book: '1 Thessalonians', chapter: 5, verse: 16, translation: 'KJV', text: 'Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.' },
  { book: '2 Thessalonians', chapter: 3, verse: 3, translation: 'KJV', text: 'But the Lord is faithful, who shall stablish you, and keep you from evil.' },
  { book: '1 Timothy', chapter: 4, verse: 12, translation: 'KJV', text: 'Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.' },
  { book: '2 Timothy', chapter: 1, verse: 7, translation: 'KJV', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
  { book: 'Titus', chapter: 3, verse: 5, translation: 'KJV', text: 'Not by works of righteousness which we have done, but according to his mercy he saved us.' },
  { book: 'Philemon', chapter: 1, verse: 6, translation: 'KJV', text: 'That the communication of thy faith may become effectual by the acknowledging of every good thing which is in you in Christ Jesus.' },
  { book: 'Hebrews', chapter: 11, verse: 1, translation: 'KJV', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
  { book: 'Hebrews', chapter: 12, verse: 2, translation: 'KJV', text: 'Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross.' },
  { book: 'James', chapter: 1, verse: 5, translation: 'KJV', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
  { book: '1 Peter', chapter: 5, verse: 7, translation: 'KJV', text: 'Casting all your care upon him; for he careth for you.' },
  { book: '2 Peter', chapter: 3, verse: 9, translation: 'KJV', text: 'The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward.' },
  { book: '1 John', chapter: 4, verse: 19, translation: 'KJV', text: 'We love him, because he first loved us.' },
  { book: '2 John', chapter: 1, verse: 6, translation: 'KJV', text: 'And this is love, that we walk after his commandments.' },
  { book: '3 John', chapter: 1, verse: 4, translation: 'KJV', text: 'I have no greater joy than to hear that my children walk in truth.' },
  { book: 'Jude', chapter: 1, verse: 24, translation: 'KJV', text: 'Now unto him that is able to keep you from falling, and to present you faultless before the presence of his glory with exceeding joy,' },
  { book: 'Revelation', chapter: 4, verse: 8, translation: 'KJV', text: 'Holy, holy, holy, Lord God Almighty, which was, and is, and is to come.' },
  { book: 'Revelation', chapter: 21, verse: 4, translation: 'KJV', text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain.' },
];

export const DEFAULT_SERVICE_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sched-welcome',
    type: 'announcement',
    title: 'Pre-Service & Welcome Loop',
    subtitle: 'Sunday Morning Gathering • 10:00 AM',
    backgroundId: 'bg-aurora',
    themeId: 'theme-sanctuary-center',
    slides: [
      {
        id: 'wel-1',
        tag: 'Announcement',
        lines: ['WELCOME HOME', 'We are glad you are worshipping with us today'],
        subtext: 'Sunday Worship Service • Coffee & Fellowship in Lobby',
      },
      {
        id: 'wel-2',
        tag: 'Announcement',
        lines: ['YOUTH & YOUNG ADULTS NIGHT', 'Fridays at 7:00 PM in the Main Auditorium'],
        subtext: 'Sign up at the Welcome Desk or via the Church App',
      },
      {
        id: 'wel-3',
        tag: 'Announcement',
        lines: ['PLEASE SILENCE CELL PHONES', 'Service begins in just a few moments'],
        subtext: 'Prepare our hearts for worship',
      },
    ],
  },
  {
    id: 'sched-opening-song',
    type: 'song',
    title: 'God of Revival & Light',
    subtitle: 'Opening Praise • Key of Bb • 68 BPM',
    sourceId: 'song-way-in-wilderness',
    backgroundId: 'bg-aurora',
    themeId: 'theme-sanctuary-center',
    slides: DEFAULT_SONGS[1].slides,
  },
  {
    id: 'sched-song-2',
    type: 'song',
    title: 'Holy, Holy, Holy! Lord God Almighty',
    subtitle: 'Congregational Hymn • Key of D',
    sourceId: 'song-holy-holy-holy',
    backgroundId: 'bg-royal-gold',
    themeId: 'theme-sanctuary-center',
    slides: DEFAULT_SONGS[2].slides,
  },
  {
    id: 'sched-scripture',
    type: 'scripture',
    title: 'Psalms 23:1-6 (KJV)',
    subtitle: 'Congregational Scripture Reading',
    backgroundId: 'bg-deep-ocean',
    themeId: 'theme-scripture-classic',
    slides: [
      {
        id: 'ps23-1',
        tag: 'Scripture',
        lines: ['¹ The LORD is my shepherd; I shall not want.', '² He maketh me to lie down in green pastures: he leadeth me beside the still waters.'],
        subtext: 'Psalms 23:1–2 (KJV)',
      },
      {
        id: 'ps23-2',
        tag: 'Scripture',
        lines: ['³ He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.'],
        subtext: 'Psalms 23:3 (KJV)',
      },
      {
        id: 'ps23-3',
        tag: 'Scripture',
        lines: ['⁴ Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.'],
        subtext: 'Psalms 23:4 (KJV)',
      },
      {
        id: 'ps23-4',
        tag: 'Scripture',
        lines: ['⁵ Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.'],
        subtext: 'Psalms 23:5 (KJV)',
      },
      {
        id: 'ps23-5',
        tag: 'Scripture',
        lines: ['⁶ Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.'],
        subtext: 'Psalms 23:6 (KJV)',
      },
    ],
  },
  {
    id: 'sched-sermon',
    type: 'presentation',
    title: 'Sermon: Unshakeable Peace in the Storm',
    subtitle: 'Pastor David • Series: Anchored Hope (Part 3)',
    backgroundId: 'bg-slate-minimal',
    themeId: 'theme-sanctuary-center',
    slides: [
      {
        id: 'serm-1',
        tag: 'Sermon Point',
        lines: ['UNSHAKEABLE PEACE', 'Finding Still Waters in a Noisy World'],
        subtext: 'Anchored Hope Series • Part 3',
      },
      {
        id: 'serm-2',
        tag: 'Sermon Point',
        lines: ['1. Presence Over Circumstances', 'Peace is not the absence of trouble, but the presence of the Shepherd.'],
        subtext: 'Psalm 23:4 • Isaiah 40:31',
      },
      {
        id: 'serm-3',
        tag: 'Sermon Point',
        lines: ['2. Trading Anxiety for Thanksgiving', 'Prayer moves the burden from our shoulders to God’s hands.'],
        subtext: 'Philippians 4:6–7',
      },
      {
        id: 'serm-4',
        tag: 'Sermon Point',
        lines: ['3. Walking Out in Confidence', 'Goodness and mercy are actively pursuing you this week.'],
        subtext: 'Psalm 23:6',
      },
    ],
  },
  {
    id: 'sched-response-song',
    type: 'song',
    title: 'Amazing Grace (Chains Are Gone)',
    subtitle: 'Response & Ministry Time • Key of G',
    sourceId: 'song-amazing-grace',
    backgroundId: 'bg-warm-worship',
    themeId: 'theme-sanctuary-center',
    slides: DEFAULT_SONGS[0].slides,
  },
];
