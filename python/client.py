import numpy as np

from python.agents import RandomAgent, PolicyAgent
from python.gym_bomberbot.env import BomberbotEnv

if __name__ == '__main__':
    agent = PolicyAgent()
    env = BomberbotEnv()
    try:
        env.reset()
        observation, done = env.observation(), False
        while not done:
            actions = agent.choose_action(observation)
            next_observation, reward, done = env.step(actions)

            agent.store_transition(observation, actions, reward)
            observation = next_observation

        agent.learn()
    except Exception as e:
        print(e)
    finally:
        env.close()
