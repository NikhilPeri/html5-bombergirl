import cv2
import keras
import numpy as np
from skimage import filters
from scipy import signal

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from time import sleep

import gym

ACTION_SPACE = ['idle', 'up', 'down', 'left', 'right', 'bomb']
BOMB_KERNEL = np.array([
    [0,  0, .5, 0,  0],
    [0,  0, 1., 0,  0],
    [.5, 1, 1., 1, .5],
    [0,  0, 1., 0,  0],
    [0,  0, .5, 0,  0],
])

def soft_position(observation, player, sigma=5):
  position = (observation == player + 1).astype('float') + (observation == 11 + player).astype('float')
  return filters.gaussian(position, sigma, truncate=10)
def hard_position(observation, player):
    return (observation == player + 1).astype('float') + (observation == 11 + player).astype('float')

class BomberbotEnv(gym.Env):
  metadata = {'render.modes': ['headless', 'human']}

  def __init__(self, headless=False):
    chrome_options = Options()
    if headless:
      chrome_options.add_argument("--headless")

    self.driver = webdriver.Chrome(chrome_options=chrome_options, executable_path='python/chromedriver')
    self.driver.get('http://localhost:8000');
    sleep(1)
    self.steps = 0

  def step(self, player_actions):
    for player, action in enumerate(player_actions):
        if action != 'idle':
            cmd = 'gInputEngine.actionDown("{}{}")'.format(action, player)
            self.driver.execute_script(cmd)

    sleep(1/5.)

    for player, action in enumerate(player_actions):
        if action != 'idle':
            cmd = 'gInputEngine.actionUp("{}{}")'.format(action, player)
            self.driver.execute_script(cmd)

    observation = self.observation()

    player0_off, player1_off, player2_off, player3_off = [soft_position(observation, i, sigma=5) for i in range(4)]
    player0_def, player1_def, player2_def, player3_def = [hard_position(observation, i) for i in range(4)]

    bombs = (observation > 9 ).astype('float')
    bombs = signal.convolve2d(bombs, BOMB_KERNEL, mode='same')

    bomb_gain = np.array([
      (bombs * (player1_off + player2_off + player3_off)).mean(),
      (bombs * (player2_off + player3_off + player0_off)).mean(),
      (bombs * (player3_off + player0_off + player1_off)).mean(),
      (bombs * (player0_off + player1_off + player2_off)).mean(),
    ])

    bomb_loss = np.array([
      (bombs * player0_def).mean(),
      (bombs * player1_def).mean(),
      (bombs * player2_def).mean(),
      (bombs * player3_def).mean(),
    ])

    player_share = 1 #(player0_def + player3_def + player2_def + player3_def).sum() + 1e-8
    player_share = np.array([
      player0_def.sum() / player_share,
      player1_def.sum() / player_share,
      player2_def.sum() / player_share,
      player3_def.sum() / player_share,
    ])

    free_space = (observation < 4).astype('float') + (observation > 10).astype('float')
    free_space = np.array([
      (player0_off*free_space).sum(),
      (player1_off*free_space).sum(),
      (player2_off*free_space).sum(),
      (player3_off*free_space).sum(),
    ])

    corner_bomb_penalty = np.array([
      bombs[1][1],
      bombs[11][1],
      bombs[1][11],
      bombs[11][15],
    ])
    reward = player_share * (free_space - bomb_loss + bomb_gain)
    print(reward)
    done = np.array([(observation == i + 1).astype('int') + (observation == i + 11).astype('int') for i in range(4)]).sum() < 1
    self.steps += 1

    if self.steps > 300:
      done = True

    return observation, reward, done

  def observation(self):
    observation = self.driver.execute_script('return gGameEngine._observation();')
    observation = np.array(observation)
    return observation

  def reset(self):
    self.driver.execute_script('gGameEngine.menu.setMode("training")')
    sleep(1/5.)
    self.steps = 0

  def render(self):
    pass

  def close(self):
    self.driver.close()
