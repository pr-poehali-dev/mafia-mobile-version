import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import TelegramLogin from '@/components/TelegramLogin';
import * as api from '@/lib/api';

const ROLES = [
  { 
    id: 'mafia', 
    name: 'Мафия', 
    icon: '🔫', 
    color: 'bg-red-500',
    description: 'Злодеи города. Каждую ночь выбирают жертву. Побеждают, когда их столько же или больше, чем мирных. Количество мафии: 1 на каждые 4 игрока.'
  },
  { 
    id: 'citizen', 
    name: 'Мирный житель', 
    icon: '👤', 
    color: 'bg-green-500',
    description: 'Обычный житель города. Днём голосует за изгнание подозрительных. Побеждает, когда все мафиози и маньяки мертвы. Появляется при большом количестве игроков.'
  },
  { 
    id: 'doctor', 
    name: 'Доктор', 
    icon: '💉', 
    color: 'bg-green-400',
    description: 'Есть с самого начала (4+ игрока). Каждую ночь лечит одного игрока. Если мафия выбрала его, игрок остаётся жив. Может лечить себя раз в игру.'
  },
  { 
    id: 'commissar', 
    name: 'Комиссар Каттани', 
    icon: '👮', 
    color: 'bg-blue-500',
    description: 'Появляется при 5+ игроках. Каждую ночь проверяет одного игрока и узнаёт, мафия он или нет. Помогает мирным найти преступников.'
  },
  { 
    id: 'maniac', 
    name: 'Маньяк', 
    icon: '🔪', 
    color: 'bg-red-600',
    description: 'Появляется при 6+ игроках. Каждую ночь убивает любого игрока. Играет сам за себя. Побеждает, когда остаётся один или с мирным.'
  },
  { 
    id: 'prostitute', 
    name: 'Проститутка', 
    icon: '💋', 
    color: 'bg-pink-500',
    description: 'Появляется при 7+ игроках. Каждую ночь идёт к одному игроку. Если к нему пришла мафия — оба остаются живы. Блокирует способности цели.'
  },
  { 
    id: 'lucky', 
    name: 'Счастливчик', 
    icon: '🍀', 
    color: 'bg-green-600',
    description: 'Появляется при 8+ игроках. Первая атака мафии или маньяка на него не срабатывает. Остаётся жив. Вторая атака убьёт его.'
  },
  { 
    id: 'sergeant', 
    name: 'Сержант', 
    icon: '⚔️', 
    color: 'bg-blue-600',
    description: 'Появляется при 9+ игроках. Один раз за игру может убить любого игрока ночью. Если убьёт мирного — теряет способность навсегда.'
  },
  { 
    id: 'homeless', 
    name: 'Бомж', 
    icon: '🎒', 
    color: 'bg-yellow-600',
    description: 'Появляется при 10+ игроках. Каждую ночь ночует у случайного игрока. Если мафия придёт убить его — убьют хозяина дома. Бомж выживет.'
  },
  { 
    id: 'lawyer', 
    name: 'Адвокат', 
    icon: '⚖️', 
    color: 'bg-purple-500',
    description: 'Появляется при 11+ игроках. Один раз за игру может спасти игрока от дневного голосования. Отменяет результаты голосования.'
  },
  { 
    id: 'suicide', 
    name: 'Самоубийца', 
    icon: '💣', 
    color: 'bg-gray-500',
    description: 'Появляется при 12+ игроках. Если его убивают ночью или линчуют днём, он забирает с собой одного случайного игрока. Опасен для всех.'
  },
  { 
    id: 'kamikaze', 
    name: 'Камикадзе', 
    icon: '💥', 
    color: 'bg-orange-600',
    description: 'Появляется при 13+ игроках. Днём может взорвать себя вместе с одним выбранным игроком. Оба умирают. Использует раз в игру.'
  },
];

