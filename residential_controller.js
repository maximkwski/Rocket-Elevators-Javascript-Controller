let elevatorID = 1;
let floorRequestButtonID = 1;
let callButtonID = 1;

class Column {
    constructor(_id, _amountOfFloors, _amountOfElevators) {
        this.ID = _id;
        this.status = "0";
        this.amountOfFloors = _amountOfFloors;
        this.amountOfElevators = _amountOfElevators;
        this.elevatorList = [];
        this.callButtonList = [];

        this.createElevators(_amountOfFloors, _amountOfElevators);
        this.createCallButtons(_amountOfFloors);

    };

    createCallButtons(_amountOfFloors) {
        let buttonFloor = 1;
        for (let i = 0; i < _amountOfFloors; i++) {
            if (buttonFloor < _amountOfFloors) {
                let callUpButton = new CallButton(callButtonID, "off", buttonFloor, "up");
                this.callButtonList.push(callUpButton);
                callButtonID += 1;
            }
            if (buttonFloor > 1) {
                let callDownButton = new CallButton(callButtonID, "off", buttonFloor, "down");
                this.callButtonList.push(callDownButton);
                callButtonID += 1;
            }
            buttonFloor += 1;
        }

    }

    createElevators(_amountOfFloors, _amountOfElevators) {
        for (let i = 0; i < _amountOfElevators; i++) {
            let elevator = new Elevator(elevatorID, _amountOfFloors);
            //elevator.status = "idle";
            //elevator.currentFloor = 1;
            this.elevatorList.push(elevator);
            elevatorID++;
        }
    }

    //Simulate when a user press a button outside the elevator
    requestElevator(floor, direction) {
        let elevator = this.findElevator(floor, direction)
        elevator.floorRequestList.push(floor)
        elevator.move();
        elevator.operateDoors();

        return elevator
    }

    //We use a score system depending on the current elevators state. Since the bestScore and the referenceGap are 
    //higher values than what could be possibly calculated, the first elevator will always become the default bestElevator, 
    //before being compared with to other elevators. If two elevators get the same score, the nearest one is prioritized.
    findElevator(requestedFloor, requestedDirection) {
        let bestElevatorInformations = {
            bestElevator: null,
            bestScore: 5,
            referenceGap: 10000000
        }
        this.elevatorList.forEach(elevator => {
            //The elevator is at my floor and going in the direction I want
            if (requestedFloor == elevator.currentFloor && elevator.status == "stopped" && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, elevator, bestElevatorInformations, requestedFloor)
            } //The elevator is lower than me, is coming up and I want to go up
            else if (requestedFloor > elevator.currentFloor && elevator.direction == "up" && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            } //The elevator is higher than me, is coming down and I want to go down
            else if (requestedFloor < elevator.currentFloor && elevator.direction == "down" && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            } //The elevator is idle
            else if (elevator.status == "idle") {
                //bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestElevatorInformations, requestedFloor)
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestElevatorInformations, requestedFloor)
            } //The elevator is not available, but still could take the call if nothing better is found
            else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, elevator, bestElevatorInformations, requestedFloor)
            }

        });
        return bestElevatorInformations.bestElevator;
    }

    //checkIfElevatorIsBetter(scoreToCheck, newElevator, bestScore, referenceGap, bestElevator, floor) {
    checkIfElevatorIsBetter(scoreToCheck, newElevator, bestElevatorInformations, floor) {
        if (scoreToCheck < bestElevatorInformations.bestScore) {
            bestElevatorInformations.bestScore = scoreToCheck;
            bestElevatorInformations.bestElevator = newElevator;
            bestElevatorInformations.referenceGap = Math.abs(newElevator.currentFloor - floor);
        } else if (bestElevatorInformations.bestScore == scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor);

            if (bestElevatorInformations.referenceGap > gap) {
                bestElevatorInformations.bestScore = scoreToCheck;
                bestElevatorInformations.bestElevator = newElevator;
                bestElevatorInformations.referenceGap = gap;
            }
        }
        // let elevatorResult = {
        //     bestElevator: bestElevator,
        //     bestScore: bestScore,
        //     referenceGap: referenceGap
        // }
        return bestElevatorInformations;
    }

}

class Elevator {
    constructor(_id, _amountOfFloors) {
        this.ID = _id;
        this.status = "";
        this.amountOfFloors = _amountOfFloors;
        this.currentFloor = 1;
        this.direction = null;
        this.door = new Door(_id, "closed");
        this.floorRequestButtonList = [];
        this.floorRequestList = [];

        this.createFloorRequestButtons(_amountOfFloors);
    }
    createFloorRequestButtons(_amountOfFloors) {
            let buttonFloor = 1;
            for (let i = 0; i < _amountOfFloors; i++) {
                let floorRequestButton = new FloorRequestButton(floorRequestButtonID, "off", buttonFloor);
                this.floorRequestButtonList.push(floorRequestButton);
                buttonFloor += 1;
                floorRequestButtonID += 1;
            }
        }
        //Simulate when a user press a button inside the elevator
    requestFloor(floor) {
        this.floorRequestList.push(floor)
        this.move();
        this.operateDoors();
    }
    move() {
        while (this.floorRequestList.length) {
            let destination = this.floorRequestList[0];
            let screenDisplay = 0;
            this.status = "moving";
            if (this.currentFloor < destination) {
                this.direction = "up";
                this.sortFloorList();
                while (this.currentFloor < destination) {
                    this.currentFloor += 1;
                    screenDisplay = this.currentFloor;
                }
            } else if (this.currentFloor > destination) {
                this.direction = "down";
                this.sortFloorList();
                while (this.currentFloor > destination) {
                    this.currentFloor -= 1;
                    screenDisplay = this.currentFloor;
                }
            }
            this.status = "stopped";
            this.floorRequestList.shift();
        }
        this.status = "idle";
    }

    sortFloorList() {
        if (this.direction = "up") {
            this.floorRequestList.sort(function(a, b) { return a - b });
        } else { this.floorRequestList.sort(function(a, b) { return b - a }) }
    }

    operateDoors() {
        let door = new Door();
        door.status = "opened";


        //WHAIT 5 SECONDS
        // if (totalPeople < weightLimit) {
        //     door.status = "closing";
        //     if (!door.obstruction) {
        //         door.status = "closed"
        //     } else { this.operateDoors() };
        // } else {
        //     while (this.totalPeople > this.weightLimit) {
        //         this.overweightAlarm = "on";
        //     }
        //     this.operateDoors();
        // }

    }
}

class CallButton {
    constructor(_id, _floor, _direction) {
        this.ID = _id;
        this.floor = _floor;
        this.direction = _direction;

    }

}

class FloorRequestButton {
    constructor(_id, _floor) {
        this.ID = _id;
        this.floor = _floor;
        this.status = "";

    }

}

class Door {
    constructor(_id) {
        this.ID = _id;
        this.status = "";
        this.obstruction;
    }

}


// let column = new Column(1, 10, 2);
// column.elevatorList[0].currentFloor = 2
// column.elevatorList[0].status = 'idle'
// column.elevatorList[1].currentFloor = 6
// column.elevatorList[1].status = 'idle'

// column.requestElevator(3, "up")

module.exports = { Column, Elevator, CallButton, FloorRequestButton, Door }