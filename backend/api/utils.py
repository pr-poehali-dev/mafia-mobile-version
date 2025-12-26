import random

def assign_roles(player_count: int) -> list[str]:
    """
    Распределение ролей на основе количества игроков.
    Минимум: 4 игрока (1 мафия, 2 мирных, 1 доктор).
    С ростом числа игроков добавляются новые роли.
    Одинаковых ролей может быть несколько.
    """
    
    if player_count < 4:
        raise ValueError("Минимум 4 игрока для начала игры")
    
    roles = []
    
    mafia_count = max(1, player_count // 4)
    roles.extend(['mafia'] * mafia_count)
    
    roles.append('doctor')
    
    if player_count >= 5:
        roles.append('commissar')
    
    if player_count >= 6:
        roles.append('maniac')
    
    if player_count >= 7:
        roles.append('prostitute')
    
    if player_count >= 8:
        roles.append('lucky')
    
    if player_count >= 9:
        roles.append('sergeant')
    
    if player_count >= 10:
        roles.append('homeless')
    
    if player_count >= 11:
        roles.append('lawyer')
    
    if player_count >= 12:
        roles.append('suicide')
    
    if player_count >= 13:
        roles.append('kamikaze')
    
    remaining = player_count - len(roles)
    
    if remaining > 0:
        special_roles = ['doctor', 'commissar', 'lucky', 'sergeant']
        for i in range(remaining):
            if i < len(special_roles):
                roles.append(special_roles[i])
            else:
                roles.append('citizen')
    
    random.shuffle(roles)
    return roles
