import RPi.GPIO as GPIO
from time import sleep

class Stepper():
	def __init__(self, step, dir, delay=0.01, steps=25):
		self.CLKW = 1
		self.CCLKW = 0
		self.stepPin = step
		self.dirPin = dir
		self.delay = delay
		self.stepsPerRev = steps
		self.currentDir = self.CLKW
		self.currentStep = 0
		GPIO.setmode(GPIO.BCM)
		GPIO.setwarnings(False)
		GPIO.setup(self.stepPin, GPIO.OUT)
		GPIO.setup(self.dirPin, GPIO.OUT)

	def spin(self, stepsToTake, direction):
		GPIO.output(self.dirPin, direction)
		for x in range(stepsToTake):
			GPIO.output(self.stepPin, GPIO.HIGH)
			self.currentStep += 1
			sleep(self.delay)
			GPIO.output(self.stepPin, GPIO.LOW)
			sleep(self.delay)
