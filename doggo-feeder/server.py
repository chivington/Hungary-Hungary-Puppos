from sanic import Sanic, response
from step import Stepper
from relay import Relay
import os, time


app = Sanic(__name__)

@app.route('/doggo')
async def get(request):
    return await response.file('doggo.html')

@app.route('/favicon.ico')
async def get(request):
    return await response.file('favicon.ico')

@app.post('/treat')
async def post(request):
	step = 5
	dir = 4

	stepper = Stepper(step, dir, 0.0025)
	stepper.spin(100, stepper.CLKW)
	# stepper.spin(50, stepper.CCLKW)

	return response.json({
        "response": "You spin me right round! XD"
    })

@app.post('/open-door')
async def post(request):
	switch = 4

	relay = Relay(switch)
	relay.on()
	time.sleep(5)
	relay.off()

	return response.json({
        "response": "You opened the door!"
    })

@app.post('/close-door')
async def post(request):
	switch = 5

	relay = Relay(switch)
	relay.on()
	time.sleep(5)
	relay.off()

	return response.json({
        "response": "You closed the door!"
    })


if __name__ == '__main__':
    app.run(port=3003, debug=False)
