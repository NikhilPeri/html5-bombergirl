import cv2
import keras
import numpy as np
from skimage import filters

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from time import sleep

import gym

ACTION_SPACE = ['idle', 'up', 'down', 'left', 'right', 'bomb']

def soft_position(observation, player):
  position = (observation == player).astype('float')
  return filters.gaussian(position, 5, truncate=10)

class BomberbotEnv(gym.Env):
  metadata = {'render.modes': ['headless', 'human']}

  def __init__(self, headless=False):
    chrome_options = Options()
    if headless:
      chrome_options.add_argument("--headless")

    self.driver = webdriver.Chrome(chrome_options=chrome_options, executable_path='python/chromedriver')
    self.driver.get('http://localhost:8000');
    sleep(1)

  def step(self, player_actions):
    for player, action in enumerate(player_actions):
        if action != 'idle':
            cmd = 'gInputEngine.actionDown("{}{}")'.format(action, player)
            self.driver.execute_script(cmd)

    sleep(1/30.)

    for player, action in enumerate(player_actions):
        if action != 'idle':
            cmd = 'gInputEngine.actionUp("{}{}")'.format(action, player)
            self.driver.execute_script(cmd)

    observation = self.driver.execute_script('return gGameEngine._observation();')
    observation = np.array(observation)

    player0, player1, player2, player3 = [soft_position(observation, i) for i in range(4)]
    player0_bombs, player1_bombs, player2_bombs, player3_bombs = [(observation == 10 + i).astype('float') for i in range(4)]

    preservation = (observation == 5).astype('float').sum() / 120. # remaining wood

    bomb_gain = np.array([
      (player0_bombs * (player1 + player2 + player3)).mean(),
      (player1_bombs * (player2 + player3 + player0)).mean(),
      (player2_bombs * (player3 + player0 + player1)).mean(),
      (player3_bombs * (player0 + player1 + player2)).mean()
    ])

    bomb_loss = np.array([
      (player0 * (player1_bombs + player2_bombs + player3_bombs)).mean(),
      (player1 * (player2_bombs + player3_bombs + player0_bombs)).mean(),
      (player2 * (player3_bombs + player0_bombs + player1_bombs)).mean(),
      (player3 * (player0_bombs + player1_bombs + player2_bombs)).mean(),
    ])

    player_share = (player0 + player1 + player2 + player3).sum() + 1e-8
    player_share = np.array([
      player0.sum() / player_share,
      player1.sum() / player_share,
      player2.sum() / player_share,
      player3.sum() / player_share,
    ])

    reward = player_share + preservation + bomb_gain - bomb_loss
    done = observation.min() > 3

    return np.clip(observation, 0, 10), reward, done

  def observation(self):
    observation = self.driver.execute_script('return gGameEngine._observation();')
    observation = np.array(observation)
    return np.clip(observation, 0, 10)

  def reset(self):
    self.driver.execute_script('gGameEngine.menu.setMode("training")')

  def render(self):
    pass

  def close(self):
    self.driver.close()
