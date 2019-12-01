from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from time import sleep

import gym

class BomberbotEnv(gym.Env):
  metadata = {'render.modes': ['headless', 'human']}

  def __init__(self):
    self.action_space = ['up', 'down', 'left', 'right', 'bomb']

    self.driver = webdriver.Chrome('python/chromedriver')
    self.driver.get('http://localhost:8000');
    sleep(1)
    self.driver.execute_script('gGameEngine.menu.setMode("training")')

  def step(self, player_actions):
    for player, actions in enumerate(player_actions):
      for a, name in zip(actions, self.action_space):
        jsTrue =  'true' if a == 1 else 'false'
        self.driver.execute_script('gInputEngine.actions["{}{}"]={};'.format(name, player, jsTrue))

    observation = self.driver.execute_script('return gGameEngine._observation();')
    
    import pdb; pdb.set_trace()


  def reset(self):
    self.driver.execute_script('gGameEngine.menu.setMode("training")')

  def render(self):
    pass

  def close(self):
    self.driver.close()
