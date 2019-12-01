import numpy as np

class RandomAgent(object):
    def act(self):
        movement_vector = np.zeros(4)
        movement_vector[np.random.randint(4)] = 1

        bomb_vector = np.array([0])
        return np.concatenate([movement_vector, bomb_vector])
