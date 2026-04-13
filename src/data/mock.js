export const tracks = [
  { id: '1', title: 'Осенний дождь', artist: 'Кино', duration: '3:42', artGradient: ['#1e1818', '#281e24'] },
  { id: '2', title: 'Перемен', artist: 'Кино', duration: '4:15', artGradient: ['#181e18', '#1e2428'] },
  { id: '3', title: 'Группа крови', artist: 'Кино', duration: '3:58', artGradient: ['#18181e', '#241e28'] },
  { id: '4', title: 'Звезда по имени Солнце', artist: 'Кино', duration: '5:10', artGradient: ['#1e1e18', '#28241e'] },
  { id: '5', title: 'Малиновка', artist: 'Земфира', duration: '3:33', artGradient: ['#181e1e', '#1e2824'] },
  { id: '6', title: 'Ариведерчи', artist: 'Земфира', duration: '4:02', artGradient: ['#201a1c', '#1c1a20'] },
  { id: '7', title: 'Спид', artist: 'Земфира', duration: '3:51', artGradient: ['#1a1e20', '#201824'] },
  { id: '8', title: 'Ночной патруль', artist: 'Сплин', duration: '4:28', artGradient: ['#1e1a18', '#241e20'] },
  { id: '9', title: 'Выхода нет', artist: 'Сплин', duration: '3:45', artGradient: ['#18201e', '#1e2820'] },
  { id: '10', title: 'Романс', artist: 'Мумий Тролль', duration: '3:30', artGradient: ['#201e18', '#281e1a'] },
];

export const artists = [
  { id: '1', name: 'Кино', gradients: ['#1a1010', '#100a18'] },
  { id: '2', name: 'Земфира', gradients: ['#202a20', '#1a2028'] },
  { id: '3', name: 'Сплин', gradients: ['#20202a', '#281a20'] },
  { id: '4', name: 'Мумий Тролль', gradients: ['#2a2a20', '#201a1a'] },
  { id: '5', name: 'Nautilus', gradients: ['#202a2a', '#1a201a'] },
  { id: '6', name: 'ДДТ', gradients: ['#2a2018', '#20181a'] },
  { id: '7', name: 'Агата Кристи', gradients: ['#182028', '#201828'] },
];

export const playlists = [
  { id: '1', name: 'Утренний кофе', tracks: 24, artColors: ['#1e1818', '#281e24', '#181e18', '#1e2428'] },
  { id: '2', name: 'Ночная волна', tracks: 18, artColors: ['#18181e', '#241e28', '#1e1e18', '#28241e'] },
  { id: '3', name: 'Рок 90-х', tracks: 42, artColors: ['#181e1e', '#1e2824', '#201a1c', '#1c1a20'] },
  { id: '4', name: 'В дорогу', tracks: 31, artColors: ['#1a1e20', '#201824', '#1e1a18', '#241e20'] },
];

export const chartTracks = [
  { id: '1', rank: 1, title: 'Осенний дождь', artist: 'Кино', plays: '2.4М', artGradient: ['#1e1818', '#281e24'] },
  { id: '2', rank: 2, title: 'Малиновка', artist: 'Земфира', plays: '1.9М', artGradient: ['#181e1e', '#1e2824'] },
  { id: '3', rank: 3, title: 'Перемен', artist: 'Кино', plays: '1.7М', artGradient: ['#181e18', '#1e2428'] },
  { id: '4', rank: 4, title: 'Ариведерчи', artist: 'Земфира', plays: '1.5М', artGradient: ['#201a1c', '#1c1a20'] },
  { id: '5', rank: 5, title: 'Группа крови', artist: 'Кино', plays: '1.3М', artGradient: ['#18181e', '#241e28'] },
  { id: '6', rank: 6, title: 'Романс', artist: 'Мумий Тролль', plays: '1.1М', artGradient: ['#201e18', '#281e1a'] },
  { id: '7', rank: 7, title: 'Выхода нет', artist: 'Сплин', plays: '980К', artGradient: ['#18201e', '#1e2820'] },
  { id: '8', rank: 8, title: 'Ночной патруль', artist: 'Сплин', plays: '870К', artGradient: ['#1e1a18', '#241e20'] },
];

export const rooms = [
  {
    id: '1',
    name: 'Рок 90-х',
    listeners: 14,
    currentTrack: 'Кино — Перемен',
    hostGradient: ['#1a1010', '#100a18'],
  },
  {
    id: '2',
    name: 'Вечерняя прогулка',
    listeners: 7,
    currentTrack: 'Земфира — Малиновка',
    hostGradient: ['#202a20', '#1a2028'],
  },
  {
    id: '3',
    name: 'Инструментал',
    listeners: 23,
    currentTrack: 'Nautilus — Прогулки по воде',
    hostGradient: ['#202a2a', '#1a201a'],
  },
];

export const currentTrack = {
  id: '1',
  title: 'Осенний дождь',
  artist: 'Кино',
  album: 'Последний герой',
  duration: '3:42',
  progress: 0.65,
  currentTime: '2:25',
  artGradient: ['#1e1818', '#281e24'],
};

export const lyrics = [
  { id: 1, text: 'Асфальт под ногами как чёрный лёд' },
  { id: 2, text: 'Ночь остаётся здесь, а я иду вперёд' },
  { id: 3, text: 'Осенний дождь смывает пыль с дорог' },
  { id: 4, text: 'И где-то там, за поворотом — новый порог' },
  { id: 5, text: '' },
  { id: 6, text: 'Я ищу тебя в толпе прохожих лиц' },
  { id: 7, text: 'В отражении витрин, в полёте птиц' },
  { id: 8, text: 'Осенний дождь смывает все следы' },
  { id: 9, text: 'Остаются лишь слова и свет звезды' },
  { id: 10, text: '' },
  { id: 11, text: 'Вперёд, вперёд, сквозь серый этот час' },
  { id: 12, text: 'Осенний дождь не разлучит нас' },
];

export const queue = [
  { id: '1', title: 'Перемен', artist: 'Кино', duration: '4:15', artGradient: ['#181e18', '#1e2428'] },
  { id: '2', title: 'Группа крови', artist: 'Кино', duration: '3:58', artGradient: ['#18181e', '#241e28'] },
  { id: '3', title: 'Малиновка', artist: 'Земфира', duration: '3:33', artGradient: ['#181e1e', '#1e2824'] },
  { id: '4', title: 'Ариведерчи', artist: 'Земфира', duration: '4:02', artGradient: ['#201a1c', '#1c1a20'] },
  { id: '5', title: 'Спид', artist: 'Земфира', duration: '3:51', artGradient: ['#1a1e20', '#201824'] },
];
