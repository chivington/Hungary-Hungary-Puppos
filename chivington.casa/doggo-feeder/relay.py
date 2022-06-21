import RPi.GPIO as GPIO
from time import sleep

class Relay():
	def __init__(self, switch):
		self.switchPin = switch
		GPIO.setmode(GPIO.BCM)
		GPIO.setwarnings(False)
		GPIO.setup(self.switchPin, GPIO.OUT)

	def on(self):
		GPIO.output(self.switchPin, GPIO.HIGH)

	def off(self):
		GPIO.output(self.switchPin, GPIO.LOW)
