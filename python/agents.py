import numpy as np

import keras
from keras.layers import *
from keras.models import Model, load_model
from keras.optimizers import Adam

import keras.backend as K

from python.gym_bomberbot.env import ACTION_SPACE

class RandomAgent(object):
    def choose_action(self):
        return np.random.choice(ACTION_SPACE)

class PolicyAgent(object):
    def __init__(self, learning_rate=1e-2, model_file='tmp.h5'):
        self.learning_rate = learning_rate
        self.model_file = model_file
        # active
        self.state_memory = []
        self.action_memory = []
        self.reward_memory = []

        self.create_model()

    def create_model(self):
        reward = Input(shape=(1,))
        player_in = Input(shape=(1,), dtype=np.uint8)
        player = Lambda(lambda i: K.squeeze(K.one_hot(i, num_classes=4), axis=-2), output_shape=(4,))(player_in)

        board_in = Input(shape=(13, 17), dtype=np.uint8)
        board = Lambda(lambda i: K.one_hot(i, num_classes=10), output_shape=(13, 17, 10))(board_in)

        conv1 = Conv2D(64, (3, 3), data_format='channels_last')(board)
        conv1 = Conv2D(64, (3, 3), data_format='channels_last', activation='relu')(conv1)
        pool1 = MaxPooling2D((2, 2), data_format='channels_last')(conv1)

        conv2 = Conv2D(128, (3, 3), padding='same', data_format='channels_last')(pool1)
        conv2 = Conv2D(128, (3, 3), padding='same', data_format='channels_last', activation='relu')(conv2)
        pool2 = MaxPooling2D((2, 2), data_format='channels_last')(conv2)

        flat = Flatten()(pool2)

        dense1 = Concatenate()([flat, player])
        dense1 = Dense(64)(dense1)

        output = Dense(len(ACTION_SPACE), activation='softmax')(dense1)

        def policy_gradient(y_true, y_pred):
            y_pred = K.clip(y_pred, 1e-8, 1-1e-8)
            loss = y_true*K.log(y_pred)

            return K.sum(-loss*reward)

        self.policy_model = Model(inputs=[board_in, player_in, reward], outputs=[output])
        self.policy_model.compile(optimizer=Adam(lr=self.learning_rate), loss=policy_gradient)

        self.model =  Model(inputs=[board_in, player_in], outputs=[output])

    def choose_action(self, observation, players=[0, 1, 2, 3]):
        state = observation[np.newaxis, :]
        state = np.concatenate([state for i in players], axis=0)

        probabilities = self.model.predict([state, np.array(players)])

        action = [np.random.choice(ACTION_SPACE, p=probabilities[i]) for i in players]

        return action

    def store_transition(self, observation, action, reward):
        self.state_memory.append(observation)
        self.action_memory.append(action)
        self.reward_memory.append(reward)

    def learn(self):
        state_memory = np.array(self.state_memory)
        self.state_memory = []
        state_memory = np.repeat(state_memory, 4, axis=0)
        action_memory = np.array(self.action_memory).flatten()
        self.action_memory = []
        reward_memory = np.array(self.reward_memory)
        self.reward_memory = []

        action_memory = [ACTION_SPACE.index(a) for a in action_memory]
        action_memory = np.zeros([len(action_memory), len(ACTION_SPACE)])
        actions[np.arange(len(action_memory)), action_memory] = 1

        # Apply Discounted Future Reward
        R = np.zeros_like(reward_memory)
        for t in reward_memory.shape[0]:
            R_dis = np.zeros(4)
            discount = 1
            for k in range(t, reward_memory.shape[0]):
                R_dis += reward_memory[k] * discount
                discount *= self.gamma
            R[t] = R_dis
        mean = np.mean(R)
        std = np.std(R) if np.std(R) > 0 else 1
        R = (R - mean) / std

        cost = self.policy_model.train_on_batch([
            state_memory,
            np.tile([0,1,2,3], R.shape[0]),
            R.flatten()
        ], actions.flatten())

        return cost

    def save_model(self):
        self.policy_model.save(self.model_file)

    def load_model(self):
        self.policy_model = load_model(self.model_file)
