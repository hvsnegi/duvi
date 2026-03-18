const ROUTE = [
  { name: 'Dehradun',           estimatedMinutesFromStart: 0   },
  { name: 'Rishikesh',          estimatedMinutesFromStart: 45  },
  { name: 'Shivpuri',           estimatedMinutesFromStart: 75  },
  { name: 'Byasi',              estimatedMinutesFromStart: 95  },
  { name: 'Devprayag',          estimatedMinutesFromStart: 125 },
  { name: 'Srinagar (Garhwal)', estimatedMinutesFromStart: 155 },
  { name: 'Rudraprayag',        estimatedMinutesFromStart: 185 },
  { name: 'Augustmuni',         estimatedMinutesFromStart: 215 },
  { name: 'Karnprayag',         estimatedMinutesFromStart: 235 },
  { name: 'Garud',              estimatedMinutesFromStart: 245 },
];

// Get all stops between start and end inclusive
function getStopsInRange(startStop, endStop) {
  const startIndex = ROUTE.findIndex(s => s.name === startStop);
  const endIndex = ROUTE.findIndex(s => s.name === endStop);
  return ROUTE.slice(startIndex, endIndex + 1);
}

// Calculate estimated time at each stop
function calculateStopTimes(startStop, departureTime) {
  const stops = getStopsInRange(startStop, 'Garud');
  const startMinutes = ROUTE.find(s => s.name === startStop).estimatedMinutesFromStart;
  const [hours, mins] = departureTime.split(':').map(Number);
  const departureInMinutes = hours * 60 + mins;

  return stops.map(stop => {
    const offset = stop.estimatedMinutesFromStart - startMinutes;
    const arrivalInMinutes = departureInMinutes + offset;
    const h = Math.floor(arrivalInMinutes / 60) % 24;
    const m = arrivalInMinutes % 60;
    return {
      location: stop.name,
      estimatedTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    };
  });
}

// Check if pickup comes before dropoff on route
function isValidRoute(pickup, dropoff) {
  const pickupIndex = ROUTE.findIndex(s => s.name === pickup);
  const dropoffIndex = ROUTE.findIndex(s => s.name === dropoff);
  return pickupIndex < dropoffIndex;
}

// Check if start comes before end
function isValidStartEnd(start, end) {
  const startIndex = ROUTE.findIndex(s => s.name === start);
  const endIndex = ROUTE.findIndex(s => s.name === end);
  return endIndex > startIndex;
}

module.exports = {
  ROUTE,
  getStopsInRange,
  calculateStopTimes,
  isValidRoute,
  isValidStartEnd
};