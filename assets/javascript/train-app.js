/*******************************************************************************
 * Script for Firebase Assignment - Train Scheduler
*******************************************************************************/

$(document).ready(function() {                  // Wait on document to load

    /***************************************************************************
     * Application variables
    ***************************************************************************/
    const config = {                            // Firebase configuration
        apiKey: "AIzaSyDzpZckBMQaqDZudVSjFqYsf4DtXcM5V2I",
        authDomain: "train-scheduler-83ae9.firebaseapp.com",
        databaseURL: "https://train-scheduler-83ae9.firebaseio.com",
        projectId: "train-scheduler-83ae9",
        storageBucket: "train-scheduler-83ae9.appspot.com",
        messagingSenderId: "999079684652"
    };
    let databaseRef = null;                     // Ref to Firebase database

    let inputName = "";                         // Form input variables
    let inputDestination = "";
    let inputFirstTime = "";
    let inputFrequency = 0;

    const minValidHour = 0;                     // Validation values
    const maxValidHour = 23;
    const minValidMin = 0
    const maxValidMin = 59;
    const minFrequency = 10;                    
    const maxFrequency = 60 * 24;

    let trainKey = "";                          // Converted input values                          
    let trainTimeHr = minValidHour;
    let trainTimeMin = minValidMin;
    let trainFrequency = minFrequency;

    let trains = [];                            // Array of existing trains

    class Train {                               // Train object
        constructor(key, name, destination, hour, minutes, frequency) {
            this.key = key;                     // unique key of name + dest
            this.sortKey = destination.toLowerCase();
            this.name = name;
            this.destination = destination;
            this.hour = hour;                   // first scheduled time
            this.minutes = minutes;
            this.frequency = frequency;         // daily frequency
            this.nextArrival = "";              // next arrival time
            this.minAway = 0;                   // minutes left to arrival
        }
    }

    let errors = [];                            // validation errors 

    const appInterval = 1000 * 60;              // Timing variables
    let appTimer = null;                        // use to clear timer                        
    let currentHr = 0;                          
    let currentMin = 0;

    /***************************************************************************
     * Helper Functions
    ***************************************************************************/
    // Determine if an input string value is an integer, and within a valid 
    // inclusive range.
    //      value: string, value to be tested
    //      minInclusive: integer, inclusive minimum value
    //      maxInclusive: integer, inclusive maximum value
    //      description: string, value identifier for error message
    //      returns: true = passed; otherwise false
    function validRange(value, minInclusive, maxInclusive, description) {
        let tempValue = parseInt(value);
        if (isNaN(tempValue) 
            || tempValue < minInclusive 
            || tempValue > maxInclusive) {
            errors.push(description + " is invalid. "
                + "It must be an integer value between "
                + minInclusive + " and " + maxInclusive +".");
                return false;
        }
        return true;
    }

    // Determine if train frequency is valid.
    // It is entered in minutes and must fall within a specified inclusive 
    // range.
    //      returns: true = frequency passed; false = frequency failed
    function validFrequency() {
        if (!validRange(inputFrequency, minFrequency, maxFrequency, 
            "Train frequency")) {
                return false;            
        }
        trainFrequency = parseInt(inputFrequency);
        return true;
    }

    // Determine if the first time for the train is valid
    // It is entered as military time 04:00 for AM and 16:00 for PM
    // Single digit values are allowed, as long as they convert.   
    //      returns: true = valid time; false = invalid time 
    function validTime() {
        let timeArr = inputFirstTime.split(":");
        if (timeArr.length != 2) {
            errors.push(
                "First time must be formatted as 'HH:MM' in military time.");
            return false;
        }
        if (!validRange(timeArr[0], minValidHour, maxValidHour, 
            "First time hour")
            || !validRange(timeArr[1], minValidMin, maxValidMin, 
            "First time minute")) {
                return false;
            }
        trainTimeHr = parseInt(timeArr[0]);
        trainTimeMin = parseInt(timeArr[1]);
        return true;
    }

    // Determine if the train being added is a duplicate
    // The train name + destination are used to create a key for each train.
    //      returns: true = duplicate, otherwise false
    function isDuplicate() {
        trainKey = inputName.toLowerCase() 
            + "=>" 
            + inputDestination.toLowerCase();
        let trainEntry = null;
        let result = false;
        for (let i = 0; i < trains.length; i++) {
            trainEntry = trains[i];
            if (trainEntry.key === trainKey) {
                errors.push(
                    "The train/destination entries create a duplicate schedule."
                );
                result = true;
                break;
            }
        }
        return result;
    }

    // Determine if anything was entered for an input field, and if not
    // set an error message.
    //      value: input field value
    //      fieldName: name of field for error message
    function isBlank(value, fieldName) {
        if (value.length === 0) {
            errors.push(`You must enter a ${fieldName}.`);
        }
    }

    // Ensure all fields were entered by checking each field for blank value
    function allFieldsEntered() {
        isBlank(inputName, "train name");       
        isBlank(inputDestination, "train destination");
        isBlank(inputFirstTime, "first train time");
        isBlank(inputFrequency, "train frequency");
    }

    // Validate the user's input to add a new train. 
    //      returns: true - all fields valid, otherwise false
    function inputFieldsAreValid() {
        errors.length = 0;                      // Clear any errors
        allFieldsEntered();                     // Ensure all fields entered
        if (errors.length > 0) {                // If field omitted notify user
            return false;
        }
        if (isDuplicate()) {                    // Ensure train isn't duplicate
            return false;
        }
        if (!validTime() || !validFrequency()) {  // Validate time & frequency
            return false;
        }
        return true;                            // Data passed validation
    }

    // Display validation errors to user
    function displayErrors() {
        let errMsg = "";
        for (let i = 0; i < errors.length; i++) {
            errMsg += errors[i] + "\n";
        }
        errMsg += "\nForm rejected.";
        alert(errMsg);
        errors.length = 0;
    }    

    // Clear input fields
    function clearInputs() {
        $("#name-input").val("");
        $("#dest-input").val("");
        $("#first-time").val("");
        $("#frequency").val(minFrequency);
        $("#name-input").focus();
    }

    // Format military time in hour and minutes to h:mm am/pm for display
    function formatTime(hour, min) {
        let amPM = "AM";
        let tempHr = hour.toString();
        let tempMin = min.toString();
        if (hour > 12) {
            tempHr = (tempHr - 12).toString();
            amPM = "PM";
        }
        if (min < 10) {
            tempMin = "0" + tempMin;
        }
        return tempHr + ":" + tempMin + " " + amPM; 
    }

    /***************************************************************************
     * Train Scheduling Functions
    ***************************************************************************/
    // Display the train's schedule and dynamically update the HTML
    //      train: reference to a Train object.
    function displayTrain(train) {
        console.log("Display Train:", train);
        let tr = "<tr>";
        tr += "<td>" + train.name + "</td>";
        tr += "<td>" + train.destination + "</td>";
        tr += "<td>" + train.frequency + "</td>";
        tr += "<td>" + train.nextArrival + "</td>";
        tr += "<td>" + train.minAway + "</td>";
        tr += "</tr>";
        console.log("tr:", tr);
        $("#train-schedule").append(tr);
    }

    // Calculate the schedule for the passed train
    // Calculates the minutes away from arrival and next scheduled 
    // arrival
    //      train: reference to a Train object
    function calculateSchedule(train) {
        let currentRelTime = currentHr * 60 + currentMin;   // convert rel minutes
        let trainRelTime = train.hour * 60 + train.minutes;

        // Has train left yet? If not, next arrival is first scheduled time
        if (currentRelTime < trainRelTime) {    
            train.minAway = trainRelTime - currentRelTime;
            train.nextArrival = formatTime(train.hour, train.minutes);
        // Has train begun its schedule? If so, use frequency to calculate
        // next arrival
        } else if (currentRelTime > trainRelTime) { // Train has left use freq.
            train.minAway = train.frequency - 
                ((currentRelTime - trainRelTime) % train.frequency);
            let tempHr = Math.floor((currentRelTime + train.minAway) / 60)
            if (tempHr > 24) {
                tempHr -= 24;
            }
            train.nextArrival = formatTime(tempHr, 
                (currentRelTime + train.minAway) % 60);
         // Train is due to arrive now - use current time
        } else {
            train.minAway = 0;
            train.nextArrival = formatTime(currentHr, currentMin);
        }
    }

    // Update the daily train schedule
    // Sort the train array by destination, calculate each train's schedule, 
    // and display the current schedule
    function displaySchedule() {
        trains.sort(function(a, b) {            // Sort trains by destination
            if (a.sortKey < b.sortKey) {
                return -1;
            } else if (b.sortKey > a.sortKey) {
                return 1;
            }
            return 0;
        });

        $("#train-schedule").empty();           // clear existing schedule
        for (let i = 0; i < trains.length; i++) {
            let train = trains[i];
            calculateSchedule(train);
            displayTrain(train);
        }
    }

    /***************************************************************************
     * Timing Functions
    ***************************************************************************/
    // Update the displayed application clock
    function updateClock() {
        currentMin++;
        if (currentMin > maxValidMin) {
            currentMin = 0;
            currentHr++;
            if (currentHr > maxValidHour) {
                currentHr = 0;
            }
        }
    }

    // Display the current time to the user
    function displayTime() {
        $("#schedule-clock").text(
            "Current Train Schedule - Time: "
            + formatTime(currentHr, currentMin));
    }

    // Interval Timer event handler
    // Update the application clock and display it. Refresh the schedule and 
    // display it.
    function timerFired() {
        updateClock();
        displayTime();
        displaySchedule();
    }

    // Initialize timing variables, set an interval timer, and display the
    // current time
    function initTiming() {
        currentHr = moment().hours();           
        currentMin = moment().minutes();
        appTimer = setInterval(timerFired, appInterval);
        displayTime();    
    }

    /***************************************************************************
     * Event Handlers
    ***************************************************************************/
    // Add a new train. Submit button was clicked.
    // Validate all input. If data entered is valid, create a new Train object
    // and add it to the database. If data errors are found, display them
    // to the user, rejecting the input.
    function addTrain(event) {
        event.preventDefault();                 // Prevent Submit propagation

        inputName = $("#name-input").val().trim();      // Save entered data
        inputDestination = $("#dest-input").val().trim();
        inputFirstTime = $("#first-time").val().trim();
        inputFrequency = $("#frequency").val().trim();

        if (inputFieldsAreValid()) {            // Validate entered train data
            let trainObj = new Train(trainKey, inputName, inputDestination,
                trainTimeHr, trainTimeMin, trainFrequency);
            databaseRef.ref().push(trainObj);
            clearInputs();
        } else {
            displayErrors();    
        }                       
    }

    // Child Added Event Handler
    // Called once for each child on initial load of data, and each time a new
    // child is added. Obtain the train object from the database, add it
    // to the trains array, and refresh the train schedule.
    function trainAdded(snapshot) {
        let trainObj = snapshot.val();
        trains.push(trainObj);
        displaySchedule();                  // Yes - display the schedule
    }

    /***************************************************************************
     * Application Entry Point - Begin Execution
    ***************************************************************************/
    $("#frequency").attr({                      // Initialize frequency range
        min: minFrequency.toString(),
        max: maxFrequency.toString()
    });

    firebase.initializeApp(config);             // Initialize firebase &
    databaseRef = firebase.database();          // ...save ref to database

    databaseRef.ref().on("child_added", trainAdded); // child added event handler 

    initTiming();                               // Initialize timing                               

    $("#add-train").on("click", addTrain);      // submit button event handler       

});