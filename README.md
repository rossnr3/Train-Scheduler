# Train Scheduler Homework Assignment

## Overview

This project uses Firebase to store train schedule data. The train schedule
data is displayed for the users, and kept current by updating the information
each minute. New train information may be entered by utilizing the form
contained on the schedule page. The display lists the trains in destination
order, similar to airline reservation displays.

## Adding Train Schedules

The application requires all data fields to be entered, or the new train
schedule will be rejected. Duplicate entries (a train/destination route)
are not permitted.

The train information entered must contain the name of the train, its
destination, the first daily scheduled train time, and the frequency
the train repeats the route.

The first daily scheduled train time must be entered in military time,
i.e. 14:00 instead of 2:00 PM or 04:00 instead of 4:00 AM. The frequency
entered must be in minutes, i.e. 120 for repeating every 2 hours. The
frequency range allowed is 10 minutes to 1440 minutes, which is every
24 hours.

Once accepted, the application will calculate and display the next arrival
time for the train, and the number of minutes until the arrival time.

Each train's schedule is recalculated and updated every minute.

## Resetting the page

Re-loading the page will not cause existing train schedules to be lost. All
trains entered will display their current status when the page is re-loaded.

## Multiple Users

The application will display all train schedules to all users utilizing the
application concurrently. Data entered by one user will be immediately
reflected on the schedules being viewed by other users.

### Link to the deployed game

[GitHub](https://rossnr3.github.io/Train-Scheduler/ "Train Scheduler")
