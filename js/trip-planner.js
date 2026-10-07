document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tripPlannerForm');
  const result = document.getElementById('tripPlannerResult');
  if (!form || !result) return;

  const dateField = document.getElementById('planner-date');
  const today = new Date();
  dateField.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fleet = [
    { key: 'Aura', name: 'Hyundai Aura', seats: 4, dailyRate: 3900, extraKmRate: 14 },
    { key: 'Dzire', name: 'Maruti Suzuki Dzire', seats: 4, dailyRate: 4200, extraKmRate: 13 },
    { key: 'Ertiga', name: 'Maruti Suzuki Ertiga', seats: 7, dailyRate: 4800, extraKmRate: 16 },
    { key: 'Innova', name: 'Toyota Innova Crysta', seats: 7, dailyRate: 6600, extraKmRate: 22 }
  ];
  const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const geocodeCache = new Map();
  let lastGeocodeAt = 0;
  let requestInProgress = false;

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const geocodeIndiaPlace = async place => {
    const cacheKey = place.trim().toLocaleLowerCase();
    if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

    const delay = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
    if (delay) await wait(delay);
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q: place,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'in',
      limit: '1'
    });
    lastGeocodeAt = Date.now();
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Location lookup is temporarily unavailable. Please try again in a moment.');
    const results = await response.json();
    const match = results.find(item => item.address?.country_code?.toLowerCase() === 'in');
    if (!match) throw new Error(`We couldn't find "${place}" in India. Enter a valid Indian city, town or address.`);

    const location = {
      lat: Number(match.lat),
      lon: Number(match.lon),
      label: match.display_name.split(',').slice(0, 3).join(',')
    };
    geocodeCache.set(cacheKey, location);
    return location;
  };

  const getRoadDistanceKm = async (start, end) => {
    const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&steps=false`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('We could not calculate a drivable road route for these locations. Check both places and try again.');
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No drivable road route was found between these Indian locations. Please check the pickup and destination.');
    }
    return data.routes[0].distance / 1000;
  };

  const showError = message => {
    result.replaceChildren();
    result.textContent = message;
    result.classList.remove('is-success');
    result.classList.add('is-error');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestInProgress) return;

    const button = form.querySelector('[type="submit"]');
    const originalButton = button?.innerHTML;
    const data = new FormData(form);
    const pickup = String(data.get('pickup')).trim();
    const destination = String(data.get('destination')).trim();
    const date = String(data.get('date'));
    const days = Number(data.get('days'));
    const passengers = Number(data.get('passengers'));
    const vehicle = fleet.filter(car => car.seats >= passengers).sort((a, b) => a.dailyRate - b.dailyRate)[0];

    if (!vehicle) {
      showError('Our listed vehicles seat up to 7 passengers. Call +91 95613 45579 and we will help arrange a suitable option.');
      return;
    }

    requestInProgress = true;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span>Checking Indian road route...</span><i class="fas fa-spinner fa-spin"></i>';
    }
    result.replaceChildren();
    result.classList.remove('is-error', 'is-success');

    try {
      const start = await geocodeIndiaPlace(pickup);
      const end = await geocodeIndiaPlace(destination);
      const oneWayKm = await getRoadDistanceKm(start, end);
      const returnKm = await getRoadDistanceKm(end, start);
      const roundTripKm = Math.ceil(oneWayKm + returnKm);
      const includedKm = days * 300;
      const extraKm = Math.max(0, roundTripKm - includedKm);
      const packageFare = days * vehicle.dailyRate;
      const extraKmFare = extraKm * vehicle.extraKmRate;
      const estimate = packageFare + extraKmFare;

      const summary = document.createElement('p');
      summary.textContent = `${start.label} to ${end.label}: about ${Math.round(oneWayKm)} km going and ${Math.round(returnKm)} km returning (${roundTripKm} km total). ${days} day(s) include ${includedKm} km. Recommended: ${vehicle.name} (${vehicle.seats} seats). Estimated fare: ${money(packageFare)} package${extraKm ? ` + ${extraKm} extra km at ${money(vehicle.extraKmRate)}/km = ${money(estimate)}` : ''}.`;
      result.append(summary);

      const note = document.createElement('small');
      note.textContent = 'Road distances are estimates from OpenStreetMap routing. Fare excludes tolls, parking, state taxes and route changes. The team will confirm the final fare.';
      result.append(note);

      const attribution = document.createElement('small');
      attribution.className = 'trip-planner-attribution';
      attribution.append('Place and map data © ');
      const attributionLink = document.createElement('a');
      attributionLink.href = 'https://www.openstreetmap.org/copyright';
      attributionLink.target = '_blank';
      attributionLink.rel = 'noopener noreferrer';
      attributionLink.textContent = 'OpenStreetMap contributors';
      attribution.append(attributionLink, '.');
      result.append(attribution);

      const link = document.createElement('a');
      const bookingNotes = `Smart Trip Planner: approx. ${Math.round(oneWayKm)} km going + ${Math.round(returnKm)} km returning (${roundTripKm} km total), ${days} day(s), estimated fare ${money(estimate)}${extraKm ? ` including ${extraKm} extra km` : ''}.`;
      const query = new URLSearchParams({
        vehicle: vehicle.key,
        pickup,
        destination,
        travel_date: date,
        passengers: String(passengers),
        notes: bookingNotes
      });
      link.href = `booking.html?${query.toString()}`;
      link.className = 'pricing-btn';
      link.textContent = 'Continue to booking';
      result.append(link);
      result.classList.add('is-success');
    } catch (error) {
      showError(error.message || 'We could not build this trip plan. Please check the locations and try again.');
    } finally {
      requestInProgress = false;
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });
});
