window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof ICAL === 'undefined') {
            console.error('ICAL.js library failed to load properly. Calendar generation might not work.');
        } else {
            console.log('ICAL.js library loaded successfully.');
        }
    }, 1000); // Check after 1 second to allow for potential async loading
});
let events = [];
let currentId = 1;

fetch('schedule.json')
    .then(response => response.json())
    .then(data => {
        processScheduleData(data);
        populateCategoryFilter();
        displayEvents();
    })
    .catch(error => {
        console.error('Error loading schedule data:', error);
        const eventsList = document.getElementById('events-list');
        eventsList.innerHTML = `
            <div class="error-message">
                <h2>Error Loading Schedule</h2>
                <p>There was a problem loading the schedule data. Please try refreshing the page.</p>
                <p>Technical details: ${error.message}</p>
            </div>
        `;
    });

function processScheduleData(data) {
    events = [];

    Object.entries(data).forEach(([day, venues]) => {
        Object.entries(venues).forEach(([venue, activities]) => {
            activities.forEach(activity => {
                if (!activity.time) return;

                const title = activity.artist || activity.activity;
                if (!title) return;

                if (activity.details) return;

                const { startDate, endDate } = processTimeString(activity.time, day);

                const category = venue.replace(' (Free Venue)', '');

                let description = `${title} at ${venue} on ${day}`;

                if (activity.performers) {
                    description += `. Featuring: ${activity.performers.join(', ')}`;
                }

                if (activity.age_group) {
                    description += `. Suitable for ${activity.age_group}.`;
                }

                events.push({
                    id: currentId++,
                    title: title,
                    startDate: startDate,
                    endDate: endDate,
                    location: venue,
                    description: description,
                    category: category,
                    day: day
                });
            });
        });
    });

    events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function processTimeString(timeString, dayString) {
    const dayOfWeek = dayString.split(' ')[0];
    const dateStr = dayString.split(' ')[1] || dayString;
    
    const dateParts = dateStr.match(/(\d+)\.(\d+)\.(\d+)/);

    if (!dateParts) {
        console.error('Cannot parse date from day string:', dayString);
        const now = new Date();
        return {
            startDate: now.toISOString(),
            endDate: new Date(now.getTime() + 3600000).toISOString() // 1 hour later
        };
    }

    const day = dateParts[1];
    const month = dateParts[2];
    const year = dateParts[3];

    console.log(`Processing date: ${dayString} -> ${day}.${month}.${year} (${dayOfWeek})`);

    const timeParts = timeString.split(' - ');
    if (timeParts.length !== 2) {
        console.error('Cannot parse time range:', timeString);
        const baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return {
            startDate: baseDate.toISOString(),
            endDate: new Date(baseDate.getTime() + 3600000).toISOString() // 1 hour later
        };
    }

    const startDateTime = parseTimeString(`${day}.${month}.${year}T${timeParts[0]}`);
    if (!startDateTime) {
        console.error('Invalid start time format:', timeParts[0]);
        const baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return {
            startDate: baseDate.toISOString(),
            endDate: new Date(baseDate.getTime() + 3600000).toISOString() // 1 hour later
        };
    }

    const endDateTime = parseTimeString(`${day}.${month}.${year}T${timeParts[1]}`);
    if (!endDateTime) {
        console.error('Invalid end time format:', timeParts[1]);
        return {
            startDate: startDateTime.toISOString(),
            endDate: new Date(startDateTime.getTime() + 3600000).toISOString() // 1 hour later
        };
    }

    console.log(`Parsed time range: ${timeString}`);
    console.log(`Start: ${startDateTime.toString()} (${startDateTime.toISOString()})`);
    console.log(`End: ${endDateTime.toString()} (${endDateTime.toISOString()})`);

    return {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString()
    };
}

function parseTimeString(dateTimeString) {
    try {
        console.log('Parsing datetime string:', dateTimeString);
        
        const matches = dateTimeString.match(/(\d+)\.(\d+)\.(\d+)T(\d+):(\d+)(am|pm)/i);

        if (!matches) {
            console.error('Cannot parse datetime string:', dateTimeString);
            return null;
        }

        const day = parseInt(matches[1]);
        const month = parseInt(matches[2]) - 1; // Months are 0-based in JS Date
        const year = parseInt(matches[3]);
        let hour = parseInt(matches[4]);
        const minute = parseInt(matches[5]);
        const period = matches[6].toLowerCase();

        if (period === 'pm' && hour < 12) {
            hour += 12;
        } else if (period === 'am' && hour === 12) {
            hour = 0;
        }

        if (month < 0 || month > 11 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            console.error('Invalid date components:', { year, month, day, hour, minute });
            return null;
        }

        const date = new Date(year, month, day, hour, minute);
        console.log(`Created date: ${date.toString()} from components:`, { year, month: month+1, day, hour, minute, period });
        
        return date;
    } catch (error) {
        console.error('Error parsing time string:', error);
        return null;
    }
}

const eventsList = document.getElementById('events-list');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const selectAllButton = document.getElementById('select-all');
const deselectAllButton = document.getElementById('deselect-all');
const generateIcsButton = document.getElementById('generate-ics');

function populateCategoryFilter() {
    const days = [...new Set(events.map(event => event.day))];
    days.forEach(day => {
        const option = document.createElement('option');
        option.value = `day:${day}`;
        option.textContent = day;
        categoryFilter.appendChild(option);
    });

    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '------- Venues -------';
    categoryFilter.appendChild(separator);

    const categories = [...new Set(events.map(event => event.category))];
    categories.sort(); // Sort alphabetically
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = `venue:${category}`;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Perth',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

function displayEvents() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedFilter = categoryFilter.value;

    eventsList.innerHTML = '';

    const isDay = selectedFilter.startsWith('day:');
    const isVenue = selectedFilter.startsWith('venue:');
    const filterValue = selectedFilter.substring(selectedFilter.indexOf(':') + 1);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm) ||
                             event.description.toLowerCase().includes(searchTerm);

        let matchesFilter = true;

        if (isDay) {
            matchesFilter = event.day === filterValue;
        } else if (isVenue) {
            matchesFilter = event.category === filterValue;
        }

        return matchesSearch && matchesFilter;
    });

    filteredEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <h2>${event.title}</h2>
            <div class="event-time">
                ${formatDate(event.startDate)} - ${formatDate(event.endDate)}
            </div>
            <div class="event-day">${event.day}</div>
            <div class="event-category">${event.category}</div>
            <div class="event-location"><strong>Location:</strong> ${event.location}</div>
            <p class="event-description">${event.description}</p>
            <div class="event-actions">
                <div class="event-checkbox">
                    <input type="checkbox" id="event-${event.id}" data-event-id="${event.id}">
                    <label for="event-${event.id}">Add to calendar</label>
                </div>
                <button class="download-ics-btn" data-event-id="${event.id}">Download ICS</button>
            </div>
        `;
        eventsList.appendChild(eventCard);

        const downloadButton = eventCard.querySelector('.download-ics-btn');
        downloadButton.addEventListener('click', () => {
            generateSingleEventIcs(event.id);
        });
    });

    if (filteredEvents.length === 0) {
        eventsList.innerHTML = `
            <div class="no-events-message">
                <h2>No events found</h2>
                <p>Try adjusting your search criteria or selecting a different category.</p>
            </div>
        `;
    }
}

function createIcalTime(dateString) {
    const date = new Date(dateString);
    
    const icalTime = new ICAL.Time();
    
    icalTime.year = date.getFullYear();
    icalTime.month = date.getMonth() + 1; // ICAL months are 1-based
    icalTime.day = date.getDate();
    icalTime.hour = date.getHours();
    icalTime.minute = date.getMinutes();
    icalTime.second = date.getSeconds();
    
    icalTime.zone = ICAL.Timezone.localTimezone;
    
    return icalTime;
}

function createVEvent(event) {
    const vevent = new ICAL.Component(['vevent', [], []]);

    const now = new ICAL.Time();
    now.fromJSDate(new Date());
    now.zone = ICAL.Timezone.utcTimezone;

    vevent.updatePropertyWithValue('uid', `event-${event.id}@schedule-app`);
    vevent.updatePropertyWithValue('dtstamp', now);

    console.log('Event:', event.title);
    console.log('Raw startDate:', event.startDate);
    console.log('Raw endDate:', event.endDate);
    
    const startJSDate = new Date(event.startDate);
    const endJSDate = new Date(event.endDate);
    
    console.log('JS startDate:', startJSDate.toString());
    console.log('JS endDate:', endJSDate.toString());

    const startTime = createIcalTime(event.startDate);
    const endTime = createIcalTime(event.endDate);
    
    console.log('ICAL startTime:', startTime.toString());
    console.log('ICAL endTime:', endTime.toString());

    const dtstart = vevent.addPropertyWithValue('dtstart', startTime);
    
    const dtend = vevent.addPropertyWithValue('dtend', endTime);

    vevent.updatePropertyWithValue('summary', event.title);
    vevent.updatePropertyWithValue('description', event.description);
    vevent.updatePropertyWithValue('location', event.location);

    return vevent;
}

function createCalendar() {
    const cal = new ICAL.Component(['vcalendar', [], []]);
    cal.updatePropertyWithValue('prodid', '-//Schedule App//EN');
    cal.updatePropertyWithValue('version', '2.0');
    cal.updatePropertyWithValue('calscale', 'GREGORIAN');
    cal.updatePropertyWithValue('method', 'PUBLISH');
    
    
    return cal;
}

function downloadIcsFile(icsString, filename) {
    const blob = new Blob([icsString], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

function generateSingleEventIcs(eventId) {
    if (typeof ICAL === 'undefined') {
        alert('Calendar generation library not loaded. Please check your internet connection and refresh the page.');
        console.error('ICAL.js library not loaded. Make sure the script is properly included in the HTML file.');
        return;
    }

    try {
        const event = events.find(e => e.id === eventId);

        if (!event) {
            console.error('Event not found with ID:', eventId);
            return;
        }

        console.log('Generating calendar for event:', event);
        console.log('Event date/time:', event.startDate, 'to', event.endDate);
        console.log('In local format:', new Date(event.startDate).toString(), 'to', new Date(event.endDate).toString());

        const cal = createCalendar();
        cal.addSubcomponent(createVEvent(event));

        const icsString = cal.toString();
        console.log('Generated ICS content:', icsString);
        
        const filename = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
        downloadIcsFile(icsString, filename);

        console.log(`Calendar event "${event.title}" generated successfully!`);
    } catch (error) {
        console.error('Error generating calendar file:', error);
        alert('There was an error generating the calendar file: ' + error.message);
    }
}

function generateIcs() {
    if (typeof ICAL === 'undefined') {
        alert('Calendar generation library not loaded. Please check your internet connection and refresh the page.');
        console.error('ICAL.js library not loaded. Make sure the script is properly included in the HTML file.');
        return;
    }

    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        alert('Please select at least one event.');
        return;
    }

    try {
        const selectedEventIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.eventId));
        const selectedEvents = events.filter(event => selectedEventIds.includes(event.id));

        const cal = createCalendar();

        selectedEvents.forEach(event => {
            cal.addSubcomponent(createVEvent(event));
        });

        const icsString = cal.toString();
        downloadIcsFile(icsString, 'nannup-events.ics');

        console.log("Calendar generated successfully!");
        alert('Calendar events have been generated successfully. The events should now appear at the correct local time.');
    } catch (error) {
        console.error('Error generating calendar file:', error);
        alert('There was an error generating the calendar file: ' + error.message);
    }
}

searchInput.addEventListener('input', displayEvents);
categoryFilter.addEventListener('change', displayEvents);

selectAllButton.addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
});

deselectAllButton.addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
});

generateIcsButton.addEventListener('click', generateIcs);
