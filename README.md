# ai-car-neural-net

A code-along course from Professor Radu Mariescu-Istodor.

This project involved building a scrolling road, and a car that is controllable with the keyboard arrow keys. 

From there, collision impact sensors were then added to the car, and the neural network was trained to avoid colliding into the rear of other cars.

It can then drive itself, by moving forwards, backwards (brake), left and right.

The model will then create hundreds of instances of the car, and then select for a car which progresses the furthest along the road without colliding.

As you can see, some will immediately veer off the road, some will crash into the car infront.

The neural network will eventually create a car that does not veer from the road and will slow down before crashing into the car infront.

When a good model is found, this can then be saved and further improvements can be made.

The next steps for this project are to allow the car to overtake other cars without collisions.

View it here:
https://kierzio.github.io/ai-car-neural-net/
