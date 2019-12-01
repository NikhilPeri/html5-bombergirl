import numpy as np

from python.agents import RandomAgent
from python.gym_bomberbot.env import BomberbotEnv

if __name__ == '__main__':
    try:
        agent = RandomAgent()
        env = BomberbotEnv()
        env.reset()

        for i in range(1000):
            env.step([agent.act() for i in range(4)])
    except Exception as e:
        print(e)
    finally:
        env.close()
