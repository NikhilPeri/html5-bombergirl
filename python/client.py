import numpy as np

from python.agents import RandomAgent, PolicyAgent
from python.gym_bomberbot.env import BomberbotEnv

if __name__ == '__main__':
    agent = PolicyAgent()
    env = BomberbotEnv()
    try:
        for i in range(1000):
            env.reset()
            observation, done = env.observation(), False
            while not done:
                actions = agent.choose_action(observation)
                next_observation, reward, done = env.step(actions)

                agent.store_transition(observation, actions, reward)
                observation = next_observation

            cost = agent.learn()
            print(cost)

    except Exception as e:
        print(e)
    finally:
        env.close()