export default function Index() {
  const [currentTab, setCurrentTab] = useState('profile');
  const [gamePhase] = useState<'night' | 'day' | 'voting'>('night');
  const [timer] = useState(60);
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<api.User | null>(null);
  const [rooms, setRooms] = useState<api.Room[]>([]);
  const [leaderboard, setLeaderboard] = useState<api.LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<api.Achievement[]>([]);
  const [currentRoom, setCurrentRoom] = useState<api.Room | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      loadUser(parseInt(savedUserId));
    }
  }, []);

  useEffect(() => {
    if (currentTab === 'lobby') {
      loadRooms();
    } else if (currentTab === 'rating') {
      loadLeaderboard();
    } else if (currentTab === 'profile' && currentUser) {
      loadAchievements(currentUser.id);
    }
  }, [currentTab, currentUser]);

  const loadUser = async (userId: number) => {
    try {
      const user = await api.getUser(userId);
      setCurrentUser(user);
      setCurrentTab('lobby');
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('userId');
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      toast({ title: 'Ошибка', description: 'Введи своё имя', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const user = await api.registerUser(username);
      setCurrentUser(user);
      localStorage.setItem('userId', user.id.toString());
      setCurrentTab('lobby');
      toast({ title: 'Успех!', description: `Добро пожаловать, ${user.username}!` });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать профиль', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (telegramUser: api.TelegramAuthData) => {
    setLoading(true);
    try {
      const user = await api.loginWithTelegram(telegramUser);
      setCurrentUser(user);
      localStorage.setItem('userId', user.id.toString());
      setCurrentTab('lobby');
      toast({ title: 'Успех!', description: `Добро пожаловать, ${user.username}!` });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message || 'Не удалось войти через Telegram', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await api.listRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({ title: 'Ошибка', description: 'Введи название комнаты', variant: 'destructive' });
      return;
    }

    if (!currentUser) return;

    setLoading(true);
    try {
      const room = await api.createRoom(roomName, currentUser.id);
      toast({ title: 'Комната создана!', description: `${room.name}` });
      setRoomName('');
      loadRooms();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать комнату', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await api.joinRoom(roomId, currentUser.id);
      const room = await api.getRoomInfo(roomId);
      setCurrentRoom(room);
      setCurrentTab('game');
      toast({ title: 'Успех!', description: 'Вы присоединились к комнате' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const loadAchievements = async (userId: number) => {
    try {
      const data = await api.getUserAchievements(userId);
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const handleAddBot = async () => {
    if (!currentRoom || !currentUser) return;

    setLoading(true);
    try {
      await api.addBot(currentRoom.id);
      const room = await api.getRoomInfo(currentRoom.id);
      setCurrentRoom(room);
      toast({ title: 'Бот добавлен!', description: 'Новый игрок присоединился' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setCurrentUser(null);
    setCurrentTab('profile');
    toast({ title: 'Выход', description: 'Ты вышел из аккаунта' });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] text-white flex items-center justify-center p-4">
        <div className="relative overflow-hidden w-full max-w-md">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 text-[200px] rotate-12 text-primary">🏍️</div>
            <div className="absolute bottom-10 right-10 text-[200px] -rotate-12 text-secondary">💀</div>
          </div>

          <Card className="relative z-10 p-8 bg-card/80 backdrop-blur border-2 border-primary/30 text-center">
            <h1 className="text-5xl font-black graffiti-text text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-2">
              МАФИЯ
            </h1>
            <p className="text-sm text-muted-foreground mb-8">Байкерское издание</p>

            <div className="space-y-6">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm text-muted-foreground mb-3">Войти через Telegram</p>
                <TelegramLogin
                  botName="MotoMafia_bot"
                  onAuth={handleTelegramAuth}
                  buttonSize="large"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Введи своё имя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  className="bg-background/50 border-muted text-center text-lg"
                />
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold text-lg py-6"
                >
                  {loading ? 'Загрузка...' : 'Начать играть 🏍️'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[200px] rotate-12 text-primary">🏍️</div>
          <div className="absolute bottom-10 right-10 text-[200px] -rotate-12 text-secondary">💀</div>
        </div>

        <div className="relative z-10 max-w-md mx-auto p-4 pb-20">
          <header className="py-6 text-center">
            <h1 className="text-5xl font-black graffiti-text text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              МАФИЯ
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Байкерское издание</p>
          </header>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur">
              <TabsTrigger value="lobby" className="flex flex-col gap-1 py-3">
                <Icon name="Home" size={18} />
                <span className="text-xs">Лобби</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex flex-col gap-1 py-3">
                <Icon name="BookOpen" size={18} />
                <span className="text-xs">Правила</span>
              </TabsTrigger>
              <TabsTrigger value="game" className="flex flex-col gap-1 py-3">
                <Icon name="Swords" size={18} />
                <span className="text-xs">Игра</span>
              </TabsTrigger>
              <TabsTrigger value="rating" className="flex flex-col gap-1 py-3">
                <Icon name="Trophy" size={18} />
                <span className="text-xs">Рейтинг</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col gap-1 py-3">
                <Icon name="User" size={18} />
                <span className="text-xs">Профиль</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lobby" className="mt-6 space-y-4">
              <Card className="p-4 bg-card/80 backdrop-blur border-2 border-primary/30">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Icon name="Plus" size={24} className="text-primary" />
                  Создать комнату
                </h2>
                <div className="space-y-3">
                  <Input
                    placeholder="Название комнаты"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                    className="bg-background/50 border-muted"
                  />
                  <Button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold"
                  >
                    {loading ? 'Создание...' : 'Создать'}
                  </Button>
                </div>
              </Card>

              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Доступные комнаты
                </h3>
                {rooms.length === 0 ? (
                  <Card className="p-8 bg-card/50 backdrop-blur text-center">
                    <p className="text-muted-foreground">Пока нет комнат. Создай первую!</p>
                  </Card>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {rooms.map((room) => (
                        <Card
                          key={room.id}
                          className="p-4 bg-card/80 backdrop-blur border border-muted hover:border-primary/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{room.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Icon name="Users" size={16} />
                                  {room.player_count || 0}/{room.max_players}
                                </span>
                                <Badge
                                  variant={room.status === 'playing' ? 'destructive' : 'default'}
                                  className="text-xs"
                                >
                                  {room.status === 'playing' ? 'Играют' : 'Ожидание'}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={room.status === 'playing' || loading}
                              onClick={() => handleJoinRoom(room.id)}
                              className="bg-primary hover:bg-primary/80"
                            >
                              Войти
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="mt-6 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/20 to-secondary/10 backdrop-blur border-2 border-primary/50">
                <div className="text-center">
                  <h2 className="text-2xl font-black graffiti-text mb-2">📖 Правила игры</h2>
                  <p className="text-sm text-muted-foreground">Роли и механики</p>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border border-primary/30">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Icon name="Info" size={20} className="text-accent" />
                  Как играть
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-primary font-bold">👥 Игроки:</span> Минимум 4 игрока для начала. Максимум не ограничен. Одинаковых ролей может быть несколько.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-accent font-bold">📱 Устройства:</span> 1 устройство = 1 участник в игре.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-primary font-bold">🌙 Ночь:</span> Мафия и активные роли выбирают действия. Мирные жители спят.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-secondary font-bold">☀️ День:</span> Обсуждение и поиск мафии. Делитесь подозрениями и уликами.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-accent font-bold">🗳️ Голосование:</span> Все голосуют за одного подозреваемого. Игрок с большинством голосов выбывает.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-green-500 font-bold">🏆 Победа мирных:</span> Когда все мафиози и маньяки мертвы.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-red-500 font-bold">💀 Победа мафии:</span> Когда мафии столько же или больше, чем мирных.
                  </p>
                </div>
              </Card>

              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Роли игры
                </h3>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {ROLES.map((role) => (
                      <Card
                        key={role.id}
                        className="p-4 bg-card/80 backdrop-blur border border-muted hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 ${role.color} rounded-full flex items-center justify-center text-2xl flex-shrink-0`}>
                            {role.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">{role.name}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="game" className="mt-6 space-y-4">
              {currentRoom ? (
                <>
                  <Card className="p-4 bg-gradient-to-br from-card/90 to-primary/10 backdrop-blur border-2 border-primary/50 spray-shadow">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-black graffiti-text">
                        {gamePhase === 'night' ? '🌙 Ночь' : gamePhase === 'day' ? '☀️ День' : '🗳️ Голосование'}
                      </h2>
                      <div className="flex items-center justify-center gap-2 text-4xl font-black">
                        <Icon name="Clock" size={32} className="text-secondary" />
                        <span>{timer}s</span>
                      </div>
                      <Progress value={(timer / 60) * 100} className="h-2" />
                    </div>
                  </Card>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Icon name="Users" size={20} />
                        Игроки ({currentRoom.players?.filter((p) => p.is_alive).length || 0}/{currentRoom.players?.length || 0})
                      </h3>
                      {currentRoom.host_id === currentUser.id && (currentRoom.players?.length || 0) < 20 && (
                        <Button
                          onClick={handleAddBot}
                          disabled={loading}
                          size="sm"
                          className="bg-primary/20 hover:bg-primary/30 border border-primary"
                        >
                          <Icon name="Plus" size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentRoom.players?.map((player) => (
                        <Card
                          key={player.id}
                          className={`p-3 backdrop-blur transition-all ${
                            player.is_alive
                              ? 'bg-card/80 border border-muted hover:border-primary/50'
                              : 'bg-card/30 border border-destructive/30 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 border-2 border-primary">
                              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                {player.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{player.username}</p>
                              {!player.is_alive && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                  <Icon name="Skull" size={12} />
                                  Выбыл
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Card className="p-8 bg-card/50 backdrop-blur text-center">
                  <Icon name="Swords" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Войди в комнату, чтобы начать игру</p>
                  <Button onClick={() => setCurrentTab('lobby')} className="mt-4 bg-primary">
                    Перейти в лобби
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rating" className="mt-6 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/20 to-secondary/10 backdrop-blur border-2 border-primary/50">
                <div className="text-center">
                  <h2 className="text-2xl font-black graffiti-text mb-2">🏆 Топ игроков</h2>
                  <p className="text-sm text-muted-foreground">Лучшие из лучших</p>
                </div>
              </Card>

              {leaderboard.length === 0 ? (
                <Card className="p-8 bg-card/50 backdrop-blur text-center">
                  <p className="text-muted-foreground">Пока нет данных. Сыграй первым!</p>
                </Card>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {leaderboard.map((player, index) => (
                      <Card
                        key={player.id}
                        className="p-4 bg-card/80 backdrop-blur border border-muted hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-3xl font-black ${
                              index === 0
                                ? 'text-yellow-400'
                                : index === 1
                                ? 'text-gray-300'
                                : index === 2
                                ? 'text-orange-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <Avatar className="h-12 w-12 border-2 border-primary">
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                              {player.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{player.username}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Побед: {player.total_wins}</span>
                              <span>Игр: {player.total_games}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{player.win_rate}%</p>
                            <p className="text-xs text-muted-foreground">Винрейт</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-6 space-y-4">
              <Card className="p-6 bg-gradient-to-br from-card/90 to-accent/10 backdrop-blur border-2 border-accent/50 text-center">
                <Avatar className="h-24 w-24 mx-auto border-4 border-primary mb-4">
                  <AvatarFallback className="bg-primary/20 text-primary font-black text-4xl">
                    {currentUser.username[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-black graffiti-text">{currentUser.username}</h2>
                <p className="text-sm text-muted-foreground">ID: #{currentUser.id}</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-3xl font-bold text-primary">{currentUser.total_wins}</p>
                    <p className="text-xs text-muted-foreground">Побед</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-secondary">{currentUser.total_games}</p>
                    <p className="text-xs text-muted-foreground">Игр</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-accent">
                      {currentUser.total_games > 0 ? Math.round((currentUser.total_wins / currentUser.total_games) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Винрейт</p>
                  </div>
                </div>
              </Card>

              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Icon name="Award" size={20} />
                  Достижения
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {achievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className={`p-4 backdrop-blur transition-all ${
                        achievement.unlocked
                          ? 'bg-card/80 border border-primary/50'
                          : 'bg-card/30 border border-muted/30 opacity-50'
                      }`}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-4xl">{achievement.icon}</div>
                        <p className="font-bold text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}