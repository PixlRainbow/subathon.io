# subathon.io
Just a really basic subathon countdown tracker for the Pedguin community
## Quick Start
Just visit https://pixlrainbow.github.io/subathon.io/ pog
## Developer Notice
If you want to debug this on your local machine, you will need to set up a basic static web server on http://localhost:8000, either using Express.js or using Python3 built-in http server. This is because of two reasons:
1. This project makes use of the HTML5 LocalStorage API to remember your login. Most web browsers will block access to this API if you are running from what it considers an "insecure location" (e.g. double clicking a file).
2. Twitch requires you to have a website landing page to return to after the login is complete. I have told Twitch to allow landing pages from two locations - on the address hosted by Github, and on localhost port 8000.

For example, if you have Python3 installed, just do:
```sh
# navigate to the root folder of this project
cd subathon.io
# start the Python3 built-in http server
python3 -m http.server
```
