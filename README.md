# Nannup Festival Schedule Interactive Website

An interactive website that allows users to browse the Nannup Festival schedule, select events they're interested in, and generate calendar (ICS) files for those events.

## Features

- View the complete Nannup Festival schedule (Feb 28 - Mar 2, 2025)
- Filter events by day or venue
- Search for specific artists, events, or keywords
- Select multiple events you're interested in attending
- Generate ICS calendar files for selected events that can be imported into any calendar application

## Getting Started

### Prerequisites

No special requirements are needed to run this application. It uses plain HTML, CSS, and JavaScript.

### Installation

1. Clone this repository or download the files
2. Ensure the `schedule.json` file is in the same directory as the other files
3. Open the `index.html` file in your web browser

## Usage

1. When you first open the application, all events from the festival will be displayed
2. Use the dropdown menu to filter events by day or venue
3. Use the search bar to find specific artists or events
4. Check the boxes for events you're interested in attending
   - You can use the "Select All" or "Deselect All" buttons for quick selection
5. Click the "Generate Calendar Invites" button to download an ICS file
6. Import the ICS file into your calendar application (Google Calendar, Outlook, Apple Calendar, etc.)

## Data Structure

The application reads the festival schedule from the `schedule.json` file, which contains a structured representation of all events. The data is organized by:

- Day (e.g., "Friday 28.02.2025")
- Venue (e.g., "The Amphitheatre", "Tigerville")
- List of events/activities at each venue with:
  - Artist/activity name
  - Performance time
  - Additional details where applicable

If you need to update the schedule data, simply modify the `schedule.json` file while maintaining the same structure.

## Technical Details

The application is built using:
- HTML5 for structure
- CSS3 for styling
- JavaScript (ES6) for functionality
- ical.js library for generating calendar files

The code parses the date and time information from the schedule to create proper date objects that can be used in the calendar files.

## Browser Compatibility

This application should work on all modern browsers that support ES6 JavaScript.

## License

This project is open source and available under the MIT License.

---

Created for the Nannup Festival 2025 schedule.
