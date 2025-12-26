import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

type GameRole = 'citizen' | 'commissar' | 'doctor' | 'suicide' | 'prostitute' | 'maniac' | 'homeless' | 'sergeant' | 'lawyer' | 'lucky' | 'kamikaze';

type Player = {
  id: string;
  name: string;
  role?: GameRole;
  isAlive: boolean;
  votes?: number;
};

type Room = {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
};

const ROLES = [
  { id: 'citizen', name: 'Мирный житель', icon: '👤', color: 'bg-green-500' },
  { id: 'commissar', name: 'Комиссар Каттани', icon: '👮', color: 'bg-blue-500' },
  { id: 'doctor', name: 'Доктор', icon: '💉', color: 'bg-green-400' },
  { id: 'suicide', name: 'Самоубийца', icon: '💣', color: 'bg-gray-500' },
  { id: 'prostitute', name: 'Проститутка', icon: '💋', color: 'bg-pink-500' },
  { id: 'maniac', name: 'Маньяк', icon: '🔪', color: 'bg-red-600' },
  { id: 'homeless', name: 'Бомж', icon: '🎒', color: 'bg-yellow-600' },
  { id: 'sergeant', name: 'Сержант', icon: '⚔️', color: 'bg-blue-600' },
  { id: 'lawyer', name: 'Адвокат', icon: '⚖️', color: 'bg-purple-500' },
  { id: 'lucky', name: 'Счастливчик', icon: '🍀', color: 'bg-green-600' },
  { id: 'kamikaze', name: 'Камикадзе', icon: '💥', color: 'bg-orange-600' },
];

