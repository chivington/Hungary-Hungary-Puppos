<p align="center">
  <img width='350' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/hungry-hungry-doggos.png' alt='Hungry Hungry Doggos Logo'/>
</p>

# Hungry-Hungry-Doggos
![Build Status](https://img.shields.io/badge/build-Stable-green.svg)
![License](https://img.shields.io/badge/license-NONE-lime.svg)

A raspberry pi based automation system for dispensing food, water and treats for my pup while I'm at work.
<br/><br/><br/>

## Contents
* [Overview](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#overview)
* [Demos](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#demos)
* [Prerequisites](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#prerequisites)
* [Installation](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#installation)
* [Usage](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#usage)
* [Authors](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#authors)
* [Contributing](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#contributing)
* [Acknowledgments](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#acknowledgments)
* [License](https://github.com/chivington/Hungry-Hungry-Doggos/tree/master#license)
<br/>


## Overview
The Hungry, Hungry Doggos automation system includes:

1. food dispenser
2. water dispenser
3. treat dispenser
4. door opener
5. dog's room camera

I created this automation system because I am working 12 hr days and wanted to be able to feed Mullis and let him out during the day. Currently, the camera feed and treat dispenser are operational. Contact me by email to find out how to access the camera feed and controls, so you can feed him a treat.

The hardware and code are in place to operate the door opening system, but I'm printing worm gears because the motors are salvaged from cordless power tools to save money and make the system more reproducible. Instead of buying high torque motors, which are very expensive, a gearing system will enable the use of cheap, low torque motors to open & close the deadbolt and door.

<br/>
The system consists of:

1. An Nginx server that serves the main app
2. A Motion server that serves the camera feed
3. A Sanic server that serves the controls UI
4. A Unity web app for UI (See [Unity](https://github.com/chivington/Unity) for details)
5. A MySQL database for credentials

Nginx serves the main app and proxies to the other servers for the camera feed and controls UI, which are embedded in the main app. The main app is a custom web app, made using the [Unity](https://github.com/chivington/Unity) UI/state management framework I developed. Sanic is chosen for the controls due to it's asynchronous nature, which allows me to call controls subroutines without tying up threads. The MySQL database stores credentials, which the app API validates for access to the controls UI.
<br/>


## Demos
<p align="center"><a href='https://www.youtube.com/shorts/ociCMAOihpY'>Treat Dispenser Demo Video</a></p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/treat-dispenser/thmubs/treat-dispenser-demo.jpg' alt='Treat Dispenser Demo Video'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=4pwwZXnbxE4'>Treat Dispenser Base Video</a></p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/treat-dispenser/thmubs/treat-dispenser-base.jpg' alt='Treat Dispenser Base Video'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=_TVUuBkYftk'>Treat Dispenser Top Mk1</a></p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/treat-dispenser/thmubs/treat-dispenser-top-mk1.jpg' alt='Treat Dispenser Top Mk1'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=4pwwZXnbxE4'>Pupdate 1</a></p>
<p align="center">He's helped enough. Time for a break.</p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/pupdates/thmubs/pupdate-1.jpg' alt='Pupdate 1'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=9fRc9NTDaVI'>Treat Dispenser Mounted and Wired</a></p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/treat-dispenser/thmubs/treat-dispenser-mounted-and-wired.jpg' alt='Treat Dispenser Mounted and Wired'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=4pwwZXnbxE4'>Pupdate 2</a></p>
<p align="center">Pup break is going well.</p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/pupdates/pupdate-2.jpg' alt='Pupdate 1'/>
</p><br/>

<p align="center"><a href='https://www.youtube.com/watch?v=9fRc9NTDaVI'>Treat Dispenser Top Mk2</a></p>
<p align="center">
	<img height='300' src='https://github.com/chivington/Hungry-Hungry-Doggos/blob/main/media/treat-dispenser/pics/treat-dispenser-top-mk2.jpg' alt='Treat Dispenser Top Mk2'/>
</p><br/>



## Prerequisites
  * None
<br/><br/>


## Installation
```bash
  git clone https://github.com/chivington/Hungry-Hungry-Doggos.git
```
<br/>


## Usage
This repo is only meant for viewing, although anyone is free to download and modify for their purposes. If you want to feed Mullis a treat, contact me by [email](j.chivington@ieee.org) for a temporary password to access the camera feed and controls UI at [chivington.casa](http://chivington.casa:3000).

Feel free to ask me questions on [GitHub](https://github.com/chivington)
<br/><br/>


## Authors
* **Johnathan Chivington:** [Web](https://chivington.net) or [GitHub](https://github.com/chivington)

## Contributing
Not currently accepting outside contributors, but feel free to use as you wish.

## License
There is currently no license associated with this content.
<br/><br/>
