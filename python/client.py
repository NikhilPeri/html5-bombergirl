from python.gym_bomberbot.env import BomberbotEnv

if __name__ == '__main__':
    env = BomberbotEnv(port=3000, create_server=False)
    env.reset()
    env.step(['up1', 'bomb1'])
    env.close()
