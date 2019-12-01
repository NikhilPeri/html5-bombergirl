from subprocess import Popen
import requests
import gym
import sys
import json

class BomberbotEnv(gym.Env):
  metadata = {'render.modes': ['human']}

  def __init__(self, host='127.0.0.1', port=6969, create_server=True):
    if create_server:
      self.server = Popen(['node', 'server.js', '--host', host, '--port', str(port)], stdout=sys.stdout, shell=True)
      print('Node server running PID: {}'.format(self.server.pid))
    else:
      self.server = None

    self.server_url = 'http://{}:{}'.format(host, port)
    self.client = requests.Session()

  def step(self, actions):
    step = self.client.post(self.server_url + '/step', data={'actions': actions})
    observation = None
    reward = 0

    done = False
    info = None

    return observation, reward, done, info

  def reset(self):
    reset = self.client.post(self.server_url + '/reset')
    return reset.ok

  def render(self):
    pass

  def close(self):
    if self.server:
      self.server.terminate()
    self.client.close()