export default function Index() {
  const [currentTab, setCurrentTab] = useState('lobby');
  const [gamePhase, setGamePhase] = useState<'night' | 'day' | 'voting'>('night');
  const [timer, setTimer] = useState(60);
  const [roomName, setRoomName] = useState('');

  const mockRooms: Room[] = [
    { id: '1', name: 'Байкеры СПБ', players: 8, maxPlayers: 12, status: 'waiting' },
    { id: '2', name: 'Ночные волки', players: 12, maxPlayers: 12, status: 'playing' },
    { id: '3', name: 'Легион', players: 5, maxPlayers: 10, status: 'waiting' },
  ];

  const mockPlayers: Player[] = [
    { id: '1', name: 'Волк', role: 'maniac', isAlive: true, votes: 0 },
    { id: '2', name: 'Медведь', role: 'doctor', isAlive: true, votes: 0 },
    { id: '3', name: 'Орёл', role: 'citizen', isAlive: false, votes: 0 },
    { id: '4', name: 'Лиса', role: 'commissar', isAlive: true, votes: 0 },
    { id: '5', name: 'Барс', role: 'citizen', isAlive: true, votes: 0 },
    { id: '6', name: 'Кобра', role: 'prostitute', isAlive: true, votes: 0 },
    { id: '7', name: 'Ворон', role: 'homeless', isAlive: true, votes: 0 },
    { id: '8', name: 'Сокол', role: 'lucky', isAlive: true, votes: 0 },
  ];

  const mockLeaderboard = [
    { id: '1', name: 'Волк', wins: 42, games: 78, winRate: 54 },
    { id: '2', name: 'Медведь', wins: 38, games: 65, winRate: 58 },
    { id: '3', name: 'Орёл', wins: 35, games: 70, winRate: 50 },
    { id: '4', name: 'Лиса', wins: 31, games: 60, winRate: 52 },
    { id: '5', name: 'Барс', wins: 28, games: 55, winRate: 51 },
  ];

  const mockAchievements = [
    { id: '1', name: 'Первая кровь', description: 'Убей первого игрока', icon: '🩸', unlocked: true },
    { id: '2', name: 'Выживальщик', description: 'Выживи 10 раз подряд', icon: '🛡️', unlocked: true },
    { id: '3', name: 'Маэстро', description: 'Выиграй 50 игр', icon: '🏆', unlocked: false },
    { id: '4', name: 'Детектив', description: 'Раскрой мафию 20 раз', icon: '🔍', unlocked: true },
    { id: '5', name: 'Легенда', description: 'Выиграй 100 игр', icon: '👑', unlocked: false },
  ];

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
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur">
              <TabsTrigger value="lobby" className="flex flex-col gap-1 py-3">
                <Icon name="Home" size={20} />
                <span className="text-xs">Лобби</span>
              </TabsTrigger>
              <TabsTrigger value="game" className="flex flex-col gap-1 py-3">
                <Icon name="Swords" size={20} />
                <span className="text-xs">Игра</span>
              </TabsTrigger>
              <TabsTrigger value="rating" className="flex flex-col gap-1 py-3">
                <Icon name="Trophy" size={20} />
                <span className="text-xs">Рейтинг</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col gap-1 py-3">
                <Icon name="User" size={20} />
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
                    className="bg-background/50 border-muted"
                  />
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold">
                    Создать
                  </Button>
                </div>
              </Card>

              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Доступные комнаты
                </h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {mockRooms.map((room) => (
                      <Card
                        key={room.id}
                        className="p-4 bg-card/80 backdrop-blur border border-muted hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{room.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="Users" size={16} />
                                {room.players}/{room.maxPlayers}
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
                            disabled={room.status === 'playing'}
                            className="bg-primary hover:bg-primary/80"
                          >
                            Войти
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="game" className="mt-6 space-y-4">
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
                  {gamePhase === 'voting' && (
                    <p className="text-sm text-muted-foreground mt-2">Голосуй за подозреваемого</p>
                  )}
                </div>
              </Card>

              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Игроки ({mockPlayers.filter((p) => p.isAlive).length}/{mockPlayers.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {mockPlayers.map((player) => (
                    <Card
                      key={player.id}
                      className={`p-3 backdrop-blur transition-all cursor-pointer ${
                        player.isAlive
                          ? 'bg-card/80 border border-muted hover:border-primary/50 hover:scale-105'
                          : 'bg-card/30 border border-destructive/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10 border-2 border-primary">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {player.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{player.name}</p>
                          {!player.isAlive && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <Icon name="Skull" size={12} />
                              Выбыл
                            </p>
                          )}
                        </div>
                      </div>
                      {gamePhase === 'voting' && player.isAlive && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Голосов: {player.votes}</span>
                          <Button size="sm" variant="destructive" className="h-6 text-xs">
                            Голосовать
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-card/80 backdrop-blur border border-primary/30">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Icon name="Shield" size={18} />
                  Твоя роль
                </h3>
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <span className="text-4xl">🔪</span>
                  <div>
                    <p className="font-bold text-lg">Маньяк</p>
                    <p className="text-xs text-muted-foreground">Убивай каждую ночь</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="rating" className="mt-6 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/20 to-secondary/10 backdrop-blur border-2 border-primary/50">
                <div className="text-center">
                  <h2 className="text-2xl font-black graffiti-text mb-2">🏆 Топ игроков</h2>
                  <p className="text-sm text-muted-foreground">Лучшие из лучших</p>
                </div>
              </Card>

              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {mockLeaderboard.map((player, index) => (
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
                            {player.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{player.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Побед: {player.wins}</span>
                            <span>Игр: {player.games}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{player.winRate}%</p>
                          <p className="text-xs text-muted-foreground">Винрейт</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="profile" className="mt-6 space-y-4">
              <Card className="p-6 bg-gradient-to-br from-card/90 to-accent/10 backdrop-blur border-2 border-accent/50 text-center">
                <Avatar className="h-24 w-24 mx-auto border-4 border-primary mb-4">
                  <AvatarFallback className="bg-primary/20 text-primary font-black text-4xl">
                    В
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-black graffiti-text">Волк</h2>
                <p className="text-sm text-muted-foreground">ID: #12345</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-3xl font-bold text-primary">42</p>
                    <p className="text-xs text-muted-foreground">Побед</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-secondary">78</p>
                    <p className="text-xs text-muted-foreground">Игр</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-accent">54%</p>
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
                  {mockAchievements.map((achievement) => (
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

              <Card className="p-4 bg-card/80 backdrop-blur border border-muted">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Icon name="BookOpen" size={18} />
                  Роли игры
                </h3>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {ROLES.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all"
                      >
                        <div className={`w-10 h-10 ${role.color} rounded-full flex items-center justify-center text-2xl`}>
                          {role.icon}
                        </div>
                        <p className="font-bold">{role.name}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <Button
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
